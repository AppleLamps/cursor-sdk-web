import { Agent, type AgentOptions, CursorAgentError } from "@cursor/sdk";

export function getAgentOptions(): AgentOptions {
  const apiKey = process.env.CURSOR_API_KEY;
  const repoUrl = process.env.TEMPLATE_REPO_URL;
  const ref = process.env.TEMPLATE_REPO_REF ?? "main";
  const modelId = process.env.CURSOR_MODEL ?? "composer-2.5";

  if (!apiKey) {
    throw new Error("Missing CURSOR_API_KEY");
  }
  if (!repoUrl) {
    throw new Error("Missing TEMPLATE_REPO_URL");
  }

  return {
    apiKey,
    model: { id: modelId },
    cloud: {
      repos: [{ url: repoUrl, startingRef: ref }],
      autoCreatePR: false,
      skipReviewerRequest: true,
    },
  };
}

export { Agent, CursorAgentError };

export type StreamEventPayload =
  | { type: "log"; level: "info" | "error"; message: string }
  | { type: "thinking"; text: string }
  | { type: "task"; text: string }
  | { type: "assistant"; text: string }
  | {
      type: "tool";
      callId: string;
      name: string;
      status: string;
      args?: unknown;
    }
  | { type: "status"; status: string }
  | {
      type: "done";
      agentId: string;
      runId: string;
      status: string;
      durationMs?: number;
      error?: string;
    };

export function serializeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function runAgentGeneration(options: {
  prompt: string;
  agentId?: string;
  onEvent: (payload: StreamEventPayload) => void;
}): Promise<{ agentId: string; runId: string; status: string }> {
  const agentOptions = getAgentOptions();

  await using agent = options.agentId
    ? await Agent.resume(options.agentId, agentOptions)
    : await Agent.create(agentOptions);

  options.onEvent({
    type: "log",
    level: "info",
    message: `Agent ${agent.agentId} (${options.agentId ? "resumed" : "created"})`,
  });

  try {
    const run = await agent.send(options.prompt);

    options.onEvent({
      type: "log",
      level: "info",
      message: `Run ${run.id} started`,
    });

    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text" && block.text.trim()) {
            options.onEvent({ type: "assistant", text: block.text });
          }
        }
      } else if (event.type === "thinking") {
        if (event.text?.trim()) {
          options.onEvent({ type: "thinking", text: event.text });
        }
      } else if (event.type === "task") {
        if (event.text?.trim()) {
          options.onEvent({ type: "task", text: event.text });
        }
      } else if (event.type === "tool_call") {
        options.onEvent({
          type: "tool",
          callId: event.call_id,
          name: event.name,
          status: event.status,
          args: event.args,
        });
      } else if (event.type === "status") {
        options.onEvent({ type: "status", status: event.status });
      }
    }

    const result = await run.wait();

    if (result.status !== "finished") {
      options.onEvent({
        type: "done",
        agentId: agent.agentId,
        runId: result.id,
        status: result.status,
        durationMs: result.durationMs,
        error: `Run ended with status: ${result.status}`,
      });
      return { agentId: agent.agentId, runId: result.id, status: result.status };
    }

    options.onEvent({
      type: "done",
      agentId: agent.agentId,
      runId: result.id,
      status: result.status,
      durationMs: result.durationMs,
    });

    return { agentId: agent.agentId, runId: result.id, status: result.status };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw err;
    }
    throw err;
  }
}
