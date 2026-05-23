"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";
import { DevPanel } from "@/components/dev-panel";
import { PreviewFrame } from "@/components/preview-frame";
import { SiteFooter } from "@/components/site-footer";
import { StatusBar, type AgentPhase } from "@/components/status-bar";
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

function derivePhase(
  isGenerating: boolean,
  error: string | null,
  previewHtml: string,
  justFinished: boolean,
): AgentPhase {
  if (error) return "error";
  if (isGenerating) return "building";
  if (justFinished && previewHtml) return "ready";
  return previewHtml ? "idle" : "idle";
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
  const [showDev, setShowDev] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canExport = Boolean(previewHtml) && !isGenerating;

  const phase = useMemo(
    () => derivePhase(isGenerating, error, previewHtml, justFinished),
    [error, isGenerating, justFinished, previewHtml],
  );

  const pushStream = useCallback((entry: StreamEntry) => {
    setStreamEntries((prev) => [...prev.slice(-100), entry]);
  }, []);

  const refreshPreview = useCallback(async (sessionId: string) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(`/api/site/${sessionId}`);
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

  const markFinished = useCallback(() => {
    setJustFinished(true);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => setJustFinished(false), 4000);
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setError(null);
      setJustFinished(false);
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
              content: "Done — your site files were updated. Check the preview.",
            },
          ]);
        }

        if (donePayload?.status === "finished") {
          const loaded = await refreshPreview(session.sessionId);
          if (!loaded) {
            setError(
              "Agent finished but preview files are not on GitHub yet. Check your template repo and token.",
            );
          } else {
            markFinished();
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
    [agentId, markFinished, pushStream, refreshPreview, session],
  );

  const handleNewSite = () => {
    const next = resetSession();
    setSession(next);
    setAgentId(undefined);
    setLastRunId(undefined);
    setMessages([]);
    setStreamEntries([]);
    setPreviewHtml("");
    setPreviewKey(0);
    setError(null);
    setJustFinished(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  const sessionLabel = useMemo(
    () => `${session.sessionId.slice(0, 8)}…`,
    [session.sessionId],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <div className={styles.logoMark} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className={styles.eyebrow}>Cursor SDK showcase</p>
            <h1 className={styles.title}>Describe a site. Export the code.</h1>
            <p className={styles.lede}>
              A cloud agent builds vanilla HTML, CSS, and JavaScript in an isolated
              sandbox — the same runtime that powers Cursor&apos;s programmatic agents.
            </p>
            <ul className={styles.pills}>
              <li>Cloud VM sandbox</li>
              <li>Live streaming</li>
              <li>Multi-turn edits</li>
              <li>Zip export</li>
            </ul>
          </div>
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

      <StatusBar
        phase={phase}
        hasPreview={Boolean(previewHtml)}
        error={error}
        onDismissError={() => setError(null)}
      />

      <div className={styles.grid}>
        <section className={styles.panel}>
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSubmit={handleGenerate}
            messagesEndRef={messagesEndRef}
          />
        </section>

        <section className={styles.panel}>
          <PreviewFrame
            html={previewHtml}
            previewKey={previewKey}
            widthMode={previewWidth}
            onWidthModeChange={setPreviewWidth}
            canExport={canExport}
            exportUrl={`/api/export/${session.sessionId}`}
            isLoading={isGenerating && !previewHtml}
            isRefreshing={isGenerating && Boolean(previewHtml)}
            onRefresh={() => refreshPreview(session.sessionId)}
          />
        </section>
      </div>

      <div className={styles.lower}>
        <StreamPanel entries={streamEntries} isLive={isGenerating} />
        <DevPanel
          open={showDev}
          onToggle={() => setShowDev((v) => !v)}
          sessionId={sessionLabel}
          agentId={agentId}
          runId={lastRunId}
        />
      </div>

      <SiteFooter />
    </div>
  );
}
