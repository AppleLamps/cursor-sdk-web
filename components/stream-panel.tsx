"use client";

import { useEffect, useRef } from "react";
import styles from "./stream-panel.module.css";

export interface StreamEntry {
  kind: "info" | "assistant" | "tool" | "status" | "success" | "error";
  text: string;
}

interface StreamPanelProps {
  entries: StreamEntry[];
  isLive?: boolean;
}

const TAG_CLASS: Record<StreamEntry["kind"], string> = {
  info: styles.tagInfo,
  assistant: styles.tagAssistant,
  tool: styles.tagTool,
  status: styles.tagStatus,
  success: styles.tagSuccess,
  error: styles.tagError,
};

export function StreamPanel({ entries, isLive }: StreamPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h2>Agent stream</h2>
          <p className={styles.sub}>run.stream() events</p>
        </div>
        <span className={`${styles.liveBadge} ${isLive ? styles.liveOn : ""}`}>
          {isLive ? "● Live" : "Idle"}
        </span>
      </div>
      <div className={styles.log} ref={logRef}>
        {entries.length === 0 ? (
          <div className={styles.empty}>
            <code>run.stream()</code>
            <p>Tool calls, status updates, and assistant output appear here in real time.</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={`${entry.kind}-${index}`} className={styles.line}>
              <span className={TAG_CLASS[entry.kind]}>{entry.kind}</span>
              <span className={styles.text}>{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
