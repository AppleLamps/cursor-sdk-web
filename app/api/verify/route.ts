import { credentialsFromBody } from "@/lib/api-credentials";
import { parseRepoUrl } from "@/lib/github";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface VerifyRequestBody {
  cursorApiKey?: string;
  githubToken?: string;
  templateRepoUrl?: string;
  templateRepoRef?: string;
}

export async function POST(request: Request) {
  let body: VerifyRequestBody;

  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const credentials = credentialsFromBody(body);
  if (!credentials) {
    return NextResponse.json(
      { error: "Cursor API key and GitHub token are required." },
      { status: 400 },
    );
  }

  const checks: { github: boolean; repo: boolean; cursorKey: boolean } = {
    github: false,
    repo: false,
    cursorKey: credentials.cursorApiKey.length >= 8,
  };

  try {
    const { owner, repo } = parseRepoUrl(credentials.templateRepoUrl);
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${credentials.githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    checks.github = userRes.ok;

    if (userRes.ok) {
      const repoRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );
      checks.repo = repoRes.ok;
    }
  } catch {
    checks.github = false;
    checks.repo = false;
  }

  const ok = checks.github && checks.repo && checks.cursorKey;

  return NextResponse.json({
    ok,
    checks,
    message: ok
      ? "Credentials look good. You can start building."
      : "Some checks failed. Review your keys and template repo access.",
  });
}
