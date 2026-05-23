import { loadCredentials, type UserCredentials } from "@/lib/credentials";

export function getAuthHeaders(
  credentials: UserCredentials | null = loadCredentials(),
): Record<string, string> {
  if (!credentials) {
    return {};
  }

  return {
    "X-Cursor-Api-Key": credentials.cursorApiKey,
    "X-Github-Token": credentials.githubToken,
    "X-Template-Repo-Url": credentials.templateRepoUrl,
    "X-Template-Repo-Ref": credentials.templateRepoRef,
  };
}

export async function downloadExport(sessionId: string): Promise<void> {
  const res = await fetch(`/api/export/${sessionId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `site-${sessionId.slice(0, 8)}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
