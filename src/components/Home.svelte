<script>
  import {
    currentStreakDays,
    currentStreakHours,
    currentStreakMs,
    longestStreakDays,
    panicCompletedCount,
    slipsLast30,
    isRelapseRecent,
    checkinStreak,
    milestone,
    practicesProgress,
    practiceStreak,
    data,
    settings
  } from '../lib/store.svelte.js'
  import { formatDuration, timeAgo } from '../lib/helpers.js'
  import { install, promptInstall } from '../lib/install.svelte.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { onpanic, go } = $props()

  const greeting = new Date().getHours()
  const hello = greeting < 5 ? 'Still up' : greeting < 12 ? 'Morning' : greeting < 18 ? 'Afternoon' : 'Evening'

  const m = milestone()
  const days = currentStreakDays()
  const hours = currentStreakHours()
  const nextDays = m.next ? m.next.days : null
  const progressToNext = nextDays ? Math.min(1, (days - (m.current?.days || 0)) / (nextDays - (m.current?.days || 0))) : 1

  const prac = practicesProgress()
  const showInstall = (!install.standalone && (install.deferred || !install.supported)) && data.checkins.length > 0
</script>

<div class="screen">
  <ScreenHeader eyebrow={t(hello)} title={t('Stay in the wave.')} {go} />

  {#if showInstall && !install.standalone}
    <div class="shell" style="border-color: rgba(167,139,250,0.3);">
      <div class="core" style="display:flex; align-items:center; gap:14px; padding:16px;">
        <span class="tipp-ic"><Icon name="download" size={20} /></span>
        <div class="grow">
          <div style="font-weight:700;">{t('Install this app')}</div>
          <div class="faint" style="font-size:0.8rem;">
            {install.deferred ? t('One tap — fullscreen, offline, always one icon away.') : t('On iPhone: Share → Add to Home Screen.')}
          </div>
        </div>
        {#if install.deferred}
          <button class="btn btn-primary btn-sm" onclick={promptInstall}>{t('Install')}</button>
        {/if}
      </div>
    </div>
  {/if}

  {#if isRelapseRecent()}
    <div class="shell">
      <div class="core center">
        <div class="hero-num" style="font-size: 2.6rem; color: var(--text); -webkit-text-fill-color: var(--text);">{formatDuration(currentStreakMs())}</div>
        <div class="hero-unit">{t('since your last slip. One moment, not a verdict.')}</div>
        <div class="divider" style="margin: 16px 0;"></div>
        <p class="muted" style="font-size:0.92rem;">
          {t('The hinge is the next hour. Log it, name the function it was serving, and keep the streak — nothing resets here.')}
        </p>
      </div>
    </div>
  {:else}
    <div class="shell">
      <div class="core center">
        <div class="hero-num">{days > 0 ? days : hours}</div>
        <div class="hero-unit">{days > 0 ? (days === 1 ? t('day clean') : t('days clean')) : hours === 1 ? t('hour clean') : t('hours clean')}</div>
        {#if m.current}
          <div style="margin-top:18px;">
            <span class="eyebrow on">{t(m.current.name)}</span>
          </div>
          <p class="faint" style="font-size:0.85rem; margin-top:10px;">{t(m.current.line)}</p>
          {#if m.next}
            <div class="progress" style="margin-top:12px;"><div style="width: {progressToNext * 100}%;"></div></div>
            <div class="faint" style="font-size:0.74rem; margin-top:6px;">{t('next:')} {t(m.next.name)} · {m.next.days} {m.next.days === 1 ? t('day') : t('days')}</div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  {#if data.practices.length > 0}
    <button class="prac-bar" onclick={() => go('practices')}>
      <span class="prac-ic2"><Icon name="calendar" size={18} /></span>
      <span class="grow" style="text-align:left;">
        <span style="font-weight:700; font-size:0.9rem;">{t('Practices')}</span>
        <span class="faint" style="font-size:0.76rem; display:block;">{prac.done}/{prac.total} {t('done today')} · {practiceStreak()}{t('d streak')}</span>
      </span>
      <span class="mini-prog"><span style="width:{prac.pct * 100}%;"></span></span>
      <Icon name="chev" size={16} style="transform:rotate(-90deg); stroke:var(--text-3);" />
    </button>
  {/if}

  <div class="shell flat">
    <div class="core center" style="padding: 24px 20px 20px;">
      <button class="btn btn-urgent btn-block btn-lg" onclick={() => onpanic()}>
        <Icon name="wave" size={22} /> {t('I need help now')}
      </button>
      <p class="faint" style="font-size:0.82rem; margin-top:12px;">{t('Panic button — breathing, urge-surfing and your crisis plan in one tap.')}</p>
      <div class="divider" style="margin: 16px 0;"></div>
      <div class="orb-wrap">
        <button class="orb" onclick={() => onpanic()}>
          <Icon name="wave" size={30} />
          <span>{t('Ride the urge')}</span>
        </button>
      </div>
      <p class="faint" style="font-size:0.82rem; margin-top:10px;">{t('Or surf the wave — urges peak and fall in 10–20 minutes.')}</p>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="num">{longestStreakDays()}</div><div class="cap">{t('Best')}</div></div>
    <div class="stat accent"><div class="num">{panicCompletedCount()}</div><div class="cap">{t('Ridden')}</div></div>
    <div class="stat"><div class="num">{checkinStreak()}</div><div class="cap">{t('Check-ins')}</div></div>
  </div>

  {#if settings.reasons}
    <div class="shell">
      <div class="core">
        <div class="card-title"><span class="dot"></span>{t('Your anchor')}</div>
        <p style="font-size:1.08rem; font-weight:600; line-height:1.4;">"{settings.reasons}"</p>
      </div>
    </div>
  {/if}

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Today')}</div>
      {#if data.checkins.length > 0 && new Date(data.checkins[0].ts).toDateString() === new Date().toDateString()}
        <div class="list-item" style="padding-top:0;">
          <div>
            <div class="l-label">{t('Check-in logged')} {timeAgo(data.checkins[0].ts)}</div>
            <div class="l-sub">{t('urge')} {data.checkins[0].urge}/10{#if data.checkins[0].mood} · {t(data.checkins[0].mood)}{/if}</div>
          </div>
          <span class="tag acc"><Icon name="check" size={13} />{t('done')}</span>
        </div>
      {:else}
        <p class="muted" style="font-size:0.92rem;">{t('No check-in yet today. A 10-second check-in is the single highest-leverage habit in this app.')}</p>
      {/if}
      {#if slipsLast30() > 0}
        <div class="list-item">
          <div>
            <div class="l-label">{slipsLast30()} {slipsLast30() === 1 ? t('slip') : t('slips')} {t('in 30 days')}</div>
            <div class="l-sub">{t('each one is data that sharpens your trigger map')}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .prac-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    border-radius: var(--r-sm);
    background: var(--core);
    border: 1px solid var(--hairline);
    box-shadow: var(--hairline-shadow);
    transition: transform 0.3s var(--spring), border-color 0.25s;
  }
  .prac-bar:active { transform: scale(0.98); border-color: rgba(94,234,212,0.35); }
  .prac-ic2 {
    width: 40px; height: 40px; border-radius: 13px;
    background: linear-gradient(160deg, rgba(94,234,212,0.14), rgba(94,234,212,0.03));
    border: 1px solid rgba(94,234,212,0.22);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .prac-ic2 :global(svg) { stroke: var(--acc); }
  .mini-prog {
    width: 46px; height: 6px; border-radius: 6px;
    background: var(--core-2); overflow: hidden;
  }
  .mini-prog span {
    display: block; height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #34d399, #5eead4);
  }
  .tipp-ic {
    width: 40px; height: 40px; border-radius: 13px;
    background: linear-gradient(160deg, rgba(167,139,250,0.14), rgba(167,139,250,0.03));
    border: 1px solid rgba(167,139,250,0.22);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tipp-ic :global(svg) { stroke: var(--vio); }
</style>
