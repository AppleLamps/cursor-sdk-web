"use client";

import Link from "next/link";
import { STARTER_PROMPTS } from "@/lib/prompts";
import type { TraceStep } from "@/lib/agent-trace";
import { AgentTrace } from "@/components/agent-trace";
import styles from "./chat-panel.module.css";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: TraceStep[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  liveTrace?: TraceStep[];
  error?: string | null;
  onDismissError?: () => void;
  onSubmit: (prompt: string) => void;
  onNewSite: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
  onMessagesScroll?: () => void;
  showActivity?: boolean;
  onToggleActivity?: () => void;
  activityCount?: number;
}

export function ChatPanel({
  messages,
  isGenerating,
  liveTrace = [],
  error,
  onDismissError,
  onSubmit,
  onNewSite,
  messagesEndRef,
  messagesContainerRef,
  onMessagesScroll,
  showActivity,
  onToggleActivity,
  activityCount = 0,
}: ChatPanelProps) {
  const showLiveTrace = isGenerating && liveTrace.length > 0;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden />
          <span className={styles.brandName}>Cursor SDK Web</span>
        </div>
        <div className={styles.topbarActions}>
          <Link
            href="/onboarding"
            className={styles.iconBtn}
            aria-label="API keys"
            title="API keys"
          >
            <span aria-hidden>⚙</span>
          </Link>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onNewSite}
            aria-label="New site"
            title="New site"
          >
            <span aria-hidden>+</span>
          </button>
        </div>
      </header>

      <div
        className={styles.messages}
        ref={messagesContainerRef}
        onScroll={onMessagesScroll}
      >
        {messages.length === 0 && !showLiveTrace ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>What do you want to build?</p>
            <p className={styles.emptySub}>
              Describe a website and a Cursor cloud agent will generate vanilla HTML, CSS, and JS.
            </p>
            <div className={styles.starters}>
              {STARTER_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={styles.starter}
                  disabled={isGenerating}
                  onClick={() => onSubmit(item.prompt)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={styles.messageBlock}>
                {message.role === "assistant" && message.trace && message.trace.length > 0 ? (
                  <AgentTrace steps={message.trace} isLive={false} />
                ) : null}
                <div
                  className={
                    message.role === "user" ? styles.msgUser : styles.msgAssistant
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {showLiveTrace ? <AgentTrace steps={liveTrace} isLive /> : null}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className={styles.errorBar}>
          <span>{error}</span>
          {onDismissError ? (
            <button type="button" onClick={onDismissError} aria-label="Dismiss">
              ×
            </button>
          ) : null}
        </div>
      ) : null}

      <footer className={styles.footer}>
        {onToggleActivity ? (
          <button
            type="button"
            className={`${styles.activityBtn} ${showActivity ? styles.activityActive : ""}`}
            onClick={onToggleActivity}
          >
            Raw stream
            {activityCount > 0 ? (
              <span className={styles.activityCount}>{activityCount}</span>
            ) : null}
          </button>
        ) : null}

        <form
          className={styles.form}
          aria-label="Send a chat message"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem("prompt") as HTMLTextAreaElement;
            const value = input.value.trim();
            if (!value || isGenerating) return;
            input.value = "";
            input.style.height = "auto";
            onSubmit(value);
          }}
        >
          <textarea
            name="prompt"
            rows={1}
            placeholder={isGenerating ? "Building…" : "Ask for changes…"}
            aria-label="Chat message"
            disabled={isGenerating}
            autoComplete="off"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button type="submit" disabled={isGenerating} aria-label="Send">
            {isGenerating ? <span className={styles.spinner} /> : "↑"}
          </button>
        </form>
        <p className={styles.inputHint}>
          <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for newline
        </p>
      </footer>
    </div>
  );
}
