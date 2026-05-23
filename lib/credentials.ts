export interface UserCredentials {
  cursorApiKey: string;
  githubToken: string;
  templateRepoUrl: string;
  templateRepoRef: string;
}

export const DEFAULT_TEMPLATE_REPO_URL =
  "https://github.com/AppleLamps/cursor-sdk-web-template";

export const DEFAULT_TEMPLATE_REPO_REF = "main";

const STORAGE_KEY = "cursor-sdk-web-credentials";

export function loadCredentials(): UserCredentials | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<UserCredentials>;
    if (
      !parsed.cursorApiKey?.trim() ||
      !parsed.githubToken?.trim() ||
      !parsed.templateRepoUrl?.trim()
    ) {
      return null;
    }

    return {
      cursorApiKey: parsed.cursorApiKey.trim(),
      githubToken: parsed.githubToken.trim(),
      templateRepoUrl: parsed.templateRepoUrl.trim(),
      templateRepoRef: parsed.templateRepoRef?.trim() || DEFAULT_TEMPLATE_REPO_REF,
    };
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: UserCredentials): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cursorApiKey: credentials.cursorApiKey.trim(),
      githubToken: credentials.githubToken.trim(),
      templateRepoUrl: credentials.templateRepoUrl.trim(),
      templateRepoRef: credentials.templateRepoRef.trim() || DEFAULT_TEMPLATE_REPO_REF,
    }),
  );
}

export function clearCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasCredentials(): boolean {
  return loadCredentials() !== null;
}

export function maskSecret(value: string, visible = 4): string {
  if (value.length <= visible * 2) return "••••••••";
  return `${value.slice(0, visible)}${"•".repeat(8)}${value.slice(-visible)}`;
}

export function defaultCredentials(): UserCredentials {
  return {
    cursorApiKey: "",
    githubToken: "",
    templateRepoUrl: DEFAULT_TEMPLATE_REPO_URL,
    templateRepoRef: DEFAULT_TEMPLATE_REPO_REF,
  };
}
