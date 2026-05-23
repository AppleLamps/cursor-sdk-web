# Overview

## Purpose

**Cursor SDK Web** is a public demo that shows how to embed a Cursor coding agent in a simple, understandable product: a chat-driven website builder.

The goal is not to compete with commercial site builders. It is to answer one question clearly:

> *What happens when you drop `@cursor/sdk` into a customer-facing app?*

Anyone can use the demo without knowing what an SDK, agent, or cloud runtime is. Developers can open the source and see exactly how the integration works.

---

## User experience

### First visit

1. Land on a clean page with example prompts ("Coffee shop", "Portfolio", "SaaS landing").
2. Type a description or click a starter prompt.
3. Watch status updates while the agent builds ("Starting agent…", "Editing styles.css…").
4. See a live preview in a sandboxed iframe when files are ready.
5. Download a zip of `index.html`, `styles.css`, and `script.js`.

### Follow-up edits

1. Type another message: "Make the header bigger" or "Add a contact form."
2. The same agent session resumes with full conversation context.
3. Preview refreshes; export includes the latest files.

### Developer panel (optional, collapsible)

Shows SDK metadata for technical viewers:

- Agent ID (`bc-…`)
- Run ID
- Runtime: cloud
- Stream events (tool calls, status)

---

## Scope

### In scope (v1)

- Single-page vanilla HTML/CSS/JS sites
- Chat + streaming status
- Sandboxed preview (desktop + mobile width toggle)
- Zip export
- Multi-turn editing via `Agent.resume`
- Anonymous sessions (browser `localStorage` for session/agent IDs)
- Deployed on Vercel

### Out of scope (v1)

- User accounts / auth
- Billing
- Hosting generated sites
- Custom domains
- Multi-page sites
- Framework output (React, Vue, etc.)
- Collaborative editing

These are intentional cuts to keep the demo focused and shippable.

---

## Why vanilla JS export

Most AI site builders output framework-specific code you cannot easily host yourself. This demo deliberately outputs:

- Plain HTML
- Plain CSS
- Plain JavaScript (minimal, optional)

Users can open the zip locally, drop files on Netlify/Vercel/GitHub Pages, or edit by hand. That makes the output tangible and the demo easy to explain.

---

## Why Cursor Cloud (not local)

| Requirement | Local runtime | Cloud runtime |
|-------------|---------------|---------------|
| Runs on Vercel serverless | No — needs local filesystem | Yes — dedicated VM |
| Isolates untrusted user prompts | No — runs on your infra | Yes — sandboxed VM |
| Works without user's machine | No | Yes |
| Survives serverless timeout | N/A | Agent continues independently |

Cloud agents clone a GitHub template repo, edit files, and push to a branch. Vercel only orchestrates — it never executes user-generated code.

---

## Success criteria

The demo succeeds if:

1. **Non-technical users** can build and download a site in under 5 minutes.
2. **Developers** can read the API route and recognize the SDK pattern in under 10 minutes.
3. **Stream + resume** are visible — not hidden behind a black box.
4. **Deploy to Vercel** works with documented env vars and no manual server setup.

---

## Related repos

| Repo | Role |
|------|------|
| [AppleLamps/cursor-sdk-web](https://github.com/AppleLamps/cursor-sdk-web) | This app (Next.js on Vercel) |
| Template repo (TBD) | GitHub repo the cloud agent clones and edits |

See [template-repo.md](./template-repo.md) for template repo setup.

---

## Next steps in development

1. ~~Documentation~~ (this folder)
2. Template repository with agent skill
3. Next.js app scaffold
4. API routes: `/api/generate`, `/api/site`, `/api/export`
5. Chat UI + SSE streaming
6. Preview + export
7. Vercel deployment
