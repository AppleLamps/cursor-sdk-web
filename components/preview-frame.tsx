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
}: PreviewFrameProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div>
          <h2>Preview</h2>
          <p className={styles.sub}>Sandboxed iframe · vanilla output</p>
        </div>
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
          {onRefresh ? (
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh preview from GitHub"
            >
              ↻
            </button>
          ) : null}
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
          <div className={styles.browserChrome}>
            <div className={styles.traffic}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.urlBar}>your-site.local / index.html</div>
          </div>

          <div className={styles.viewport}>
            {html ? (
              <iframe
                key={previewKey}
                title="Generated site preview"
                sandbox="allow-scripts"
                srcDoc={html}
                className={`${styles.frame} ${isRefreshing ? styles.frameRefreshing : ""}`}
              />
            ) : (
              <div className={styles.placeholder}>
                {isLoading ? (
                  <>
                    <div className={styles.skeleton}>
                      <div className={styles.skeletonHero} />
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                      <div className={styles.skeletonGrid}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <p className={styles.loadingText}>Agent is writing your site…</p>
                  </>
                ) : (
                  <>
                    <div className={styles.emptyPreview} aria-hidden />
                    <p>Your preview appears here after the first build.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
