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
  onSubmit: (prompt: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatPanel({
  messages,
  isGenerating,
  onSubmit,
  messagesEndRef,
}: ChatPanelProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h2>Chat</h2>
          <p className={styles.sub}>Multi-turn via Agent.resume</p>
        </div>
        <span className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden />
          Cloud Agent
        </span>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <h3>What should we build?</h3>
            <p>Describe your site or pick a starter below.</p>
            <div className={styles.starters}>
              {STARTER_PROMPTS.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  className={styles.starter}
                  style={{ animationDelay: `${index * 60}ms` }}
                  disabled={isGenerating}
                  onClick={() => onSubmit(item.prompt)}
                >
                  <span className={styles.starterLabel}>{item.label}</span>
                  <span className={styles.starterHint}>Tap to generate</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={styles.row}
                style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
              >
                <div
                  className={
                    message.role === "user" ? styles.avatarUser : styles.avatarAgent
                  }
                  aria-hidden
                >
                  {message.role === "user" ? "You" : "AI"}
                </div>
                <div
                  className={
                    message.role === "user" ? styles.userBubble : styles.assistantBubble
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isGenerating ? (
              <div className={styles.typingRow}>
                <div className={styles.avatarAgent} aria-hidden>
                  AI
                </div>
                <div className={styles.typingBubble} aria-label="Agent is working">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem("prompt") as HTMLInputElement;
          const value = input.value.trim();
          if (!value || isGenerating) return;
          input.value = "";
          onSubmit(value);
        }}
      >
        <input
          name="prompt"
          placeholder={
            isGenerating
              ? "Agent is working…"
              : messages.length
                ? "Refine your site — e.g. “make the hero darker”"
                : "Describe your website…"
          }
          disabled={isGenerating}
          autoComplete="off"
        />
        <button type="submit" disabled={isGenerating} className={styles.sendBtn}>
          {isGenerating ? (
            <>
              <span className={styles.btnSpinner} aria-hidden />
              Building
            </>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}
