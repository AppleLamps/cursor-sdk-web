import type { UserCredentials } from "@/lib/credentials";
import { DEFAULT_TEMPLATE_REPO_REF, DEFAULT_TEMPLATE_REPO_URL } from "@/lib/credentials";

export interface ResolvedCredentials {
  cursorApiKey: string;
  githubToken: string;
  templateRepoUrl: string;
  templateRepoRef: string;
}

export function resolveCredentials(request: Request): ResolvedCredentials | null {
  const cursorApiKey =
    request.headers.get("x-cursor-api-key")?.trim() || process.env.CURSOR_API_KEY?.trim();
  const githubToken =
    request.headers.get("x-github-token")?.trim() || process.env.GITHUB_TOKEN?.trim();
  const templateRepoUrl =
    request.headers.get("x-template-repo-url")?.trim() ||
    process.env.TEMPLATE_REPO_URL?.trim() ||
    DEFAULT_TEMPLATE_REPO_URL;
  const templateRepoRef =
    request.headers.get("x-template-repo-ref")?.trim() ||
    process.env.TEMPLATE_REPO_REF?.trim() ||
    DEFAULT_TEMPLATE_REPO_REF;

  if (!cursorApiKey || !githubToken) {
    return null;
  }

  return {
    cursorApiKey,
    githubToken,
    templateRepoUrl,
    templateRepoRef,
  };
}

export function credentialsFromBody(body: Partial<UserCredentials>): ResolvedCredentials | null {
  const cursorApiKey = body.cursorApiKey?.trim() || process.env.CURSOR_API_KEY?.trim();
  const githubToken = body.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const templateRepoUrl =
    body.templateRepoUrl?.trim() ||
    process.env.TEMPLATE_REPO_URL?.trim() ||
    DEFAULT_TEMPLATE_REPO_URL;
  const templateRepoRef =
    body.templateRepoRef?.trim() ||
    process.env.TEMPLATE_REPO_REF?.trim() ||
    DEFAULT_TEMPLATE_REPO_REF;

  if (!cursorApiKey || !githubToken) {
    return null;
  }

  return {
    cursorApiKey,
    githubToken,
    templateRepoUrl,
    templateRepoRef,
  };
}

export function missingCredentialsResponse(): Response {
  return Response.json(
    {
      error:
        "Missing API credentials. Add your Cursor API key and GitHub token in onboarding.",
    },
    { status: 401 },
  );
}
