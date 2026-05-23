"use client";

import styles from "./dev-panel.module.css";

interface DevPanelProps {
  open: boolean;
  onToggle: () => void;
  sessionId: string;
  agentId?: string;
  runId?: string;
}

export function DevPanel({ open, onToggle, sessionId, agentId, runId }: DevPanelProps) {
  return (
    <div className={styles.shell}>
      <button type="button" className={styles.toggle} onClick={onToggle}>
        {open ? "Hide" : "Show"} SDK panel
      </button>

      {open ? (
        <div className={styles.body}>
          <p className={styles.title}>@cursor/sdk</p>
          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Runtime</dt>
              <dd className={styles.metaValue}>cloud (dedicated VM)</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Session</dt>
              <dd className={styles.metaValue}>{sessionId}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Agent ID</dt>
              <dd className={styles.metaValue}>{agentId ?? "—"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Run ID</dt>
              <dd className={styles.metaValue}>{runId ?? "—"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Pattern</dt>
              <dd className={styles.metaValue}>Agent.create / resume → send → stream → wait</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
