# Setup

Local development guide for **Cursor SDK Web**.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 20+ | Required for `@cursor/sdk` |
| npm or pnpm | Package manager |
| Cursor API key | [Dashboard → Integrations](https://cursor.com/dashboard/integrations) |
| GitHub PAT | `repo` scope for template repo read |
| Template repository | See [template-repo.md](./template-repo.md) |
| GitHub ↔ Cursor linked | API key owner must access the template repo from Cursor |

---

## 1. Clone the repository

```bash
git clone https://github.com/AppleLamps/cursor-sdk-web.git
cd cursor-sdk-web
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in all values — see [environment.md](./environment.md) for details.

Minimum required for local dev:

```env
CURSOR_API_KEY=cursor_...
GITHUB_TOKEN=ghp_...
TEMPLATE_REPO_URL=https://github.com/your-org/cursor-sdk-web-template
TEMPLATE_REPO_REF=main
```

---

## 4. Set up the template repository

The cloud agent needs a GitHub repo to clone. Follow [template-repo.md](./template-repo.md) to create and configure it.

Verify:

- Template repo exists and is accessible by your GitHub token
- Your Cursor account has GitHub connected with access to that repo
- `.cursor/skills/website-builder/SKILL.md` is present

---

## 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 6. Smoke test

1. Click a starter prompt or type: "Simple landing page for a bakery"
2. Watch the stream panel for agent events
3. Wait for preview to load (may take 1–3 minutes on first run)
4. Click "Download zip" and open `index.html` locally

If the agent fails to start:

- Check `CURSOR_API_KEY` is valid (no extra whitespace)
- Confirm GitHub is connected in Cursor for the template repo
- Check terminal logs for `agentId` and `runId`

---

## Scripts (planned)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## Troubleshooting

### `CursorAgentError: Missing CURSOR_API_KEY`

Ensure `.env.local` exists and contains `CURSOR_API_KEY`. Restart the dev server after changing env vars.

### `ERROR_GITHUB_NO_USER_CREDENTIALS`

The Cursor account tied to your API key does not have GitHub connected for the template repo. Fix in Cursor Dashboard → connect GitHub → grant repo access.

### Agent runs but preview is empty

- Agent may still be pushing to GitHub — wait and refresh
- Check template repo for `sites/{sessionId}/` on the expected branch
- Verify `GITHUB_TOKEN` can read the template repo

### Dev server times out during generate

Agent runs can take several minutes. If Next.js times out locally, check `next.config` for `maxDuration` on API routes (Vercel uses the same setting in production).

### `Agent created but nothing on GitHub`

You may have accidentally used `local:` instead of `cloud:` in agent options. Cloud is required for this app — see [architecture.md](./architecture.md).

---

## Next

- [deployment.md](./deployment.md) — deploy to Vercel
- [sdk-features.md](./sdk-features.md) — understand the SDK integration
