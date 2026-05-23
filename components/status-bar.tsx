"use client";

import styles from "./status-bar.module.css";

export type AgentPhase = "idle" | "connecting" | "building" | "ready" | "error";

interface StatusBarProps {
  phase: AgentPhase;
  hasPreview: boolean;
  onDismissError?: () => void;
  error?: string | null;
}

const LABELS: Record<AgentPhase, string> = {
  idle: "Ready — describe your site to begin",
  connecting: "Starting Cursor cloud agent…",
  building: "Agent is editing HTML, CSS & JS",
  ready: "Site ready — preview updated",
  error: "Something went wrong",
};

export function StatusBar({ phase, hasPreview, onDismissError, error }: StatusBarProps) {
  const label =
    phase === "idle" && hasPreview
      ? "Ready — send a follow-up to refine your site"
      : LABELS[phase];

  return (
    <div className={`${styles.bar} ${styles[phase]}`} role="status" aria-live="polite">
      <div className={styles.left}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.label}>{label}</span>
      </div>
      {phase === "error" && error ? (
        <div className={styles.errorWrap}>
          <span className={styles.errorText}>{error}</span>
          {onDismissError ? (
            <button type="button" className={styles.dismiss} onClick={onDismissError}>
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
