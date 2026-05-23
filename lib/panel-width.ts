const STORAGE_KEY = "cursor-sdk-web-chat-width";
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 520;

export function loadChatWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDTH;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? clampWidth(n) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function saveChatWidth(width: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(clampWidth(width)));
}

export function clampWidth(width: number, viewportWidth = window.innerWidth): number {
  const max = Math.min(MAX_WIDTH, Math.floor(viewportWidth * 0.42));
  return Math.max(MIN_WIDTH, Math.min(max, width));
}

export { DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH };
