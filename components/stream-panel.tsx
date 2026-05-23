"use client";

import styles from "./stream-panel.module.css";

export interface StreamEntry {
  kind: "info" | "assistant" | "tool" | "status" | "success" | "error";
  text: string;
}

interface StreamPanelProps {
  entries: StreamEntry[];
}

const TAG_CLASS: Record<StreamEntry["kind"], string> = {
  info: styles.tagInfo,
  assistant: styles.tagAssistant,
  tool: styles.tagTool,
  status: styles.tagStatus,
  success: styles.tagSuccess,
  error: styles.tagError,
};

export function StreamPanel({ entries }: StreamPanelProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h2>Agent stream</h2>
        <span>Live SDK events</span>
      </div>
      <div className={styles.log}>
        {entries.length === 0 ? (
          <p className={styles.empty}>Stream output from `run.stream()` appears here.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={`${entry.kind}-${index}`} className={styles.line}>
              <span className={TAG_CLASS[entry.kind]}>{entry.kind}</span>
              <span>{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
