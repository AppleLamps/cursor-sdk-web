export interface ParsedRepo {
  owner: string;
  repo: string;
  url: string;
}

export function parseRepoUrl(url: string): ParsedRepo {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) {
    throw new Error(`Invalid GitHub repo URL: ${url}`);
  }
  return {
    owner: match[1],
    repo: match[2],
    url: `https://github.com/${match[1]}/${match[2]}`,
  };
}

export interface SiteFiles {
  html: string;
  css: string;
  js: string;
}

interface GitHubContentResponse {
  content?: string;
  encoding?: string;
  message?: string;
}

async function fetchFile(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string,
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return "";
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as GitHubContentResponse;
    throw new Error(body.message ?? `GitHub API error ${res.status} for ${path}`);
  }

  const data = (await res.json()) as GitHubContentResponse;
  if (!data.content || data.encoding !== "base64") {
    return "";
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function fetchSiteFiles(sessionId: string): Promise<SiteFiles | null> {
  const token = process.env.GITHUB_TOKEN;
  const repoUrl = process.env.TEMPLATE_REPO_URL;
  const ref = process.env.TEMPLATE_REPO_REF ?? "main";

  if (!token || !repoUrl) {
    throw new Error("Missing GITHUB_TOKEN or TEMPLATE_REPO_URL");
  }

  const { owner, repo } = parseRepoUrl(repoUrl);
  const base = `sites/${sessionId}`;

  const [html, css, js] = await Promise.all([
    fetchFile(owner, repo, `${base}/index.html`, ref, token),
    fetchFile(owner, repo, `${base}/styles.css`, ref, token),
    fetchFile(owner, repo, `${base}/script.js`, ref, token),
  ]);

  if (!html.trim()) {
    return null;
  }

  return { html, css, js };
}

export function assemblePreviewDocument(files: SiteFiles): string {
  let html = files.html;

  if (files.css.trim() && !html.includes('href="styles.css"') && !html.includes("styles.css")) {
    html = html.replace("</head>", `<style>${files.css}</style></head>`);
  } else if (files.css.trim()) {
    html = html.replace(
      /<link[^>]*href=["']styles\.css["'][^>]*>/i,
      `<style>${files.css}</style>`,
    );
  }

  if (files.js.trim()) {
    html = html.replace("</body>", `<script>${files.js}</script></body>`);
  }

  return html;
}
