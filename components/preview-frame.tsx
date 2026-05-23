"use client";

import styles from "./preview-frame.module.css";

interface PreviewFrameProps {
  html: string;
  previewKey: number;
  widthMode: "desktop" | "mobile";
  onWidthModeChange: (mode: "desktop" | "mobile") => void;
  canExport: boolean;
  exportUrl: string;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onNewSite?: () => void;
  showDev?: boolean;
  onToggleDev?: () => void;
  sessionLabel?: string;
  agentId?: string;
  runId?: string;
}

export function PreviewFrame({
  html,
  previewKey,
  widthMode,
  onWidthModeChange,
  canExport,
  exportUrl,
  isLoading,
  isRefreshing,
  onRefresh,
  showDev,
  onToggleDev,
  sessionLabel,
  agentId,
  runId,
}: PreviewFrameProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.toolbarLabel}>Preview</span>
          {isLoading || isRefreshing ? (
            <span className={styles.buildingBadge}>
              <span className={styles.buildingDot} />
              Building
            </span>
          ) : null}
        </div>

        <div className={styles.toolbarCenter}>
          <div className={styles.deviceToggle}>
            <button
              type="button"
              className={widthMode === "desktop" ? styles.active : undefined}
              onClick={() => onWidthModeChange("desktop")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </button>
            <button
              type="button"
              className={widthMode === "mobile" ? styles.active : undefined}
              onClick={() => onWidthModeChange("mobile")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          {onRefresh ? (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh"
            >
              ↻
            </button>
          ) : null}
          {onToggleDev ? (
            <button
              type="button"
              className={`${styles.toolBtn} ${showDev ? styles.toolBtnActive : ""}`}
              onClick={onToggleDev}
              title="SDK info"
            >
              {"{}"}
            </button>
          ) : null}
          <a
            className={canExport ? styles.exportBtn : styles.exportBtnDisabled}
            href={canExport ? exportUrl : undefined}
            onClick={(e) => {
              if (!canExport) e.preventDefault();
            }}
          >
            Export
          </a>
          <a
            className={styles.linkBtn}
            href="https://cursor.com/docs/sdk/typescript"
            target="_blank"
            rel="noreferrer"
          >
            SDK
          </a>
        </div>
      </header>

      {showDev ? (
        <div className={styles.devStrip}>
          <span>session: {sessionLabel}</span>
          <span>agent: {agentId ?? "—"}</span>
          <span>run: {runId ?? "—"}</span>
        </div>
      ) : null}

      <div className={styles.canvas}>
        <div
          className={`${styles.frameWrap} ${widthMode === "mobile" ? styles.mobile : styles.desktop}`}
        >
          {html ? (
            <iframe
              key={previewKey}
              title="Preview"
              sandbox="allow-scripts"
              srcDoc={html}
              className={`${styles.frame} ${isRefreshing ? styles.frameDim : ""}`}
            />
          ) : (
            <div className={styles.empty}>
              {isLoading ? (
                <>
                  <div className={styles.loader} />
                  <p>Generating your site…</p>
                </>
              ) : (
                <>
                  <div className={styles.emptyIcon} />
                  <p>Preview will appear here</p>
                  <span>Send a message in the chat to get started</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
