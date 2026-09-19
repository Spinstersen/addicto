# Addicto

Addicto is a private, offline-first self-help companion for adults who want to change pornography use that feels difficult to control or is causing real-life harm.

It is not a diagnostic tool, medical treatment, or a promised cure. High-frequency sexual behavior alone is not a disorder, and distress caused only by moral disapproval is not enough for an ICD-11 diagnosis of compulsive sexual behaviour disorder (CSBD).

## Product principles

- **Control and impact over labels.** The onboarding fit check asks about impaired control, persistence, and real-life impact before using a recovery frame.
- **Choice over shame.** A setback becomes a short review and a plan adjustment, not proof that all progress was lost.
- **Measure the intervention, not a fake curve.** The urge flow records intensity before and after a coping action. It never pretends every urge falls on the same timer.
- **Actions over “dopamine reset” claims.** The app uses plain behavioral language and avoids unsupported receptor, withdrawal, and brain-rewiring timelines.
- **Patterns over predictions.** Reports summarize the user's own entries and clearly label them as associations, not causes or diagnoses.
- **Privacy by default.** Data stays in IndexedDB on the device. There is no account, analytics service, or backend.

## Evidence boundaries

The evidence for treatment of problematic pornography use is promising but still limited. A 2024 systematic review found only four randomized clinical trials among the included treatment studies. CBT and ACT-based approaches are promising, but study quality, sample sizes, follow-up, and treatment protocols vary.

The closest tested digital model is **Hands-Off**, a six-module web intervention drawing on motivational interviewing, CBT, mindfulness, and social-psychological techniques. Its preliminary randomized trial reported reductions in problematic use and frequency, alongside a major adherence problem. That supports using a short structured program; it does **not** validate Addicto or any individual feature in this repository.

A 2022 review of mobile apps marketed for pornography problems found that none of the reviewed apps cited direct evidence for the app's efficacy or safety. Addicto therefore does not claim that popular product conventions—streaks, blockers, accountability, timers, or “reboot” language—are proven treatments.

Key sources:

- [WHO ICD-11 Clinical Descriptions and Diagnostic Requirements](https://www.who.int/publications/i/item/9789240077263)
- [Hands-Off randomized feasibility trial](https://pubmed.ncbi.nlm.nih.gov/34727088/)
- [Treatment Approaches for Problematic Pornography Use: A Systematic Review](https://pubmed.ncbi.nlm.nih.gov/37880509/)
- [Validation of a Brief Pornography Screen](https://pmc.ncbi.nlm.nih.gov/articles/PMC8939429/)
- [mHealth Technologies for Managing Problematic Pornography Use: Content Analysis](https://pubmed.ncbi.nlm.nih.gov/36227634/)

## What the app does

- **Careful onboarding:** choose an abstinence or control-focused goal; review impaired control, life impact, persistence, and moral-only distress; build a short coping plan.
- **Quick check-ins:** log urge intensity, feeling, context, sleep, and movement. Context is included in pattern reports.
- **Urge support:** rate the urge, choose one grounding, movement, breathing, delay, environment, or replacement action, then rate it again. The session stores the action and actual outcome.
- **One-tap emergency mode:** paced breathing and a one-minute delay begin immediately, alongside a leave-the-room prompt, the user's strongest prior coping signal, and an optional trusted contact.
- **Seven guided actions:** interactive five-senses grounding, muscle release, mindful observation, leave-the-room countdown, values card, location change, and delayed-choice timer. Each has purpose-built motion, touch feedback, and reduced-motion support.
- **Personal coping signals:** completed before/after sessions are grouped by the actions they included and ranked by average change, with sample counts and early-signal warnings.
- **Actionable weekly review:** turns logged context and coping sessions into one environment change, one if–then plan, and one achievable seven-day goal.
- **Six-week skills course:** short exercises based on motivational work, trigger analysis, environmental design, implementation intentions, behavioral activation, cognitive defusion, and relapse prevention.
- **Personal plan:** values, a one-line reason, likely situations, replacement actions, and an optional support person appear when they are useful.
- **Pattern report:** configurable 7/30/90-day summaries of logged context, feeling, time, urge, setbacks, and completed coping sessions.
- **Optional blocking guidance:** per-device instructions and a customizable domain list. Addicto cannot enforce a system-wide block from inside a PWA.
- **Backup and export:** local JSON backup and CSV export.
- **Calculator privacy shell:** the installed PWA is named and iconed as Calculator. With the lock enabled it opens to a working calculator and unlocks with `0 ÷ 0 =`.

## When self-help is not enough

The app recommends professional assessment when impaired control, persistence, and significant life impact occur together. A qualified clinician should also assess depression, anxiety, trauma, OCD-related symptoms, mania, substance use, medication effects, relationship conflict, and other conditions that can change the treatment plan.

If there is an immediate risk of harm to the user or another person, the urge flow directs the user to local emergency or crisis services instead of presenting the app as crisis care.

## Stack

- Svelte 5 + Vite
- Dexie / IndexedDB
- `vite-plugin-pwa`
- Plus Jakarta Sans, bundled locally
- Seven UI languages with English fallback for newly revised clinical copy

## Run locally

```bash
npm install
npm run dev
npm run build
npm run preview
```

The local development server defaults to `http://localhost:5173/`.

## Privacy and backup compatibility

The IndexedDB database and backup identifier are `addicto`. Existing local data and backups continue to work without a migration or cloud transfer.

Coping rankings are descriptive, not causal. When one session includes several actions, its before/after change contributes to each included action. The interface displays sample sizes and labels results based on only one or two sessions as early signals.

## License

MIT. Clinical claims, translations, crisis copy, and blocking instructions should receive domain-expert review before a public health deployment.
