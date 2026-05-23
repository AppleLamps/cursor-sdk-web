"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./preview-frame.module.css";

interface PreviewFrameProps {
  html: string;
  previewKey: number;
  widthMode: "desktop" | "mobile";
  onWidthModeChange: (mode: "desktop" | "mobile") => void;
  canExport: boolean;
  onExport?: () => void;
  isExporting?: boolean;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
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
  onExport,
  isExporting,
  isLoading,
  isRefreshing,
  onRefresh,
  showDev,
  onToggleDev,
  sessionLabel,
  agentId,
  runId,
}: PreviewFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!html) {
      setPreviewUrl(null);
      return;
    }

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html, previewKey]);

  const addressLabel = useMemo(() => {
    if (!html) return "about:blank";
    return `preview://site/${sessionLabel ?? "draft"}`;
  }, [html, sessionLabel]);

  const handleOpenTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleFullscreen = async () => {
    const node = document.getElementById("preview-sandbox-root");
    if (!node) return;

    if (!document.fullscreenElement) {
      await node.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div className={styles.shell} id="preview-sandbox-root">
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
              aria-label="Desktop view"
              aria-pressed={widthMode === "desktop"}
              title="Desktop"
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </button>
            <button
              type="button"
              className={widthMode === "mobile" ? styles.active : undefined}
              onClick={() => onWidthModeChange("mobile")}
              aria-label="Mobile view"
              aria-pressed={widthMode === "mobile"}
              title="Mobile"
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </button>
          </div>

          {widthMode === "desktop" && html ? (
            <div className={styles.zoomControl}>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span>{zoom}%</span>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={() => setZoom((z) => Math.min(100, z + 10))}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.toolbarRight}>
          {onRefresh ? (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh preview"
              title="Refresh preview"
            >
              <span aria-hidden>↻</span>
            </button>
          ) : null}
          {html ? (
            <>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleOpenTab}
                aria-label="Open preview in new tab"
                title="Open in new tab"
              >
                <span aria-hidden>↗</span>
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                <span aria-hidden>{isFullscreen ? "⤡" : "⤢"}</span>
              </button>
            </>
          ) : null}
          {onToggleDev ? (
            <button
              type="button"
              className={`${styles.toolBtn} ${showDev ? styles.toolBtnActive : ""}`}
              onClick={onToggleDev}
              aria-label="Toggle SDK info"
              aria-pressed={showDev}
              title="SDK info"
            >
              <span aria-hidden>{"{}"}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={canExport ? styles.exportBtn : styles.exportBtnDisabled}
            onClick={() => {
              if (canExport && onExport) onExport();
            }}
            disabled={!canExport || isExporting}
          >
            {isExporting ? "Exporting…" : "Export"}
          </button>
          <a
            className={styles.linkBtn}
            href="https://cursor.com/docs/sdk/typescript"
            target="_blank"
            rel="noreferrer"
            aria-label="Cursor SDK documentation (opens in new tab)"
          >
            SDK<span className={styles.externalMark} aria-hidden> ↗</span>
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
          style={widthMode === "desktop" && html ? { transform: `scale(${zoom / 100})` } : undefined}
        >
          {widthMode === "mobile" && html ? (
            <div className={styles.mobileChrome}>
              <span className={styles.mobileNotch} />
              <span className={styles.mobileTime}>9:41</span>
            </div>
          ) : null}

          {html && previewUrl ? (
            <div className={styles.browserChrome}>
              <div className={styles.trafficLights} aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.addressBar}>{addressLabel}</div>
            </div>
          ) : null}

          {html && previewUrl ? (
            <div className={styles.frameHost}>
              <iframe
                key={previewKey}
                title="Site preview"
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                src={previewUrl}
                className={`${styles.frame} ${isRefreshing ? styles.frameDim : ""}`}
              />
              {isRefreshing ? <div className={styles.refreshOverlay} aria-hidden /> : null}
            </div>
          ) : (
            <div className={styles.empty}>
              {isLoading ? (
                <>
                  <div className={styles.loader} />
                  <p>Generating your site…</p>
                  <span>The agent is writing HTML, CSS, and JS to your template repo.</span>
                </>
              ) : (
                <>
                  <div className={styles.emptyIcon} />
                  <p>Preview will appear here</p>
                  <span>Send a message in the chat to generate a site in the sandbox.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
