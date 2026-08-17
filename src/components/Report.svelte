<script>
  import { patternReport, data, currentStreakDays, urgeTrend, weekActivity, settings, milestone } from '../lib/store.svelte.js'
  import { MOOD_LABEL, ESCALATION_LABEL, MILESTONES } from '../lib/content.js'
  import { formatDateShort } from '../lib/helpers.js'
  import { vibrate } from '../lib/helpers.js'
  import { t, tf } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  const MOOD_ICON = {
    bored: 'hourglass', lonely: 'users', stressed: 'cloud', angry: 'zap', tired: 'moon',
    hungry: 'coffee', anxious: 'activity', sad: 'drop', content: 'smile', excited: 'star'
  }

  let { go } = $props()

  let range = $state(30)
  let shareNote = $state('')

  const inRange = (ts) => ts > Date.now() - range * 86400000
  const rangeSlips = $derived(data.slips.filter((s) => inRange(s.ts)))
  const rangeCheckins = $derived(data.checkins.filter((c) => inRange(c.ts)))

  const byDay = $derived.by(() => {
    const days = []
    const now = new Date()
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      days.push({ ts: d.getTime(), slips: 0, checkins: 0 })
    }
    for (const s of rangeSlips) {
      const d = new Date(s.ts)
      d.setHours(0, 0, 0, 0)
      const idx = days.findIndex((x) => x.ts === d.getTime())
      if (idx >= 0) days[idx].slips++
    }
    for (const c of rangeCheckins) {
      const d = new Date(c.ts)
      d.setHours(0, 0, 0, 0)
      const idx = days.findIndex((x) => x.ts === d.getTime())
      if (idx >= 0) days[idx].checkins++
    }
    return days
  })

  const maxSlips = $derived(Math.max(1, ...byDay.map((d) => d.slips)))
  const maxCheckins = $derived(Math.max(1, ...byDay.map((d) => d.checkins)))

  const report = $derived(patternReport())
  const streakDays = $derived(currentStreakDays())
  const trend = $derived(urgeTrend())
  const week = $derived(weekActivity())
  const m = $derived(milestone())

  const trendDir = $derived.by(() => {
    if (!trend || trend.recent == null || trend.prior == null) return null
    if (trend.recent < trend.prior - 0.4) return 'down'
    if (trend.recent > trend.prior + 0.4) return 'up'
    return 'flat'
  })

  const weekNote = $derived(
    week.slips === 0 && week.checkins >= 4 ? 'A clean week with real self-monitoring. That is the whole method working.'
      : week.slips === 0 ? 'No slips this week. Keep logging so the data stays honest.'
      : week.slips <= 2 ? 'Few slips, and each one logged = each one learned from.'
      : 'A heavy week. Drop the judgement — the levers (sleep, movement, friction) are what turn this around.'
  )

  async function shareAlly() {
    const d = data.slips.length
    const last30 = data.slips.filter((s) => s.ts > Date.now() - 30 * 86400000).length
    const ridden = data.panics.filter((p) => p.completed).length
    const name = settings.allyName ? `Hey ${settings.allyName}, ` : ''
    const text =
      `${name}here's my Addicto weekly summary.\n\n` +
      `• Days since last slip: ${Math.floor((Date.now() - (data.slips[0]?.ts ?? Date.now())) / 86400000)}\n` +
      `• Slips logged total: ${d} (${last30} in the last 30 days)\n` +
      `• Urges ridden out: ${ridden}\n` +
      `• Check-ins logged: ${data.checkins.length}\n\n` +
      `Keeping it honest. No judgement — just accountability.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Addicto summary', text })
        return
      }
    } catch {
      /* user cancelled — fall through to clipboard */
    }
    await navigator.clipboard.writeText(text)
    shareNote = t('Summary copied — paste it to your ally')
    setTimeout(() => (shareNote = ''), 3000)
  }
</script>

<div class="screen">
  {#snippet rangeSwitch()}
    <div class="row" style="gap:6px;">
      {#each [7, 30, 90] as r (r)}
        <button class="btn btn-sm" class:btn-primary={range === r} class:btn-soft={range !== r} onclick={() => (range = r)}>{r}d</button>
      {/each}
    </div>
  {/snippet}

  <ScreenHeader eyebrow={t('Trigger intelligence')} title={t('Your patterns.')} {go} right={rangeSwitch} />

  {#if shareNote}
    <div class="callout acc" style="margin-bottom:12px;"><Icon name="check" size={18} /><div>{shareNote}</div></div>
  {/if}

  <div class="shell">
    <div class="core">
      <p class="body">
        {t('Negative mood and craving intensity predict a slip hours before it happens. This page turns your honest logging into a map of your danger zones — not generic advice.')}
      </p>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="num">{streakDays}</div><div class="cap">{t('Day streak')}</div></div>
    <div class="stat accent"><div class="num">{rangeSlips.length}</div><div class="cap">{t('Slips /')} {range}d</div></div>
    <div class="stat"><div class="num">{rangeCheckins.length}</div><div class="cap">{t('Check-ins')}</div></div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{tf('Last {range} days', { range })}</div>
      <div class="bars">
        {#each byDay as d (d.ts)}
          <div class="bar-col" title="{formatDateShort(d.ts)} — {d.slips} {t('slips')}, {d.checkins} {t('check-in')}s">
            <div class="bar danger" style="height: {Math.max(3, (d.slips / maxSlips) * 100)}%;"></div>
            <div class="bar sky" style="height: {Math.max(2, (d.checkins / maxCheckins) * 32)}%;"></div>
          </div>
        {/each}
      </div>
      <div class="legend">
        <span><span class="sw" style="background:rgba(251,113,133,0.7);"></span>{t('slip')}</span>
        <span><span class="sw" style="background:rgba(125,211,252,0.5);"></span>{t('check-in')}</span>
      </div>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('This week')}</div>
      <div class="stat-row" style="margin-bottom:4px;">
        <div class="stat accent"><div class="num">{week.slips}</div><div class="cap">{t('Slips')}</div></div>
        <div class="stat"><div class="num">{week.checkins}</div><div class="cap">{t('Check-ins')}</div></div>
        <div class="stat"><div class="num">{week.panics}</div><div class="cap">{t('Ridden')}</div></div>
      </div>
      <p class="muted" style="font-size:0.9rem;">{t(weekNote)}</p>
      <div class="row" style="gap:8px; margin-top:12px;">
        <button class="btn btn-ghost btn-block btn-sm" onclick={shareAlly}>
          <Icon name="share" size={15} /> {t('Share to ally')}
        </button>
      </div>
    </div>
  </div>

  {#if report}
    <div class="shell">
      <div class="core">
        <div class="card-title"><span class="dot"></span>{t('What precedes your slips')}</div>
        <p class="faint" style="font-size:0.82rem; margin-bottom:10px;">{t('Based on')} {report.totalSlips} {t('logged slips')}</p>

        {#if trendDir === 'down' && trend.recentN >= 3}
          <div class="callout acc" style="margin-bottom:14px;">
            <Icon name="chart" size={20} />
            <div><strong>{t('Rewiring signal.')}</strong> {tf('Average urge intensity is down from {prior} to {recent}/10. The desensitization is reversing.', { prior: trend.prior.toFixed(1), recent: trend.recent.toFixed(1) })}</div>
          </div>
        {/if}

        {#if report.topMoods.length}
          <div class="label-block">{t('Most common states')}</div>
          {#each report.topMoods as tm (tm.mood)}
            <div class="list-item">
              <span class="row"><Icon name={MOOD_ICON[tm.mood] || 'smile'} size={16} /> {t(MOOD_LABEL[tm.mood] || tm.mood)}</span>
              <span class="tag acc">{tm.count}×</span>
            </div>
          {/each}
        {/if}

        <div class="divider"></div>
        <div class="list-item">
          <span>{t('Peak time of day')}</span>
          <span class="tag vio">{t(report.hourFrac)} · ~{report.peakHour}:00</span>
        </div>
        {#if report.avgUrge !== null}
          <div class="list-item">
            <span>{t('Average urge at slip')}</span>
            <span class="tag acc">{report.avgUrge}/10</span>
          </div>
        {/if}
        {#if report.topEscalation.length}
          <div class="list-item">
            <span>{t('Escalation pattern')}</span>
            <div class="row" style="flex-wrap:wrap; justify-content:flex-end;">
              {#each report.topEscalation as e (e.id)}
                <span class="tag warn">{t(ESCALATION_LABEL[e.id] || e.id)} · {e.count}×</span>
              {/each}
            </div>
          </div>
        {/if}
        {#if report.sleepBadCount > 0}
          <div class="list-item">
            <span>{t('Slips after poor sleep')}</span>
            <span class="tag vio">{report.sleepBadCount}×</span>
          </div>
        {/if}

        <div class="divider"></div>
        <div class="callout vio">
          <Icon name="shield" size={20} />
          <div>
            <strong>{t('Your if-then plan:')}</strong> {tf('IF {mood} around {time}, THEN {action}.', {
              mood: report.topMoods[0] ? t(MOOD_LABEL[report.topMoods[0].mood].toLowerCase()) : t('I feel an urge'),
              time: t(report.hourFrac),
              action: report.topEscalation[0]?.id === 'tabjump' ? t('I close all tabs and leave the room') : t('I do a replacement activity for 10 minutes')
            })}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="shell">
      <div class="core center">
        <div class="big-glyph"><Icon name="chart" size={30} /></div>
        <h2 style="font-size:1.2rem;">{t('This page needs honest data.')}</h2>
        <p class="muted" style="font-size:0.9rem; margin-top:6px;">
          {t('Log check-ins daily and slips without shame, and this becomes the most valuable screen in the app — your personal trigger map.')}
        </p>
      </div>
    </div>
  {/if}

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Reading the trend')}</div>
      <p class="body" style="font-size:0.88rem;">
        <strong>{t('Rising urge intensity over weeks')}</strong> {t('often means escalation mechanisms are creeping in (more time, more extreme, tab-jumping) — catch and name them.')}<br />
        <strong>{t('Falling urge intensity')}</strong> {t('is the recovery signal: receptor sensitivity returning.')}<br />
        <strong>{t('Poor sleep or skipped exercise')}</strong> {t('show up as higher average urge. They\'re levers, not punishments.')}
      </p>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Milestones')}</div>
      <div class="ms-grid">
        {#each MILESTONES as ms (ms.days)}
          <div class="ms-item" class:done={streakDays >= ms.days} class:current={m.current?.days === ms.days}>
            <span class="ms-badge">
              {#if streakDays >= ms.days}<Icon name="check" size={14} />{:else}{ms.days}{/if}
            </span>
            <div class="grow">
              <div style="font-weight:700; font-size:0.92rem;">{t(ms.name)}</div>
              <div class="faint" style="font-size:0.74rem;">{t(ms.line)}</div>
            </div>
            {#if streakDays >= ms.days}
              <Icon name="star" size={14} style="stroke:var(--warn); flex-shrink:0;" />
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .label-block {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin: 4px 0 2px;
  }
  .ms-grid { display: flex; flex-direction: column; }
  .ms-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--hairline);
  }
  .ms-item:last-child { border-bottom: none; }
  .ms-item:not(.done) { opacity: 0.55; }
  .ms-item.current { opacity: 1; }
  .ms-badge {
    width: 34px; height: 34px; border-radius: 11px;
    background: var(--core-2); border: 1px solid var(--hairline-strong);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.82rem; flex-shrink: 0;
  }
  .ms-item.done .ms-badge {
    background: linear-gradient(135deg, #6ee7da, #34d399);
    border-color: transparent; color: #04251f;
  }
  .ms-item.current .ms-badge { border-color: rgba(94,234,212,0.5); box-shadow: 0 0 16px -4px var(--acc-glow); }
</style>
