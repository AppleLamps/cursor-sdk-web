"use client";

import { STARTER_PROMPTS } from "@/lib/prompts";
import styles from "./chat-panel.module.css";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  error?: string | null;
  onDismissError?: () => void;
  onSubmit: (prompt: string) => void;
  onNewSite: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showActivity?: boolean;
  onToggleActivity?: () => void;
  activityCount?: number;
}

export function ChatPanel({
  messages,
  isGenerating,
  error,
  onDismissError,
  onSubmit,
  onNewSite,
  messagesEndRef,
  showActivity,
  onToggleActivity,
  activityCount = 0,
}: ChatPanelProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden />
          <span className={styles.brandName}>Cursor SDK Web</span>
        </div>
        <button type="button" className={styles.iconBtn} onClick={onNewSite} title="New site">
          +
        </button>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 ? (
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
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user" ? styles.msgUser : styles.msgAssistant
                }
              >
                {message.content}
              </div>
            ))}
            {isGenerating ? (
              <div className={styles.typing} aria-label="Agent working">
                <span />
                <span />
                <span />
              </div>
            ) : null}
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
            Activity
            {activityCount > 0 ? (
              <span className={styles.activityCount}>{activityCount}</span>
            ) : null}
          </button>
        ) : null}

        <form
          className={styles.form}
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
      </footer>
    </div>
  );
}
