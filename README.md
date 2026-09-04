# sorenthedev — Portfolio

My personal portfolio website: a dark, glassmorphic single-page-app with an
animated WebGL "Cloud Field" background, a self-updating tech stack built from
live GitHub data, GitHub stats charts, dev.to articles, and crypto sponsorships
via OxaPay.

**🌐 Live site:** [https://sorenthedev.indevs.in](https://sorenthedev.indevs.in)

---

## Features

### Frontend
- **Multi-page SPA** (hash routing): Home, Projects, Articles, and Sponsor pages.
- **Animated WebGL background** — a port of ThreeUI's "Portal Field — Cloud Field"
  shader, rendered in-document so the glassmorphic cards can genuinely blur it
  (`backdrop-filter`). Pauses on hidden tabs and respects `prefers-reduced-motion`.
- **Glassmorphism** — translucent frosted cards over the animated background.
- **Tech stack section** — self-updating from GitHub language data, rendered with
  the [Skill Icons](https://skillicons.dev) SVG library. Clicking any icon opens a
  popup explaining what the language is used for, along with usage data
  (% of codebase, number of repos it appears in).
- **GitHub stats charts** — repos, stars, forks, followers, and a language
  distribution bar.
- **Discord presence** via the Lanyard integration, and dev.to articles.
- Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Framer Motion.

### Backend (Vercel Serverless Functions)
The site is hosted on **Vercel**, which also runs the `api/` serverless
functions. Secrets (API keys) live only in Vercel environment variables —
never in the repository.

| Endpoint | Method | Description |
|---|---|---|
| `/api/github-stats?username=<gh-user>` | GET | Aggregated GitHub data: profile stats (repos, stars, forks, followers) plus a per-language tech stack (bytes, % share, repo count). Uses `GITHUB_TOKEN` when available for higher rate limits. Cached in-memory for 10 min. |
| `/api/spotify-user?id=<spotify-user-id>` | GET | Full public Spotify user profile (display name, avatar, etc.) resolved from a user ID via client-credentials auth. Uses `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`. Cached in-memory for 1 hour. Open CORS — public data only. |
| `/api/create-invoice` | POST | Creates an OxaPay crypto payment invoice for sponsorships. Body: `{ amount, currency?, email?, description? }`. Uses `OXAPAY_MERCHANT_API_KEY`. Per-IP rate limited. |

**Environment variables** (set in Vercel Project Settings → Environment Variables):

| Variable | Used by | Required |
|---|---|---|
| `GITHUB_TOKEN` | `/api/github-stats` | optional (raises rate limit 60→5000/hr) |
| `SPOTIFY_CLIENT_ID` | `/api/spotify-user` | yes |
| `SPOTIFY_CLIENT_SECRET` | `/api/spotify-user` | yes |
| `OXAPAY_MERCHANT_API_KEY` | `/api/create-invoice` | yes |
| `OXAPAY_SANDBOX` | `/api/create-invoice` | optional (`true` for test payments) |
| `ALLOWED_ORIGINS` | all endpoints | optional (comma-separated origin allow-list) |

All endpoints are public read-only APIs exposing no sensitive data — they only
return aggregated public profile data or a payment checkout URL. Set
`ALLOWED_ORIGINS` to lock down cross-origin access if you fork this.

## Deployment

Static site + serverless functions deploy together on Vercel:

1. Import the repo into Vercel (framework preset: **Vite**).
2. Add the environment variables above.
3. Deploy — `vercel.json` routes `/api/*` to the functions and everything else
   to the SPA.

## Local development

```sh
npm install
npm run dev
```

The API endpoints expect the env vars above in a local `.env` file (never
committed) when running against a real Vercel deployment or `vercel dev`.

## Credits

This website is built on top of
[**GitProfile**](https://github.com/arifszn/gitprofile) by
[**arifszn**](https://github.com/arifszn) — an amazing open-source project that
generates a developer portfolio from a GitHub profile. GitProfile provided the
base foundation for this site; the design, multi-page layout, WebGL background,
backend endpoints, and integrations have been built and heavily customized on
top of it.

Background scene: "Cloud Field" from
[ThreeUI](https://threeui.com) by MengTo (MIT).
