# SDK features

What **Cursor SDK Web** demonstrates about `@cursor/sdk` — mapped from user-visible behavior to SDK calls.

For canonical SDK reference, see [cursor.com/docs/sdk/typescript](https://cursor.com/docs/sdk/typescript).

---

## The core pattern

This app uses **Pattern 2** from the SDK: durable agent with follow-ups.

```typescript
await using agent = await Agent.create({ /* or Agent.resume */ });
const run = await agent.send(prompt);
for await (const event of run.stream()) { /* → SSE to browser */ }
const result = await run.wait();
```

Not Pattern 1 (`Agent.prompt`) — we need streaming and multi-turn context.

---

## Feature map

### 1. Cloud runtime (isolated VM)

**User sees:** "Running on Cursor Cloud" badge; agent works without local files on the server.

**SDK:**

```typescript
await using agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  cloud: {
    repos: [{ url: TEMPLATE_REPO_URL, startingRef: "main" }],
    autoCreatePR: false,
    skipReviewerRequest: true,
  },
});
```

**Why cloud, not local:**

- Vercel serverless has no persistent workspace for local agents
- User prompts must not execute on your infrastructure
- Each session gets a dedicated VM with a fresh clone

**Trap to avoid:** Omitting `cloud:` silently defaults to local — always set `cloud:` explicitly.

---

### 2. Agent creation (first message)

**User sees:** First prompt starts building a new site.

**SDK:** `Agent.create(options)` → returns agent with `agentId` (`bc-…` prefix for cloud).

**Persist:** Save `agentId` in browser `localStorage` for resume.

---

### 3. Agent resume (follow-up messages)

**User sees:** "Make the header blue" works without losing prior context.

**SDK:**

```typescript
await using agent = await Agent.resume(storedAgentId, {
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  cloud: { repos: [{ url: TEMPLATE_REPO_URL, startingRef: "main" }] },
  // mcpServers must be re-passed if used — not persisted across resume
});
```

**Why it matters:** Shows embedded agents as **conversations**, not one-shot API calls.

---

### 4. Streaming (`run.stream()`)

**User sees:** Live status panel — assistant text, tool calls, progress.

**SDK:**

```typescript
const run = await agent.send(prompt);
console.log(`agent=${agent.agentId} run=${run.id}`); // log before stream

for await (const event of run.stream()) {
  if (event.type === "assistant") { /* text blocks */ }
  if (event.type === "tool_call") { /* file edits */ }
  if (event.type === "status") { /* running, etc. */ }
}
```

Forwarded to the browser via **Server-Sent Events (SSE)**.

**Trap to avoid:** Streaming without `run.wait()` — always wait for terminal status.

---

### 5. Run completion (`run.wait()`)

**User sees:** Preview refresh trigger; export enabled.

**SDK:**

```typescript
const result = await run.wait();
if (result.status === "error") {
  // Run executed but failed — inspect transcript
}
// result.status === "finished" → fetch files from GitHub
```

**Two failure types:**

| Type | Signal | Meaning |
|------|--------|---------|
| Startup failure | Thrown `CursorAgentError` | Auth, config, network — run never started |
| Run failure | `result.status === "error"` | Agent ran but task failed |

Handle both in the API route.

---

### 6. Agent disposal

**SDK:**

```typescript
await using agent = await Agent.create(/* ... */);
// automatic dispose at end of scope
```

Prevents leaked child processes and HTTP clients on Vercel warm instances.

---

### 7. Skill-based steering (repo config)

**User sees:** Consistent vanilla HTML output across prompts.

**Not SDK code** — configured in the template repo:

```
.cursor/skills/website-builder/SKILL.md
```

Cloud agents pick up skills from the cloned repo. This shows how **product behavior** can live in repo config rather than hardcoded prompts.

---

### 8. Model selection

**SDK:**

```typescript
model: { id: process.env.CURSOR_MODEL ?? "composer-2.5" }
```

Composer models balance cost and quality for iterative file editing. List models:

```typescript
import { Cursor } from "@cursor/sdk";
await Cursor.models.list({ apiKey });
```

---

## What we deliberately skip (v1)

| SDK feature | Why skipped in demo |
|-------------|---------------------|
| MCP servers | Adds setup complexity; not needed for static sites |
| Sub-agents | Cloud-only; overkill for single-page sites |
| `autoCreatePR: true` | We fetch files, not PRs |
| Local runtime | Wrong fit for Vercel |
| Artifacts API | GitHub fetch is simpler for HTML/CSS/JS |
| Hooks | Managed in template repo if needed later |

These are extension points for a follow-up blog post or v2.

---

## Code tour (when implemented)

| File | SDK usage |
|------|-----------|
| `lib/cursor.ts` | `Agent.create`, `Agent.resume`, shared options |
| `app/api/generate/route.ts` | `send`, `stream`, `wait`, SSE |
| `lib/session.ts` | Persist `agentId` client-side |

---

## 60-second demo script

For presenting this project:

1. **"No AI in the frontend."** The UI is chat + iframe. All intelligence is `@cursor/sdk` on the server.
2. **Show env vars.** `CURSOR_API_KEY` + template repo URL.
3. **User prompts.** Cloud VM spins up, clones template repo.
4. **Stream panel.** Real `run.stream()` events — tool calls editing files.
5. **Follow-up.** Same `agentId` resumed — context preserved.
6. **Export.** Plain files from GitHub — no lock-in.
7. **"Same SDK powers CI bots, internal tools, and embedded agents."** Link to docs.

---

## Related

- [Cursor SDK blog](https://cursor.com/blog/typescript-sdk)
- [Cursor cookbook](https://github.com/cursor/cookbook) — includes a prototyping-tool sample
- [architecture.md](./architecture.md) — full system design
