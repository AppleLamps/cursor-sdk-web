# Cursor SDK Web — Template

GitHub template repository for the [cursor-sdk-web](https://github.com/AppleLamps/cursor-sdk-web) demo.

Cursor **cloud agents** clone this repo into an isolated VM and write generated websites to:

```
sites/{sessionId}/
  index.html
  styles.css
  script.js
```

## Setup

1. This repo is already configured — connect it to your **Cursor account** (Dashboard → GitHub integration).
2. In the main app, set:
   ```env
   TEMPLATE_REPO_URL=https://github.com/AppleLamps/cursor-sdk-web-template
   TEMPLATE_REPO_REF=main
   ```
3. Ensure your `CURSOR_API_KEY` owner has GitHub access to this repository.

## What's in this repo

| Path | Purpose |
|------|---------|
| `.cursor/skills/website-builder/SKILL.md` | Steers the agent toward vanilla HTML/CSS/JS |
| `sites/` | Per-session output folders (created by the agent) |

## Do not

- Commit generated `sites/{sessionId}/` folders to `main` manually unless debugging
- Add React, build tools, or npm dependencies — the demo outputs plain static files

## License

MIT — see [LICENSE](./LICENSE) in the main app repo.
