"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";
import { PreviewFrame } from "@/components/preview-frame";
import { ResizeHandle } from "@/components/resize-handle";
import { StreamPanel, type StreamEntry } from "@/components/stream-panel";
import {
  applyTraceEvent,
  createInitialTrace,
  finalizeTrace,
  formatToolLabel,
  type TraceStep,
  type TraceStreamEvent,
} from "@/lib/agent-trace";
import { downloadExport, getAuthHeaders } from "@/lib/client-api";
import { clampWidth, loadChatWidth, saveChatWidth } from "@/lib/panel-width";
import { loadSession, resetSession, saveSession } from "@/lib/session";
import styles from "./builder-app.module.css";

interface DonePayload {
  agentId: string;
  runId: string;
  status: string;
  error?: string;
}

async function readSse(
  response: Response,
  onEvent: (event: string, data: unknown) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "message";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }

      if (data) {
        try {
          onEvent(event, JSON.parse(data));
        } catch {
          onEvent(event, data);
        }
      }
    }
  }
}

export function BuilderApp() {
  const [session, setSession] = useState(loadSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamEntries, setStreamEntries] = useState<StreamEntry[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentId, setAgentId] = useState<string | undefined>(session.agentId);
  const [lastRunId, setLastRunId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [chatWidth, setChatWidth] = useState(360);
  const [liveTrace, setLiveTrace] = useState<TraceStep[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const chatWidthRef = useRef(chatWidth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<TraceStep[]>([]);

  const canExport = Boolean(previewHtml) && !isGenerating;

  useEffect(() => {
    setChatWidth(loadChatWidth());
  }, []);

  useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  useEffect(() => {
    const onWindowResize = () => {
      setChatWidth((w) => clampWidth(w));
    };
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, []);

  const pushStream = useCallback((entry: StreamEntry) => {
    setStreamEntries((prev) => [...prev.slice(-100), entry]);
  }, []);

  const refreshPreview = useCallback(async (sessionId: string) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(`/api/site/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = (await res.json()) as { previewHtml: string };
        setPreviewHtml(data.previewHtml);
        setPreviewKey((k) => k + 1);
        return true;
      }
      await new Promise((r) => setTimeout(r, 2000 + attempt * 1000));
    }
    return false;
  }, []);

  const applyTrace = useCallback((event: TraceStreamEvent) => {
    traceRef.current = applyTraceEvent(traceRef.current, event);
    setLiveTrace(traceRef.current);
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setError(null);
      setIsGenerating(true);
      setStreamEntries([]);
      traceRef.current = createInitialTrace();
      setLiveTrace(traceRef.current);
      setMessages((prev) => [...prev, { role: "user", content: prompt }]);

      pushStream({ kind: "info", text: "Connecting to Cursor cloud agent…" });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            sessionId: session.sessionId,
            prompt,
            agentId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        let assistantText = "";
        let donePayload: DonePayload | undefined;

        await readSse(response, (event, data) => {
          if (event === "log") {
            const payload = data as { message: string; level: string };
            applyTrace({ type: "log", level: payload.level as "info" | "error", message: payload.message });
            pushStream({
              kind: payload.level === "error" ? "error" : "info",
              text: payload.message,
            });
          } else if (event === "thinking") {
            const payload = data as { text: string };
            applyTrace({ type: "thinking", text: payload.text });
            pushStream({ kind: "assistant", text: `[thinking] ${payload.text}` });
          } else if (event === "task") {
            const payload = data as { text: string };
            applyTrace({ type: "task", text: payload.text });
            pushStream({ kind: "status", text: payload.text });
          } else if (event === "assistant") {
            const payload = data as { text: string };
            assistantText += payload.text;
            applyTrace({ type: "assistant", text: payload.text });
            pushStream({ kind: "assistant", text: payload.text });
          } else if (event === "tool") {
            const payload = data as {
              callId: string;
              name: string;
              status: string;
              args?: unknown;
            };
            applyTrace({
              type: "tool",
              callId: payload.callId,
              name: payload.name,
              status: payload.status,
              args: payload.args,
            });
            pushStream({
              kind: "tool",
              text: `${formatToolLabel(payload.name, payload.args)} → ${payload.status}`,
            });
          } else if (event === "status") {
            const payload = data as { status: string };
            applyTrace({ type: "status", status: payload.status });
            pushStream({ kind: "status", text: payload.status });
          } else if (event === "done") {
            donePayload = data as DonePayload;
            applyTrace({ type: "status", status: "FINISHED" });
            setAgentId(donePayload.agentId);
            setLastRunId(donePayload.runId);
            const nextSession = { ...session, agentId: donePayload.agentId };
            setSession(nextSession);
            saveSession(nextSession);
            pushStream({
              kind: donePayload.status === "finished" ? "success" : "error",
              text: `Run finished: ${donePayload.status}`,
            });
            if (donePayload.error) setError(donePayload.error);
          } else if (event === "error") {
            const payload = data as { message: string };
            applyTrace({ type: "log", level: "error", message: payload.message });
            setError(payload.message);
            pushStream({ kind: "error", text: payload.message });
          }
        });

        const savedTrace = finalizeTrace(traceRef.current);

        if (assistantText.trim()) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantText.trim(), trace: savedTrace },
          ]);
        } else if (donePayload?.status === "finished") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Done — preview updated.",
              trace: savedTrace,
            },
          ]);
        } else if (savedTrace.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: donePayload?.error ?? "Run finished.",
              trace: savedTrace,
            },
          ]);
        }

        setLiveTrace([]);

        if (donePayload?.status === "finished") {
          const loaded = await refreshPreview(session.sessionId);
          if (!loaded) {
            setError("Preview not ready yet. Check template repo and GitHub token.");
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        applyTrace({ type: "log", level: "error", message });
        setError(message);
        pushStream({ kind: "error", text: message });
        const savedTrace = finalizeTrace(traceRef.current);
        if (savedTrace.length > 0) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: message, trace: savedTrace },
          ]);
        }
        setLiveTrace([]);
      } finally {
        setIsGenerating(false);
      }
    },
    [agentId, applyTrace, pushStream, refreshPreview, session],
  );

  const handleExport = useCallback(async () => {
    if (!canExport) return;
    setIsExporting(true);
    setError(null);
    try {
      await downloadExport(session.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [canExport, session.sessionId]);

  const handleNewSite = () => {
    const next = resetSession();
    setSession(next);
    setAgentId(undefined);
    setLastRunId(undefined);
    setMessages([]);
    setStreamEntries([]);
    setLiveTrace([]);
    traceRef.current = [];
    setPreviewHtml("");
    setPreviewKey(0);
    setError(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, liveTrace]);

  const sessionLabel = useMemo(
    () => session.sessionId.slice(0, 8),
    [session.sessionId],
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.chatColumn} style={{ width: chatWidth }}>
        <ChatPanel
          messages={messages}
          isGenerating={isGenerating}
          liveTrace={liveTrace}
          error={error}
          onDismissError={() => setError(null)}
          onSubmit={handleGenerate}
          onNewSite={handleNewSite}
          messagesEndRef={messagesEndRef}
          showActivity={showActivity}
          onToggleActivity={() => setShowActivity((v) => !v)}
          activityCount={streamEntries.length}
        />

        {showActivity ? (
          <div className={styles.activityDrawer}>
            <StreamPanel entries={streamEntries} isLive={isGenerating} compact />
          </div>
        ) : null}
      </aside>

      <ResizeHandle
        getWidth={() => chatWidthRef.current}
        onResize={(w) => setChatWidth(clampWidth(w))}
        onResizeEnd={(w) => saveChatWidth(clampWidth(w))}
      />

      <main className={styles.playground}>
        <PreviewFrame
          html={previewHtml}
          previewKey={previewKey}
          widthMode={previewWidth}
          onWidthModeChange={setPreviewWidth}
          canExport={canExport}
          onExport={handleExport}
          isExporting={isExporting}
          isLoading={isGenerating && !previewHtml}
          isRefreshing={isGenerating && Boolean(previewHtml)}
          onRefresh={() => refreshPreview(session.sessionId)}
          showDev={showDev}
          onToggleDev={() => setShowDev((v) => !v)}
          sessionLabel={sessionLabel}
          agentId={agentId}
          runId={lastRunId}
        />
      </main>
    </div>
  );
}
