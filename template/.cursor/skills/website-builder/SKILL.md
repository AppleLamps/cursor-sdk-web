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
   - `script.js` — minimal JS; empty file with a comment is fine if unused
3. **No frameworks** — no React, Vue, Next.js, Tailwind CDN, or build tools.
4. **No npm dependencies.**
5. Google Fonts via `<link>` is allowed.
6. Use readable class names and short comments for major sections.
7. Include: header, hero, at least one content section, footer.
8. Ensure reasonable contrast and font sizes for accessibility.
9. Make layouts responsive with CSS (flexbox/grid).
10. When editing an existing site, preserve what works unless the user asks to change it.
11. **Commit and push** your changes when finished.

## Quality bar

- Pages should look polished, not like unstyled HTML defaults.
- Use a cohesive color palette (3–5 colors).
- Hero section should communicate purpose within 5 seconds.
- Add a contact or CTA section when relevant to the prompt.
