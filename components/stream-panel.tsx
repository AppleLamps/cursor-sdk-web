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
  compact?: boolean;
}

const TAG_CLASS: Record<StreamEntry["kind"], string> = {
  info: styles.tagInfo,
  assistant: styles.tagAssistant,
  tool: styles.tagTool,
  status: styles.tagStatus,
  success: styles.tagSuccess,
  error: styles.tagError,
};

export function StreamPanel({ entries, isLive, compact }: StreamPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className={`${styles.shell} ${compact ? styles.compact : ""}`}>
      {!compact ? (
        <div className={styles.header}>
          <h2>Agent stream</h2>
          <span className={isLive ? styles.liveOn : styles.liveOff}>
            {isLive ? "Live" : "Idle"}
          </span>
        </div>
      ) : null}
      <div className={styles.log} ref={logRef}>
        {entries.length === 0 ? (
          <p className={styles.empty}>No activity yet</p>
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
