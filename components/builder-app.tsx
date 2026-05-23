"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";
import { DevPanel } from "@/components/dev-panel";
import { PreviewFrame } from "@/components/preview-frame";
import { StreamPanel, type StreamEntry } from "@/components/stream-panel";
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
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentId, setAgentId] = useState<string | undefined>(session.agentId);
  const [lastRunId, setLastRunId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showDev, setShowDev] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canExport = Boolean(previewHtml) && !isGenerating;

  const pushStream = useCallback((entry: StreamEntry) => {
    setStreamEntries((prev) => [...prev.slice(-80), entry]);
  }, []);

  const refreshPreview = useCallback(async (sessionId: string) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(`/api/site/${sessionId}`);
      if (res.ok) {
        const data = (await res.json()) as { previewHtml: string };
        setPreviewHtml(data.previewHtml);
        return true;
      }
      await new Promise((r) => setTimeout(r, 2000 + attempt * 1000));
    }
    return false;
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setError(null);
      setIsGenerating(true);
      setStreamEntries([]);
      setMessages((prev) => [...prev, { role: "user", content: prompt }]);

      pushStream({ kind: "info", text: "Connecting to Cursor cloud agent…" });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
            pushStream({
              kind: payload.level === "error" ? "error" : "info",
              text: payload.message,
            });
          } else if (event === "assistant") {
            const payload = data as { text: string };
            assistantText += payload.text;
            pushStream({ kind: "assistant", text: payload.text });
          } else if (event === "tool") {
            const payload = data as { name: string; status: string };
            pushStream({
              kind: "tool",
              text: `${payload.name} → ${payload.status}`,
            });
          } else if (event === "status") {
            const payload = data as { status: string };
            pushStream({ kind: "status", text: payload.status });
          } else if (event === "done") {
            donePayload = data as DonePayload;
            setAgentId(donePayload.agentId);
            setLastRunId(donePayload.runId);
            const nextSession = { ...session, agentId: donePayload.agentId };
            setSession(nextSession);
            saveSession(nextSession);
            pushStream({
              kind: donePayload.status === "finished" ? "success" : "error",
              text: `Run ${donePayload.runId} finished: ${donePayload.status}`,
            });
            if (donePayload.error) {
              setError(donePayload.error);
            }
          } else if (event === "error") {
            const payload = data as { message: string };
            setError(payload.message);
            pushStream({ kind: "error", text: payload.message });
          }
        });

        if (assistantText.trim()) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantText.trim() },
          ]);
        } else if (donePayload?.status === "finished") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Site updated. Refreshing preview…",
            },
          ]);
        }

        if (donePayload?.status === "finished") {
          const loaded = await refreshPreview(session.sessionId);
          if (!loaded) {
            setError(
              "Agent finished but preview files are not on GitHub yet. Check your template repo and token.",
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        setError(message);
        pushStream({ kind: "error", text: message });
      } finally {
        setIsGenerating(false);
      }
    },
    [agentId, pushStream, refreshPreview, session],
  );

  const handleNewSite = () => {
    const next = resetSession();
    setSession(next);
    setAgentId(undefined);
    setLastRunId(undefined);
    setMessages([]);
    setStreamEntries([]);
    setPreviewHtml("");
    setError(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const sessionLabel = useMemo(
    () => `${session.sessionId.slice(0, 8)}…`,
    [session.sessionId],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Cursor SDK showcase</p>
          <h1 className={styles.title}>Describe a site. Export the code.</h1>
          <p className={styles.lede}>
            A cloud agent builds vanilla HTML, CSS, and JavaScript in an isolated
            sandbox. No frameworks. No lock-in.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryBtn} onClick={handleNewSite}>
            New site
          </button>
          <a
            className={styles.secondaryBtn}
            href="https://cursor.com/docs/sdk/typescript"
            target="_blank"
            rel="noreferrer"
          >
            SDK docs
          </a>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSubmit={handleGenerate}
            messagesEndRef={messagesEndRef}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
        </section>

        <section className={styles.panel}>
          <PreviewFrame
            html={previewHtml}
            widthMode={previewWidth}
            onWidthModeChange={setPreviewWidth}
            canExport={canExport}
            exportUrl={`/api/export/${session.sessionId}`}
            isLoading={isGenerating && !previewHtml}
          />
        </section>
      </div>

      <div className={styles.lower}>
        <StreamPanel entries={streamEntries} />
        <DevPanel
          open={showDev}
          onToggle={() => setShowDev((v) => !v)}
          sessionId={sessionLabel}
          agentId={agentId}
          runId={lastRunId}
        />
      </div>
    </div>
  );
}
