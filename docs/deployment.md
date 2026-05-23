# Deployment (Vercel)

Deploy **Cursor SDK Web** to Vercel.

---

## Overview

| Item | Value |
|------|-------|
| Platform | [Vercel](https://vercel.com) |
| Framework | Next.js (App Router) |
| API runtime | **Node.js** (required for `@cursor/sdk`) |
| Build command | `npm run build` |
| Output | Next.js default |

The app itself is a standard Next.js deployment. Agent work runs on **Cursor Cloud**, not on Vercel compute — Vercel only orchestrates SDK calls and fetches files from GitHub.

---

## 1. Push to GitHub

Ensure the repo is on GitHub:

```bash
git remote add origin https://github.com/AppleLamps/cursor-sdk-web.git
git push -u origin main
```

---

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `AppleLamps/cursor-sdk-web`
3. Framework preset: **Next.js**
4. Root directory: `.` (default)
5. Do not deploy yet — add env vars first

---

## 3. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Environments |
|------|--------------|
| `CURSOR_API_KEY` | Production, Preview, Development |
| `GITHUB_TOKEN` | Production, Preview, Development |
| `TEMPLATE_REPO_URL` | Production, Preview, Development |
| `TEMPLATE_REPO_REF` | Production, Preview, Development (optional) |
| `CURSOR_MODEL` | Optional |

See [environment.md](./environment.md) for details on each variable.

---

## 4. Runtime configuration

API routes that call `@cursor/sdk` must use the Node.js runtime:

```typescript
// app/api/generate/route.ts
export const runtime = "nodejs";
export const maxDuration = 60; // seconds — requires Vercel Pro for >10s on hobby
```

### Timeout notes

| Plan | Default max | Notes |
|------|-------------|-------|
| Hobby | 10s | May timeout on long agent runs |
| Pro | 60s (configurable up to 300s on some plans) | Recommended for demo |

If timeouts occur on Hobby:

- Upgrade to Pro, or
- Split generate into async start + poll/stream endpoint (see [architecture.md](./architecture.md))

---

## 5. Deploy

Click **Deploy** or push to `main` for automatic deploys.

After deploy:

1. Update `README.md` live demo URL
2. Run a smoke test on production
3. Check Vercel function logs if generate fails

---

## 6. Custom domain (optional)

Vercel → Project → Settings → Domains → add your domain.

No special DNS config beyond Vercel defaults.

---

## 7. Preview deployments

Vercel Preview URLs work for UI changes. Each preview deployment uses the same env vars (including `CURSOR_API_KEY`) unless you scope vars to Production only.

**Recommendation:** Allow Preview to use Cursor API for testing, but set rate limits or use a separate API key if abuse is a concern.

---

## 8. Monitoring

### Vercel logs

Functions → select `/api/generate` → view logs for:

- `CursorAgentError` (startup failures)
- `result.status === "error"` (run failures)
- Logged `agentId` and `runId`

### Cursor dashboard

Inspect cloud agent runs at [cursor.com/agents](https://cursor.com/agents) using logged IDs.

---

## 9. Cost awareness

Each user prompt triggers a Cursor cloud agent run (token-based billing on your Cursor account). For a public demo:

- Add rate limiting (IP-based or session-based)
- Cap prompts per session
- Show a "demo" banner explaining usage limits

No additional Vercel cost beyond standard Next.js hosting and function duration.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 500 on generate | Check env vars in Vercel dashboard |
| Function timeout | Increase `maxDuration`; upgrade plan |
| Edge runtime error | Ensure `export const runtime = "nodejs"` |
| GitHub 404 on preview | Verify `GITHUB_TOKEN` and branch/path |
| Agent works locally, not on Vercel | Confirm same env vars; check Vercel logs |

---

## CI (optional)

Vercel builds on push. Optional GitHub Action for lint only:

```yaml
# .github/workflows/ci.yml (future)
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
```

---

## Related

- [setup.md](./setup.md) — local development
- [environment.md](./environment.md) — variable reference
