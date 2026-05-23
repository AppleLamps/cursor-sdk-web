# Cursor SDK Web

A demo app that lets anyone describe a website in plain language and get back an exportable vanilla HTML/CSS/JS site — powered by the [Cursor SDK](https://cursor.com/docs/sdk/typescript) cloud runtime.

Built to showcase what `@cursor/sdk` can do when embedded in a customer-facing product: isolated cloud sandboxes, streaming agent runs, multi-turn editing, and real file output.

**Live demo:** _(add Vercel URL after deploy)_

**Repository:** [github.com/AppleLamps/cursor-sdk-web](https://github.com/AppleLamps/cursor-sdk-web)

---

## What it does

1. You describe a website ("coffee shop landing page, warm tones").
2. A Cursor cloud agent edits files in an isolated VM against a template repository.
3. You see live progress while the agent works.
4. You preview the result in a sandboxed iframe.
5. You download a zip of plain `index.html`, `styles.css`, and `script.js`.

No React. No build step. No platform lock-in.

---

## SDK features demonstrated

| Feature | Where you see it |
|---------|------------------|
| Cloud runtime (dedicated VM) | Each session runs in Cursor's sandbox, not on Vercel |
| `Agent.create` / `Agent.resume` | New sites vs. follow-up edits |
| `agent.send` + `run.stream()` | Chat UI with live status |
| `run.wait()` | Completion handling before preview refresh |
| Agent skill steering | `.cursor/skills/website-builder/` in the template repo |
| Session persistence | Resume the same agent for multi-turn edits |

See [docs/sdk-features.md](./docs/sdk-features.md) for a full walkthrough.

---

## Quick start

```bash
git clone https://github.com/AppleLamps/cursor-sdk-web.git
cd cursor-sdk-web
npm install
cp .env.example .env.local   # fill in required values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Full setup instructions: [docs/setup.md](./docs/setup.md)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Overview](./docs/overview.md) | Goals, user flow, and scope |
| [Architecture](./docs/architecture.md) | System design, API routes, data flow |
| [Setup](./docs/setup.md) | Local development |
| [Environment variables](./docs/environment.md) | Required secrets and config |
| [Deployment (Vercel)](./docs/deployment.md) | Production deploy guide |
| [Template repository](./docs/template-repo.md) | GitHub template repo the agent edits |
| [SDK features](./docs/sdk-features.md) | What this demo proves about the SDK |

---

## Prerequisites

Before running locally or deploying:

1. **Cursor API key** — [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations)
2. **GitHub template repository** — a repo the cloud agent clones and edits (see [docs/template-repo.md](./docs/template-repo.md))
3. **GitHub personal access token** — to fetch generated files for preview and export
4. **GitHub connected to Cursor** — the API key owner must have GitHub access to the template repo

---

## Tech stack

- **Framework:** Next.js (App Router) — Vercel deployment
- **Agent runtime:** `@cursor/sdk` (TypeScript)
- **Agent execution:** Cursor Cloud (dedicated VM per session)
- **File storage:** GitHub (template repo, per-session folders)
- **Preview:** Sandboxed iframe (`srcdoc`)

---

## Project status

| Phase | Status |
|-------|--------|
| Documentation | Done |
| Template scaffold (`template/`) | Done — copy to GitHub |
| Next.js app + API routes | Done |
| Chat UI + streaming | Done |
| Preview + export | Done |
| Vercel deployment | Ready — add env vars and deploy |

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Links

- [Cursor SDK TypeScript docs](https://cursor.com/docs/sdk/typescript)
- [Cursor SDK blog post](https://cursor.com/blog/typescript-sdk)
- [Cursor cookbook (sample projects)](https://github.com/cursor/cookbook)
