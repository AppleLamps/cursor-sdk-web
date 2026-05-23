# Environment variables

All secrets are server-side only. Never expose `CURSOR_API_KEY` or `GITHUB_TOKEN` to the browser.

---

## Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Cursor user or team service-account API key |
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` read access to template repo |
| `TEMPLATE_REPO_URL` | Yes | Full HTTPS URL of the template repository |
| `TEMPLATE_REPO_REF` | No | Branch or ref to clone (default: `main`) |
| `CURSOR_MODEL` | No | Model ID (default: `composer-2.5`) |

---

## `CURSOR_API_KEY`

**Where to get it:** [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations)

**Format:** `cursor_…`

**Notes:**

- The key owner must have GitHub connected to Cursor with access to the template repo
- For production, consider a team **service account** key
- Pass explicitly in code — do not rely on ambient env in shared infrastructure
- Never commit to git; never log the full value

**Local:**

```env
CURSOR_API_KEY=cursor_your_key_here
```

**Vercel:** Project → Settings → Environment Variables → add for Production, Preview, Development

---

## `GITHUB_TOKEN`

**Where to get it:** GitHub → Settings → Developer settings → Personal access tokens

**Scopes needed:**

- `repo` (read contents of the template repository)

If the agent pushes to branches, the token may also need write access — or rely on the Cursor cloud agent's own GitHub connection for writes and use this token only for read/preview/export.

**Notes:**

- Used by Vercel API routes to fetch `sites/{sessionId}/*` for preview and export
- Fine-grained tokens: restrict to the template repo only

**Local:**

```env
GITHUB_TOKEN=ghp_your_token_here
```

---

## `TEMPLATE_REPO_URL`

Full HTTPS URL of the GitHub repository the cloud agent clones.

```env
TEMPLATE_REPO_URL=https://github.com/AppleLamps/cursor-sdk-web-template
```

Must match a repo the Cursor API key owner can access via their linked GitHub account.

---

## `TEMPLATE_REPO_REF`

Starting ref for new agent sessions.

```env
TEMPLATE_REPO_REF=main
```

Maps to SDK option:

```typescript
cloud: {
  repos: [{ url: process.env.TEMPLATE_REPO_URL!, startingRef: process.env.TEMPLATE_REPO_REF ?? "main" }],
}
```

---

## `CURSOR_MODEL`

Optional model override.

```env
CURSOR_MODEL=composer-2.5
```

List available models:

```typescript
import { Cursor } from "@cursor/sdk";
const models = await Cursor.models.list({ apiKey: process.env.CURSOR_API_KEY! });
```

Use `{ id: "auto" }` to let the server pick.

---

## Example files

### `.env.example` (committed)

```env
# Cursor SDK
CURSOR_API_KEY=
CURSOR_MODEL=composer-2.5

# GitHub (preview + export)
GITHUB_TOKEN=
TEMPLATE_REPO_URL=https://github.com/your-org/cursor-sdk-web-template
TEMPLATE_REPO_REF=main
```

### `.env.local` (gitignored)

Copy from `.env.example` and fill in real values.

---

## Vercel checklist

- [ ] `CURSOR_API_KEY` set for Production
- [ ] `GITHUB_TOKEN` set for Production
- [ ] `TEMPLATE_REPO_URL` set for Production
- [ ] `TEMPLATE_REPO_REF` set (or rely on default)
- [ ] API routes use **Node.js runtime** (not Edge)
- [ ] Consider increasing `maxDuration` for `/api/generate` on Pro plan

---

## Security

1. **Never** prefix client-side env vars with these secrets (`NEXT_PUBLIC_` is forbidden for keys)
2. Rotate tokens if exposed
3. Use fine-grained GitHub tokens scoped to one repo
4. Rate-limit `/api/generate` in production to control Cursor API spend
