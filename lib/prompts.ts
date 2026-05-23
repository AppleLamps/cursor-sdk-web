export function buildAgentPrompt(sessionId: string, userPrompt: string): string {
  return [
    "You are building a single-page vanilla HTML/CSS/JS website for the Cursor SDK Web demo.",
    "",
    `Work ONLY inside: sites/${sessionId}/`,
    "",
    "Create or update these files:",
    "- index.html — semantic HTML5, mobile-first",
    "- styles.css — all styles, no CSS frameworks",
    "- script.js — minimal JavaScript (empty file with a comment is fine if unused)",
    "",
    "Rules:",
    "- Vanilla HTML, CSS, and JavaScript only. No React, Vue, Tailwind CDN, or build tools.",
    "- No npm dependencies.",
    "- Google Fonts via link tag is allowed.",
    "- Make it polished: cohesive colors, responsive layout, clear hero section.",
    "- Commit and push your changes when done.",
    "",
    `User request: ${userPrompt}`,
  ].join("\n");
}

export const STARTER_PROMPTS = [
  {
    label: "Coffee shop",
    prompt: "Landing page for an artisan coffee shop. Warm browns and cream, hero with tagline, menu highlights, and location footer.",
  },
  {
    label: "Portfolio",
    prompt: "Dark minimal portfolio for a photographer. Full-width hero image placeholder, grid gallery section, about blurb, contact link.",
  },
  {
    label: "SaaS landing",
    prompt: "SaaS landing page in blue and white. Hero with product value prop, three feature cards, simple pricing section, and CTA button.",
  },
  {
    label: "Restaurant",
    prompt: "Elegant restaurant website. Serif headings, reservation CTA, menu preview section, hours and address in footer.",
  },
] as const;
