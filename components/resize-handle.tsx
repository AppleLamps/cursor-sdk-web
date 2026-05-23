"use client";

import { useCallback, useEffect, useRef } from "react";
import styles from "./resize-handle.module.css";

interface ResizeHandleProps {
  onResize: (width: number) => void;
  onResizeEnd?: (width: number) => void;
  getWidth: () => number;
}

export function ResizeHandle({ onResize, onResizeEnd, getWidth }: ResizeHandleProps) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = getWidth();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [getWidth],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      onResize(startWidth.current + delta);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const delta = e.clientX - startX.current;
      onResizeEnd?.(startWidth.current + delta);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onResize, onResizeEnd]);

  return (
    <div
      className={styles.handle}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize chat panel"
      onMouseDown={onMouseDown}
    >
      <span className={styles.line} />
    </div>
  );
}
