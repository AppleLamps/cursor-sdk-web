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
        <h2>Chat</h2>
        <span className={styles.badge}>Cursor Cloud Agent</span>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <p>Try a starter prompt or describe your site.</p>
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
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user" ? styles.userBubble : styles.assistantBubble
              }
            >
              {message.content}
            </div>
          ))
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
              : "Describe changes or ask for a new section…"
          }
          disabled={isGenerating}
          autoComplete="off"
        />
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? "Building…" : "Send"}
        </button>
      </form>
    </div>
  );
}
