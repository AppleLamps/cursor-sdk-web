export type StepState = "pending" | "active" | "done" | "error";

export type TraceStepKind = "status" | "thinking" | "task" | "tool" | "note";

export interface TraceStep {
  id: string;
  kind: TraceStepKind;
  label: string;
  detail?: string;
  state: StepState;
}

export type TraceStreamEvent =
  | { type: "log"; level: "info" | "error"; message: string }
  | { type: "thinking"; text: string }
  | { type: "task"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool"; callId: string; name: string; status: string; args?: unknown }
  | { type: "status"; status: string };

const STATUS_LABELS: Record<string, string> = {
  CREATING: "Starting cloud sandbox",
  RUNNING: "Agent is working",
  FINISHED: "Run complete",
  ERROR: "Run failed",
  CANCELLED: "Run cancelled",
  EXPIRED: "Run expired",
};

export function createInitialTrace(): TraceStep[] {
  return [
    {
      id: "boot",
      kind: "note",
      label: "Connecting to Cursor cloud agent…",
      state: "active",
    },
  ];
}

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

function extractPath(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined;
  const record = args as Record<string, unknown>;
  for (const key of ["path", "file_path", "filePath", "target_file", "targetFile"]) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return undefined;
}

function extractPattern(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined;
  const record = args as Record<string, unknown>;
  for (const key of ["pattern", "query", "glob", "regex"]) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return undefined;
}

export function formatToolLabel(name: string, args?: unknown): string {
  const tool = name.toLowerCase();
  const path = extractPath(args);
  const file = path ? basename(path) : undefined;
  const pattern = extractPattern(args);

  if (tool.includes("edit") || tool === "search_replace" || tool === "str_replace") {
    return file ? `Editing ${file}` : "Editing file";
  }
  if (tool.includes("write") || tool === "create") {
    return file ? `Writing ${file}` : "Writing file";
  }
  if (tool.includes("read") || tool === "cat") {
    return file ? `Reading ${file}` : "Reading file";
  }
  if (tool.includes("grep") || tool.includes("search") || tool === "glob") {
    return pattern ? `Searching for “${truncate(pattern, 40)}”` : "Searching codebase";
  }
  if (tool.includes("shell") || tool === "bash" || tool === "run_terminal_cmd") {
    return "Running command";
  }
  if (tool.includes("list") || tool === "ls") {
    return file ? `Listing ${file}` : "Listing files";
  }
  if (tool.includes("delete") || tool === "remove") {
    return file ? `Removing ${file}` : "Removing file";
  }

  const readable = name.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function markActiveDone(steps: TraceStep[]): TraceStep[] {
  return steps.map((s) =>
    s.state === "active" && s.kind !== "thinking" ? { ...s, state: "done" as const } : s,
  );
}

function upsertStep(steps: TraceStep[], step: TraceStep): TraceStep[] {
  const index = steps.findIndex((s) => s.id === step.id);
  if (index === -1) return [...steps, step];
  const next = [...steps];
  next[index] = { ...next[index], ...step };
  return next;
}

export function applyTraceEvent(steps: TraceStep[], event: TraceStreamEvent): TraceStep[] {
  switch (event.type) {
    case "log": {
      if (event.level === "error") {
        return upsertStep(steps, {
          id: "error",
          kind: "note",
          label: event.message,
          state: "error",
        });
      }
      return upsertStep(steps, {
        id: "boot",
        kind: "note",
        label: event.message,
        state: "done",
      });
    }

    case "status": {
      const label = STATUS_LABELS[event.status] ?? `Status: ${event.status}`;
      const isTerminal = ["FINISHED", "ERROR", "CANCELLED", "EXPIRED"].includes(event.status);
      let next = markActiveDone(steps);
      next = upsertStep(next, {
        id: `status-${event.status}`,
        kind: "status",
        label,
        state: isTerminal ? (event.status === "FINISHED" ? "done" : "error") : "active",
      });
      return next;
    }

    case "task": {
      let next = markActiveDone(steps);
      const id = `task-${hashString(event.text)}`;
      next = upsertStep(next, {
        id,
        kind: "task",
        label: event.text,
        state: "active",
      });
      return next;
    }

    case "thinking": {
      const text = event.text.trim();
      if (!text) return steps;

      const existing = steps.find((s) => s.id === "thinking");
      const detail = existing?.detail ? `${existing.detail}${text}` : text;

      return upsertStep(steps, {
        id: "thinking",
        kind: "thinking",
        label: "Thinking",
        detail: truncate(detail, 600),
        state: "active",
      });
    }

    case "tool": {
      let next = steps.map((s) =>
        s.id === "thinking" && s.state === "active" ? { ...s, state: "done" as const } : s,
      );

      const label = formatToolLabel(event.name, event.args);
      const state: StepState =
        event.status === "completed"
          ? "done"
          : event.status === "error"
            ? "error"
            : "active";

      next = upsertStep(next, {
        id: `tool-${event.callId}`,
        kind: "tool",
        label,
        state,
      });
      return next;
    }

    case "assistant": {
      const text = event.text.trim();
      if (!text) return steps;

      let next = steps.map((s) =>
        s.state === "active" && (s.kind === "thinking" || s.kind === "task")
          ? { ...s, state: "done" as const }
          : s,
      );

      const id = `assistant-${hashString(text.slice(0, 80))}`;
      if (next.some((s) => s.id === id)) return next;

      return [
        ...next,
        {
          id,
          kind: "note" as const,
          label: truncate(text, 120),
          detail: text.length > 120 ? text : undefined,
          state: "done" as const,
        },
      ];
    }

    default:
      return steps;
  }
}

export function finalizeTrace(steps: TraceStep[]): TraceStep[] {
  return steps.map((s) =>
    s.state === "active" ? { ...s, state: "done" as const } : s,
  );
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
