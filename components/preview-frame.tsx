"use client";

import styles from "./preview-frame.module.css";

interface PreviewFrameProps {
  html: string;
  widthMode: "desktop" | "mobile";
  onWidthModeChange: (mode: "desktop" | "mobile") => void;
  canExport: boolean;
  exportUrl: string;
  isLoading: boolean;
}

export function PreviewFrame({
  html,
  widthMode,
  onWidthModeChange,
  canExport,
  exportUrl,
  isLoading,
}: PreviewFrameProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <h2>Preview</h2>
        <div className={styles.actions}>
          <div className={styles.toggle}>
            <button
              type="button"
              className={widthMode === "desktop" ? styles.active : undefined}
              onClick={() => onWidthModeChange("desktop")}
            >
              Desktop
            </button>
            <button
              type="button"
              className={widthMode === "mobile" ? styles.active : undefined}
              onClick={() => onWidthModeChange("mobile")}
            >
              Mobile
            </button>
          </div>
          <a
            className={canExport ? styles.export : styles.exportDisabled}
            href={canExport ? exportUrl : undefined}
            aria-disabled={!canExport}
            onClick={(e) => {
              if (!canExport) e.preventDefault();
            }}
          >
            Download zip
          </a>
        </div>
      </div>

      <div className={styles.stage}>
        <div
          className={`${styles.device} ${widthMode === "mobile" ? styles.mobile : styles.desktop}`}
        >
          {html ? (
            <iframe
              title="Generated site preview"
              sandbox="allow-scripts"
              srcDoc={html}
              className={styles.frame}
            />
          ) : (
            <div className={styles.placeholder}>
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  <p>Agent is writing your site…</p>
                </>
              ) : (
                <p>Your preview will appear here after the first build.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
