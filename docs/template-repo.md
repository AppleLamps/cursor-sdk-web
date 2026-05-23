# Template repository

The cloud agent does not generate files in memory — it **clones a GitHub repository** and edits real files in an isolated VM. This document describes the companion template repo.

---

## Purpose

| Role | Description |
|------|-------------|
| Starting scaffold | Empty or minimal site structure the agent fills in |
| Session isolation | Each user session writes to `sites/{sessionId}/` |
| Agent steering | `.cursor/skills/website-builder/SKILL.md` enforces vanilla JS rules |

**Suggested repo name:** `cursor-sdk-web-template` (separate from this app repo)

---

## Directory layout

```
cursor-sdk-web-template/
├── sites/
│   └── .gitkeep
├── .cursor/
│   └── skills/
│       └── website-builder/
│           └── SKILL.md
├── README.md
└── LICENSE
```

Do not pre-create session folders — the agent creates `sites/{sessionId}/` on first run.

---

## Agent skill file

Create `.cursor/skills/website-builder/SKILL.md`:

```markdown
---
name: website-builder
description: Build single-page vanilla HTML/CSS/JS websites for the Cursor SDK Web demo.
---

# Website Builder

You build single-page websites using **vanilla HTML, CSS, and JavaScript only**.

## Rules

1. Work ONLY inside the session directory you are given (e.g. `sites/{sessionId}/`).
2. Output exactly these files unless the user explicitly asks for assets:
   - `index.html` — semantic HTML5, mobile-first
   - `styles.css` — all styles, no CSS frameworks
   - `script.js` — minimal JS; omit if unused (leave empty file or simple comment)
3. **No frameworks** — no React, Vue, Next.js, Tailwind CDN, or build tools.
4. **No npm dependencies.**
5. Google Fonts via `<link>` is allowed.
6. Use readable class names and short comments for major sections.
7. Include: header, hero, at least one content section, footer.
8. Ensure reasonable contrast and font sizes for accessibility.
9. Make layouts responsive with CSS (flexbox/grid), not fixed pixel widths for containers.
10. When editing an existing site, preserve what works unless the user asks to change it.

## Quality bar

- Pages should look polished, not like unstyled HTML defaults.
- Use a cohesive color palette (3–5 colors).
- Hero section should communicate purpose within 5 seconds.
- Contact or CTA section when relevant to the prompt.
```

Adjust tone and rules as the demo evolves.

---

## Session folder convention

When the app calls the agent, it includes the session ID in the prompt:

```
Work ONLY in: sites/abc-123-def-456/
```

The agent should create:

```
sites/abc-123-def-456/
├── index.html
├── styles.css
└── script.js
```

---

## Branch strategy

**Recommended (v1):** one branch per session

| Item | Value |
|------|-------|
| Base ref | `main` |
| Agent branch | `site/{sessionId}` |
| Fetch for preview | GitHub API on branch `site/{sessionId}` |

The app API route fetches:

```
GET /repos/{owner}/{repo}/contents/sites/{sessionId}?ref=site/{sessionId}
```

**Alternative:** all sessions on `main` in separate folders — simpler for agent, noisier git history.

Document which strategy the app implements in `lib/github.ts` when built.

---

## GitHub setup checklist

- [ ] Create repository (public or private)
- [ ] Add `.cursor/skills/website-builder/SKILL.md`
- [ ] Add empty `sites/.gitkeep`
- [ ] Connect repo to Cursor (account that owns `CURSOR_API_KEY`)
- [ ] Grant GitHub PAT read access (and write if app pushes via token)
- [ ] Set `TEMPLATE_REPO_URL` in app env to this repo's URL

---

## Cursor GitHub connection

The API key owner must:

1. Open [Cursor Dashboard](https://cursor.com/dashboard)
2. Connect GitHub
3. Grant access to the template repository (or all repos)

Without this, cloud agents return `ERROR_GITHUB_NO_USER_CREDENTIALS`.

---

## Template README (for the template repo)

Suggested content for the template repo's own README:

```markdown
# Cursor SDK Web — Template

GitHub template repository for [cursor-sdk-web](https://github.com/AppleLamps/cursor-sdk-web).

Cursor cloud agents clone this repo and write generated websites to `sites/{sessionId}/`.

Do not edit session folders manually unless debugging.
```

---

## Future: separate repo in org

| Repo | URL (example) |
|------|---------------|
| App | `github.com/AppleLamps/cursor-sdk-web` |
| Template | `github.com/AppleLamps/cursor-sdk-web-template` |

Keeping them separate avoids the app deployment overwriting template contents and keeps agent git history clean.

---

## Related

- [architecture.md](./architecture.md) — how the app uses this repo
- [environment.md](./environment.md) — `TEMPLATE_REPO_URL` config
