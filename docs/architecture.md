# Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js frontend)                                         │
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌───────────┐  │
│  │ Chat UI  │   │ Stream panel │   │  Preview   │   │  Export   │  │
│  │          │   │ (SSE events) │   │ (iframe)   │   │  (zip)    │  │
│  └────┬─────┘   └──────▲───────┘   └─────▲──────┘   └─────▲─────┘  │
│       │                │                  │                 │       │
└───────┼────────────────┼──────────────────┼─────────────────┼───────┘
        │ POST           │ SSE              │ GET             │ GET
        ▼                │                  │                 │
┌─────────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js App Router — API routes only orchestrate)           │
│                                                                     │
│  /api/generate  ──►  @cursor/sdk                                      │
│       │              Agent.create / Agent.resume                      │
│       │              agent.send(prompt)                               │
│       │              run.stream() ──► SSE to client                   │
│       │              run.wait()                                       │
│       │                                                               │
│  /api/site/[sessionId]  ──►  GitHub API (fetch sites/{id}/*)        │
│  /api/export/[sessionId] ──► GitHub API + zip                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Cursor Cloud (per session)                                         │
│                                                                     │
│  Dedicated VM  →  clones template repo  →  edits sites/{sessionId}/ │
│                   commits + pushes branch                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub (template repository)                                       │
│                                                                     │
│  template-repo/                                                     │
│    sites/                                                           │
│      {sessionId}/                                                   │
│        index.html                                                   │
│        styles.css                                                   │
│        script.js                                                    │
│    .cursor/skills/website-builder/SKILL.md                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Frontend (Next.js App Router)

| Route / component | Responsibility |
|-------------------|----------------|
| `/` | Landing + chat + preview layout |
| `ChatPanel` | Message input, history, starter prompts |
| `StreamPanel` | Collapsible SDK event log |
| `PreviewFrame` | Sandboxed iframe, mobile/desktop toggle |
| `ExportButton` | Triggers zip download |
| `DevPanel` | Agent ID, run ID, runtime badge |

Session state stored in `localStorage`:

```typescript
interface SessionState {
  sessionId: string;   // UUID, maps to sites/{sessionId}/
  agentId?: string;    // bc-… for Agent.resume
}
```

### 2. API routes

#### `POST /api/generate`

Starts or continues an agent run.

**Request:**

```json
{
  "sessionId": "uuid",
  "prompt": "Coffee shop landing page, warm browns",
  "agentId": "bc-optional-for-resume"
}
```

**Response:** Server-Sent Events stream

```
event: status
data: {"type":"status","message":"Starting cloud agent…"}

event: sdk
data: {"type":"assistant","text":"…"}

event: tool
data: {"type":"tool_call","name":"edit","status":"completed"}

event: done
data: {"agentId":"bc-…","runId":"…","status":"finished"}
```

**Implementation notes:**

- Use `Agent.resume(agentId, …)` when `agentId` is present; otherwise `Agent.create(…)`.
- Always pass `cloud: { repos: [{ url, startingRef }], autoCreatePR: false }` explicitly.
- Always call `run.wait()` after streaming.
- Use `await using agent = …` for disposal.
- Distinguish `CursorAgentError` (startup) from `result.status === "error"` (run failed).

#### `GET /api/site/[sessionId]`

Fetches generated files from GitHub for preview.

**Response:**

```json
{
  "html": "<!DOCTYPE html>…",
  "css": "body { … }",
  "js": "// …"
}
```

Uses GitHub Contents API: `GET /repos/{owner}/{repo}/contents/sites/{sessionId}/`

#### `GET /api/export/[sessionId]`

Returns `application/zip` with `index.html`, `styles.css`, `script.js`.

---

## Session → repo mapping

Each browser session gets a UUID. The cloud agent writes only to:

```
sites/{sessionId}/index.html
sites/{sessionId}/styles.css
sites/{sessionId}/script.js
```

**Branch strategy (recommended for v1):**

- Agent works on branch `site/{sessionId}` off `main`
- `startingRef: "main"` on create; subsequent sends use resume on same agent
- GitHub token fetches from `site/{sessionId}` branch

Alternative: single branch with folder-per-session (simpler fetch, noisier repo).

---

## Agent prompt construction

The API wraps user input with session context:

```
You are building a single-page vanilla HTML/CSS/JS website.

Work ONLY in the directory: sites/{sessionId}/

Files to maintain:
- index.html
- styles.css
- script.js

Follow the website-builder skill in .cursor/skills/.

User request: {userPrompt}
```

The skill file in the template repo handles style rules (no React, mobile-first, etc.) so the app prompt stays short.

---

## Preview security

User-generated HTML is never injected into the main app DOM.

```tsx
<iframe
  sandbox="allow-scripts"
  srcDoc={assembledHtml}
  title="Site preview"
/>
```

CSS and JS are inlined or injected into `srcdoc` for v1. The iframe has no access to parent origin cookies or storage.

---

## Vercel considerations

| Concern | Approach |
|---------|----------|
| Serverless timeout (10s hobby / 60s pro) | Stream SSE immediately; agent runs on Cursor Cloud, not Vercel |
| Long agent runs | Vercel route streams until `run.wait()` completes; may need Pro for 60s+ runs |
| Env secrets | `CURSOR_API_KEY`, `GITHUB_TOKEN`, `TEMPLATE_REPO_URL` in Vercel project settings |
| Edge vs Node | API routes must use **Node.js runtime** (SDK requires Node) |

If agent runs exceed Vercel limits, split into:

1. `POST /api/generate` — starts run, returns `{ runId, agentId }` immediately
2. `GET /api/generate/[runId]/stream` — separate SSE connection
3. Polling fallback for completion

v1 can use a single streaming route; optimize if timeouts occur.

---

## Error handling

| Failure | HTTP | User message |
|---------|------|--------------|
| Missing env vars | 500 | "Service misconfigured" |
| `CursorAgentError` (auth, network) | 502 | "Could not start agent. Try again." |
| `result.status === "error"` | 200 + `done` event with error | "Agent run failed. Try a simpler prompt." |
| GitHub fetch fails (files not ready) | 404 | "Site not ready yet" |
| Rate limit | 429 | "Too many requests" |

Log `agentId` and `run.id` on every `send()` for debugging.

---

## File structure (planned)

```
cursor-sdk-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── generate/route.ts
│       ├── site/[sessionId]/route.ts
│       └── export/[sessionId]/route.ts
├── components/
│   ├── chat-panel.tsx
│   ├── preview-frame.tsx
│   ├── stream-panel.tsx
│   └── dev-panel.tsx
├── lib/
│   ├── cursor.ts          # Agent create/resume helpers
│   ├── github.ts          # Fetch files, build zip
│   ├── session.ts         # Session ID helpers
│   └── prompts.ts         # Prompt templates
├── docs/                  # This folder
├── public/
├── .env.example
├── README.md
└── package.json
```

---

## Dependencies (planned)

```json
{
  "@cursor/sdk": "latest",
  "next": "^15",
  "react": "^19",
  "jszip": "^3",
  "uuid": "^11"
}
```

---

## Related docs

- [template-repo.md](./template-repo.md) — GitHub repo layout
- [environment.md](./environment.md) — required secrets
- [sdk-features.md](./sdk-features.md) — SDK call mapping
