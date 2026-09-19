<script>
  import { patternReport, data, currentStreakDays, urgeTrend, weekActivity, settings, milestone } from '../lib/store.svelte.js'
  import { MOOD_LABEL, ESCALATION_LABEL, MILESTONES } from '../lib/content.js'
  import { formatDateShort } from '../lib/helpers.js'
  import { vibrate } from '../lib/helpers.js'
  import { t, tf } from '../lib/i18n.svelte.js'
  import { copingInsights, weeklyReview } from '../lib/insights.js'
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

  const report = $derived(patternReport(rangeSlips, rangeCheckins))
  const streakDays = $derived(currentStreakDays())
  const trend = $derived(urgeTrend())
  const week = $derived(weekActivity())
  const m = $derived(milestone())
  const coping = $derived(copingInsights(data.panics))
  const plan = $derived(weeklyReview({ slips: data.slips, checkins: data.checkins, panics: data.panics }))

  const trendDir = $derived.by(() => {
    if (!trend || trend.recent == null || trend.prior == null) return null
    if (trend.recent < trend.prior - 0.4) return 'down'
    if (trend.recent > trend.prior + 0.4) return 'up'
    return 'flat'
  })

  const weekNote = $derived(
    week.slips === 0 && week.checkins >= 4 ? 'You practiced consistent self-monitoring this week. Notice what made that possible.'
      : week.slips === 0 ? 'No slips logged this week. Keep tracking context so the picture stays useful.'
      : week.slips <= 2 ? 'You logged each setback. Review what came before it and choose one plan change.'
      : 'A difficult week. Focus on safety, support and one practical change rather than self-punishment.'
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
        {t('This page summarizes what you logged. It shows associations in your own entries—not causes, predictions or a diagnosis.')}
      </p>
    </div>
  </div>

  <div class="review-shell">
    <div class="review-core">
      <div class="review-head">
        <div><span class="eyebrow on">{t('Next seven days')}</span><h2>{t('One pattern. One practical plan.')}</h2></div>
        <span class="review-mark"><Icon name="compass" size={21} /></span>
      </div>
      <div class="review-list">
        <div class="review-row"><span>01</span><div><small>{t('High-risk context')}</small><strong>{plan.contextText}</strong></div></div>
        <div class="review-row"><span>02</span><div><small>{t('Most helpful coping signal')}</small><strong>{plan.strategyText}</strong>{#if plan.sampleWarning}<em>{plan.sampleWarning}</em>{/if}</div></div>
        <div class="review-row"><span>03</span><div><small>{t('Environment change')}</small><strong>{plan.environment}</strong></div></div>
        <div class="review-row featured"><span>04</span><div><small>{t('If–then plan')}</small><strong>“{plan.implementation}”</strong></div></div>
        <div class="review-row"><span>05</span><div><small>{t('Realistic weekly goal')}</small><strong>{plan.realisticGoal}</strong></div></div>
      </div>
      <p class="review-note">{t('Generated from your own entries. Associations are tentative, especially with fewer than three sessions.')}</p>
    </div>
  </div>

  {#if coping.ranked.length}
    <div class="shell">
      <div class="core">
        <div class="card-title"><span class="dot"></span>{t('What seems to help')}</div>
        {#each coping.ranked.slice(0, 3) as action, index (action.id)}
          <div class="strategy-row">
            <span class="strategy-rank">{index + 1}</span>
            <div class="grow"><strong>{action.label}</strong><small>{t('Average change')} {action.avgDrop.toFixed(1)} · {action.samples} {action.samples === 1 ? t('session') : t('sessions')}</small></div>
            <span class="strategy-meter"><i style="transform:scaleX({Math.max(0.06, Math.min(1, action.avgDrop / 5))})"></i></span>
          </div>
        {/each}
        {#if coping.night}
          <div class="callout vio" style="margin-top:12px;"><Icon name="moon" size={19} /><div><strong>{coping.night.label}</strong> {t('has the strongest nighttime signal in your completed sessions.')} ({coping.night.nightSamples}×)</div></div>
        {/if}
      </div>
    </div>
  {/if}

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
            <div><strong>{t('Urges were lower this week.')}</strong> {tf('Your logged average moved from {prior} to {recent}/10. Consider what changed, while remembering that small samples can fluctuate.', { prior: trend.prior.toFixed(1), recent: trend.recent.toFixed(1) })}</div>
          </div>
        {/if}

        {#if report.topContexts.length}
          <div class="label-block">{t('Most logged contexts')}</div>
          {#each report.topContexts as item (item.context)}
            <div class="list-item"><span>{t(item.context)}</span><span class="tag vio">{item.count}×</span></div>
          {/each}
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
        {#if report.peakHour !== null}<div class="list-item">
          <span>{t('Peak time of day')}</span>
          <span class="tag vio">{t(report.hourFrac)} · ~{report.peakHour}:00</span>
        </div>{/if}
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

        {#if report.totalSlips > 0}<div class="divider"></div>
        <div class="callout vio">
          <Icon name="shield" size={20} />
          <div>
            <strong>{t('Your if-then plan:')}</strong> {tf('IF {mood} around {time}, THEN {action}.', {
              mood: report.topMoods[0] ? t(MOOD_LABEL[report.topMoods[0].mood].toLowerCase()) : t('I feel an urge'),
              time: t(report.hourFrac),
              action: report.topEscalation[0]?.id === 'tabjump' ? t('I close all tabs and leave the room') : t('I do a replacement activity for 10 minutes')
            })}
          </div>
        </div>{/if}
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
        <strong>{t('Trends describe your entries; they do not explain the cause.')}</strong><br />
        {t('Look for repeated contexts and compare several weeks before changing your plan. A few entries can create a misleading pattern.')}<br />
        {t('If distress or impairment is significant, share the pattern with a qualified clinician instead of relying on the app alone.')}
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
  .review-shell { padding:6px; margin-bottom:14px; border-radius:32px; background:linear-gradient(145deg,rgba(94,234,212,.08),rgba(167,139,250,.045)); box-shadow:inset 0 0 0 1px rgba(94,234,212,.14),var(--ambient); }
  .review-core { padding:22px; border-radius:26px; background:radial-gradient(28rem 20rem at 100% 0,rgba(94,234,212,.09),transparent 60%),rgba(8,11,18,.95); box-shadow:inset 0 0 0 1px var(--hairline); }
  .review-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }.review-head h2{font-size:1.35rem;margin-top:9px}.review-mark{width:46px;height:46px;display:grid;place-items:center;flex-shrink:0;border-radius:15px;color:var(--acc);background:rgba(94,234,212,.08);box-shadow:inset 0 0 0 1px rgba(94,234,212,.16);animation:compass-drift 4s var(--spring) infinite alternate}
  .review-list { display:flex; flex-direction:column; gap:7px; }
  .review-row { display:grid; grid-template-columns:28px 1fr; gap:10px; padding:12px 13px; border-radius:17px; background:rgba(255,255,255,.025); box-shadow:inset 0 0 0 1px rgba(255,255,255,.045); transition:transform .45s var(--spring),background .45s var(--spring); }.review-row:hover{transform:translateX(3px);background:rgba(255,255,255,.04)}.review-row>span{color:var(--acc);font-size:.59rem;font-weight:800;letter-spacing:.1em;padding-top:3px}.review-row small,.review-row strong,.review-row em{display:block}.review-row small{color:var(--text-3);font-size:.6rem;font-weight:750;letter-spacing:.1em;text-transform:uppercase}.review-row strong{font-size:.78rem;line-height:1.5;margin-top:4px}.review-row em{color:var(--warn);font-size:.64rem;margin-top:4px;font-style:normal}.review-row.featured{background:linear-gradient(135deg,rgba(94,234,212,.075),rgba(94,234,212,.02));box-shadow:inset 0 0 0 1px rgba(94,234,212,.14)}
  .review-note { color:var(--text-3); font-size:.64rem; line-height:1.5; margin:14px 4px 0; }
  .strategy-row { display:grid; grid-template-columns:30px minmax(0,1fr) 62px; gap:10px; align-items:center; padding:11px 0; border-bottom:1px solid var(--hairline); }.strategy-row:last-of-type{border-bottom:0}.strategy-rank{width:28px;height:28px;display:grid;place-items:center;border-radius:10px;color:var(--acc);background:rgba(94,234,212,.07);font-size:.7rem;font-weight:800}.strategy-row strong,.strategy-row small{display:block}.strategy-row strong{font-size:.82rem}.strategy-row small{color:var(--text-3);font-size:.65rem;margin-top:3px}.strategy-meter{height:4px;overflow:hidden;border-radius:4px;background:rgba(255,255,255,.06)}.strategy-meter i{display:block;width:100%;height:100%;transform-origin:left;background:linear-gradient(90deg,var(--vio),var(--acc));transition:transform .9s var(--spring)}
  @keyframes compass-drift { from{transform:rotate(-7deg)} to{transform:rotate(8deg)} }
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
