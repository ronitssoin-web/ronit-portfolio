# Portfolio Website — Project Context & Design Guardrails

## What this is
A minimalist personal portfolio for **Ronit Soin** (Organic Content Specialist @ Smallest.ai). Pure static **HTML/CSS/JS** — no framework, no build step. Files: `index.html`, `styles.css`, `script.js`, plus `assets/` (logos), `videos/` (compressed), `display picture/`, `favicon/`.

## How to ship changes (important)
- **Live site:** https://ronit-portfolio-omega.vercel.app
- **GitHub:** https://github.com/ronitssoin-web/ronit-portfolio (branch `main`)
- Every `git push` to `main` → **Vercel auto-deploys in ~20s**. To ship: `git add . && git commit && git push`.
- **Cache-busting:** after editing CSS/JS, bump `?v=N` on the `styles.css` and `script.js` links in `index.html`.
- **Design source of truth:** Figma file in **Dev Mode** (MCP connected) — pull exact specs from there when a design is provided. Figma file: `Website - Testing Design - Ronit` (key `2r8DiT0nvcnEn3fU2UJ8ei`).
- **Videos:** committed compressed versions live in `videos/`; heavy originals are in git-ignored `videos carousel/`. Compress new videos with ffmpeg (strip audio, they autoplay muted) before committing:
  ```
  ffmpeg -y -i "input.mp4" -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 27 -preset slow -an -movflags +faststart "videos/clean-name.mp4"
  ```

## Design taste — what Ronit LIKES ✅
- **Minimalist, clean, lots of whitespace.** Fragment Mono (labels/mono accents) + Inter (body).
- **Precise, pixel-specific direction** — give exact values (e.g. "632px card", "50px image", "reduce scale 10–20%"). He thinks in exact sizes.
- **Compact / fits-in-one-line** layouts (e.g. the Stack row must stay on ONE line — shrink icons to fit).
- **Sourcing designs from Figma** and matching them exactly.
- **2D isometric video row** in "Stuff I've Done": cards at rest sit in a per-card-perspective isometric row (`transform: perspective(600px) rotateY(20deg)` per card — NOT a shared/group perspective). **Interactive focus (added by request):** hovering a card flattens it (`rotateY 0`), scales it up (`1.18`) and slides it to centre; the others fan to the sides, tilt away and darken. State is **sticky** — once focused, hovering other cards does nothing; only a **click** switches focus. Click the focused card again, press **Esc**, or **move the cursor out of the section** to return to the resting row. Tuned values live in `script.js` (`STEP` spacing) + `styles.css` (`.video-card width`); use the gitignored `tune.html` dashboard to dial in new looks.
- iMessage-style chat bubbles for the Contact section.
- Profile photo + name (body-size) + lighter-grey role subtitle + Twitter-style **verified badge**; inline favicons next to brand mentions (e.g. Smallest.ai).
- Playlist card final design: grey outer shell + white inner card, small album art (~50–60px), title + artist, and a "chin" strip below with info left / "Listen on Spotify" + icon right, **no divider line**.

## What Ronit DIDN'T like — GUARDRAILS 🚫
- **No group/shared perspective on the video deck.** Applying perspective to the whole row makes the first card huge and the last tiny — he explicitly rejected this twice. Perspective must be **per-card** so all cards are the same size.
- **No auto-scrolling/moving carousel.** Built one across several iterations; he scrapped it. Don't reintroduce *automatic* motion/auto-advance. (The current hover-to-focus interaction is user-driven and approved — see LIKES above; don't revert it to a purely static row.)
- **No carousel that "jumps" easily** between videos on hover (was too sensitive). The sticky-focus model solves this: hover only *initiates*; switching requires a deliberate click. Keep it sticky.
- Disliked an earlier non-2D / heavy-3D view ("not liking the current view at all").
- When he says a specific number, **use that number** — don't approximate (he corrected 200%→150%, etc.).

## Current section order
Hero → Experience (timeline w/ bullets) → Stuff I've Done (7-video isometric static row) → Stack (one-line logo row) → My Songs (3 album cards, isometric→flat hover) → Personal (playlist card) → Contact (chat) → Quote.
