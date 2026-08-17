# Addicto

A **local, private, free** PWA for quitting porn — engineered for ADHD brains, built on the methods with real evidence behind them.

**No cloud. No account. No server. Your data never leaves your device.**

## The research this is built on

The science isn't about willpower. It's about a dopamine system and the environment around it:

- **ADHD is a dopamine-calibration problem, not a character flaw.** Blunted phasic reward response, depressed baseline motivation, and impaired inhibitory control make high-novelty, instantly-available stimuli (like porn) disproportionately compelling. Willpower runs on the exact prefrontal system ADHD compromises — so this app demands as little willpower as possible.
- **Shame is mechanically counterproductive.** Shame activates the amygdala, which suppresses the prefrontal cortex — the system you need to stop. So the app is anti-shame by design: soft-fail streaks, self-compassion after slips, mechanism-not-morality copy.
- **The only randomized-trial-tested program** (Hands-Off: CBT + motivational interviewing + mindfulness, 6 weeks) works — but **89% of people dropped out**. Engagement is the real problem. Everything here is sized for a 10-second interaction.
- **The documented levers** (Frontiers in Psychiatry 2025; ADHD research): treat the dopamine architecture via **exercise**, **sleep**, **environmental design** (reduce friction, not resistance), and **emotional-regulation skills**. The app tracks and reinforces the first two and automates the third.
- **Escalation is a desensitization process** with five documented mechanisms (volume, genre escalation, tab-jumping, edging, binging). Slip logging flags them so you can interrupt the pattern.
- **Urge + mood logging** is the single most useful feature: negative mood and craving intensity predict a slip hours before it happens.
- **Urges are waves** — they peak and fall in 10–20 minutes. The panic flow teaches urge surfing, not resistance.

## Features

| Feature | What it does | Evidence base |
|---|---|---|
| 🌊 **Panic flow** | Live urge-surfing wave + DBT **TIPP** skills + SMART **DENTS** playbook + your crisis plan + your CBA costs + (optional) a **spiritual anchor** (dua + verse) — all in the craving moment | Urge surfing (Marlatt); DBT distress tolerance; SMART Recovery |
| 📋 **10-sec check-in** | Urge slider + HALT+ mood tags + **sleep/exercise levers** | Negative mood + craving predict slips; sleep & exercise are the ADHD dopamine levers |
| 📅 **Daily Practices** | Your routine as a checklist: **Faith template** (Salat al-Hajah, 5 verses with meaning, recitation, gratitude, dua, CBA review), **Secular template**, or fully custom. Progress ring + streak + gratitude list | Behavioral activation; daily-ritual adherence research |
| 🧮 **CBA worksheet** | Interactive SMART Cost-Benefit Analysis (4 quadrants), saved and surfaced **in the panic moment** | SMART Recovery cost-benefit analysis |
| 🕌 **Faith mode** *(off by default)* | Duas for strength, Quran verses on temptation/sabr/patience — shown as a spiritual anchor in the panic flow | Spirituality as a documented coping resource |
| 📊 **Pattern report** | Trigger map: top moods, peak time, avg urge, escalation pattern, sleep correlation, if-then plan + **weekly digest** + **milestones gallery** + native share | Self-monitoring studies; Addictive Behaviors 2024 |
| 📚 **6-week program** | CBT / MI / mindfulness / ACT, ~10 min/week | Hands-Off RCT; SMART Recovery 4-Point |
| 🎯 **Replacement activities** | Substitutes grouped by function with built-in timers | Behavioral activation |
| 🌱 **Soft-fail streak** | Milestones + check-in streak, progress preserved after slips | Rigid-abstinence framing backfires |
| 📱 **Android-first blocking** | Step-by-step device guide: **Private DNS** (no app), AdGuard, SafeSearch, Screen Time (iPhone), hosts (Windows) + copyable blocklist | Environmental design: reduce access friction |
| ⚡ **Phone shortcuts** | Long-press app icon → "Ride an urge" / "Quick check-in" / "Daily practices"; install banner + iOS instructions | Relapse happens on the phone — make help one tap away |
| 🤝 **Ally export** | One-tap weekly summary via native share sheet or clipboard | Accountability/support predicts retention |

## Stack

- **Svelte 5** + Vite
- **Plus Jakarta Sans** (bundled, offline)
- **Dexie** (IndexedDB) — all data on-device
- **vite-plugin-pwa** — installable, offline-capable PWA
- Custom stroke-icon set, hand-authored (no icon library)
- **Built-in i18n** — 7 languages: **English, العربية (Arabic, RTL), Português, Español, Deutsch, Français, Italiano**. Auto-detected from your browser; switchable in Settings → Language. Every string, the 6-week program, and the faith module are fully translated.

## Run it

```bash
npm install
npm run dev       # local dev at http://localhost:5173
npm run build     # production build in dist/
npm run preview   # preview the production build
```

## Put it on your phone

1. Deploy the `dist/` folder to any static host (GitHub Pages, Netlify, your own domain).
2. Open the URL on your phone.
3. Android: browser menu → **Install app** (or use the in-app install card). iPhone: **Share → Add to Home Screen**.
4. Works offline. Data stays in the phone's browser storage only.
5. Long-press the installed icon for shortcuts: **Ride an urge**, **Quick check-in**, **Daily practices**.

## Deploy to GitHub Pages (free, auto)

The repo includes a ready-made workflow (`.github/workflows/deploy.yml`). It builds the app and publishes it whenever you push.

1. Push this project to a GitHub repository (e.g. `github.com/yourname/addicto`). The workflow already sets the correct sub-path (`/addicto/`), so assets, icons and the PWA shortcuts all work — no config needed.
2. On GitHub: **Settings → Pages → Source: "GitHub Actions"** (in newer UIs: *Build and deployment → Source → GitHub Actions*). GitHub Pages must be enabled for the Action to deploy.
3. Push a change (or run the **Deploy to GitHub Pages** workflow manually from the Actions tab).
4. After the run finishes (a minute or two), your app is live at:

   `https://yourname.github.io/addicto/`

5. Open it on your phone → install to home screen → works offline, shortcuts included.

### Notes

- **Custom domain / root deploy:** set `BASE_PATH=/` (in the workflow's `Build` step env, or via `process.env.BASE_PATH`) — e.g. if you deploy to `yourname.github.io` directly or a custom domain.
- **Private repository:** GitHub Pages also works on private repos with the free tier.
- **Updates:** every `git push` to `main` rebuilds and redeploys automatically.

## Privacy

Everything (check-ins, slips, daily levers, practices, CBA, settings, program progress) is stored in your browser's IndexedDB on your own device. There is no backend, no analytics, no tracking, no accounts. Use **Settings → Backup** to move your data to a new device, or **Export CSV** for spreadsheets.

### Stealth mode (Settings → Stealth mode)

Disguise the app as a calculator. The installed icon, name and page title all say **Calculator**, and it opens as a fully working calculator. To unlock the real app, type **`0 ÷ 0 =`** on the calculator. It re-locks whenever the app is reopened. The "Lock now" button in Settings hides it again instantly.

## Blocking sites (per-device, in the app)

The app's Settings → **Block porn on your device** has a step-by-step wizard per platform:

- **Android (recommended):** Settings → Network & internet → Private DNS → `dns.adguard-dns.com` — system-wide adult-content filtering with no app and no battery cost. Optional: AdGuard app with the copyable blocklist, SafeSearch, app timers.
- **iPhone:** Screen Time → Content & Privacy Restrictions → Limit Adult Websites + a never-allow list (add the copyable blocklist) — with your ally holding the passcode.
- **Windows/Mac:** hosts-file blocklist (generated in-app) + DNS-level filtering.

## Open source

MIT licensed. Contribute anything: content, methods, translations, bug fixes. Recovery is different for everyone — the tool should be too.

## Disclaimer

This is a **support tool, not medical treatment**. It implements general CBT/MI/mindfulness/DBT principles shown to help in research trials. If your use is causing serious distress or you need professional help, talk to a licensed therapist.
