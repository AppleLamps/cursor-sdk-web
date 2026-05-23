"use client";

import type { TraceStep } from "@/lib/agent-trace";
import styles from "./agent-trace.module.css";

interface AgentTraceProps {
  steps: TraceStep[];
  isLive: boolean;
}

function StepIcon({ state }: { state: TraceStep["state"] }) {
  if (state === "done") {
    return (
      <span className={styles.iconDone} aria-hidden>
        ✓
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className={styles.iconError} aria-hidden>
        !
      </span>
    );
  }
  if (state === "active") {
    return <span className={styles.iconActive} aria-hidden />;
  }
  return <span className={styles.iconPending} aria-hidden />;
}

export function AgentTrace({ steps, isLive }: AgentTraceProps) {
  if (steps.length === 0) return null;

  const thinking = steps.find((s) => s.kind === "thinking" && (s.detail || s.state === "active"));
  const visibleSteps = steps.filter((s) => s.kind !== "thinking");

  return (
    <div className={styles.trace} aria-live="polite" aria-busy={isLive}>
      <div className={styles.header}>
        <span className={isLive ? styles.liveDot : styles.idleDot} aria-hidden />
        <span className={styles.headerLabel}>{isLive ? "Working" : "Steps"}</span>
      </div>

      <ol className={styles.list}>
        {visibleSteps.map((step) => (
          <li key={step.id} className={styles.item} data-state={step.state} data-kind={step.kind}>
            <StepIcon state={step.state} />
            <div className={styles.content}>
              <span className={styles.label}>{step.label}</span>
              {step.detail && step.kind !== "thinking" ? (
                <span className={styles.detail}>{step.detail}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {thinking?.detail ? (
        <div className={styles.thinking}>
          <span className={styles.thinkingLabel}>Reasoning</span>
          <p className={styles.thinkingText}>{thinking.detail}</p>
        </div>
      ) : null}
    </div>
  );
}
