<script>
  import { currentStreakDays, currentStreakHours, checkinStreak, practicesProgress, weekActivity, data, settings } from '../lib/store.svelte.js'
  import { install, promptInstall } from '../lib/install.svelte.js'
  import { t } from '../lib/i18n.svelte.js'
  import { copingInsights } from '../lib/insights.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { onpanic, onquick, go } = $props()

  const checkedToday = $derived(data.checkins.some((item) => new Date(item.ts).toDateString() === new Date().toDateString()))
  const days = $derived(currentStreakDays())
  const hours = $derived(currentStreakHours())
  const week = $derived(weekActivity())
  const practice = $derived(practicesProgress())
  const showInstall = $derived((!install.standalone && (install.deferred || !install.supported)) && data.checkins.length > 0)
  const nextStep = $derived(!checkedToday ? 'checkin' : data.practices.length && practice.done < practice.total ? 'practices' : 'program')
  const nextCopy = $derived(nextStep === 'checkin' ? 'Log a quick check-in' : nextStep === 'practices' ? 'Continue today’s plan' : 'Continue the skills program')
  const coping = $derived(copingInsights(data.panics))
</script>

<div class="home">
  <ScreenHeader eyebrow={t('Private recovery companion')} title={t('Make the next choice easier.')} {go} />

  {#if showInstall}
    <div class="install-strip">
      <span><Icon name="download" size={18} /></span>
      <div class="grow"><strong>{t('Install for quick access')}</strong><small>{install.deferred ? t('Works offline and opens full-screen.') : t('On iPhone: Share → Add to Home Screen.')}</small></div>
      {#if install.deferred}<button class="btn btn-primary btn-sm" onclick={promptInstall}>{t('Install')}</button>{/if}
    </div>
  {/if}

  <section class="urgent-shell">
    <div class="urgent-core">
      <div>
        <span class="eyebrow danger-dot">{t('In the moment')}</span>
        <h2>{t('An urge is here? Start immediately.')}</h2>
        <p>{t('One tap begins paced breathing, a short delay and a prompt to change location. No decisions required first.')}</p>
      </div>
      <button class="btn urge-btn" onclick={onquick}>
        <span class="urge-icon"><Icon name="wave" size={23} /></span>
        <span><strong>{t('Help me now')}</strong><small>{t('Breathing starts instantly')}</small></span>
        <span class="arrow"><Icon name="arrow" size={16} /></span>
      </button>
      <button class="toolkit-link" onclick={onpanic}><Icon name="sliders" size={15} /> {t('Open the full guided toolkit')}</button>
    </div>
  </section>

  {#if coping.best}
    <section class="signal-shell">
      <div class="signal-core">
        <span class="signal-glyph"><Icon name="sparkle" size={19} /></span>
        <div class="grow">
          <span class="eyebrow on">{t('Your coping signal')}</span>
          <strong>{coping.best.label} {t('has accompanied the strongest change.')}</strong>
          <small>{t('Average reduction')} {coping.best.avgDrop.toFixed(1)} {t('points across')} {coping.best.samples} {coping.best.samples === 1 ? t('session') : t('sessions')}. {coping.best.samples < 3 ? t('Treat this as an early signal.') : ''}</small>
        </div>
        <button class="round-btn" onclick={onquick} aria-label={t('Use this strategy now')}><Icon name="arrow" size={16} /></button>
      </div>
    </section>
  {/if}

  <section class="today-grid">
    <div class="today-main">
      <span class="eyebrow on">{t('Best next step')}</span>
      <h2>{t(nextCopy)}</h2>
      <p>{nextStep === 'checkin' ? t('Capture urge, feeling and context. The pattern becomes useful after repeated honest entries.') : nextStep === 'practices' ? `${practice.done}/${practice.total} ${t('done today')}` : t('Short CBT-style exercises, one useful action at a time.')}</p>
      <button class="btn btn-primary" onclick={() => go(nextStep)}>
        {t('Start now')} <span class="arrow"><Icon name="arrow" size={15} /></span>
      </button>
    </div>
    <div class="status-card">
      <span class="status-number">{settings.goalMode === 'control' ? week.checkins : days > 0 ? days : hours}</span>
      <span class="status-label">{settings.goalMode === 'control' ? t('check-ins this week') : days > 0 ? t(days === 1 ? 'day since last slip' : 'days since last slip') : t(hours === 1 ? 'hour since last slip' : 'hours since last slip')}</span>
      <div class="status-rule"></div>
      <span class="status-note">{settings.goalMode === 'control' ? t('Track choice and life impact, not abstinence alone.') : t('A useful signal, not a score of your worth.')}</span>
    </div>
  </section>

  {#if settings.reasons || settings.crisis.topAlternatives.length}
    <section class="plan-shell">
      <div class="plan-core">
        <div class="card-title"><span class="dot"></span>{t('Your plan')}</div>
        {#if settings.reasons}<blockquote>“{settings.reasons}”</blockquote>{/if}
        {#if settings.crisis.topAlternatives.length}
          <div class="plan-actions">
            {#each settings.crisis.topAlternatives.slice(0, 3) as action (action)}<span>{action}</span>{/each}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <section class="week-shell">
    <div class="week-core">
      <div class="week-head">
        <div><span class="eyebrow">{t('Last 7 days')}</span><h2>{t('Progress is more than a streak.')}</h2></div>
        <button class="round-btn" onclick={() => go('report')} aria-label={t('Open patterns')}><Icon name="arrow" size={17} /></button>
      </div>
      <div class="metric-grid">
        <div><strong>{week.checkins}</strong><span>{t('check-ins')}</span></div>
        <div><strong>{week.panics}</strong><span>{t('coping sessions')}</span></div>
        <div><strong>{week.slips}</strong><span>{t('slips logged')}</span></div>
        <div><strong>{checkinStreak()}</strong><span>{t('days showing up')}</span></div>
      </div>
    </div>
  </section>

  <div class="quick-row">
    <button onclick={() => go('activities')}><Icon name="sparkle" size={18} /><span><strong>{t('Replacement menu')}</strong><small>{t('Match an action to what you need')}</small></span><Icon name="chev" size={15} /></button>
    <button onclick={() => go('settings')}><Icon name="shield" size={18} /><span><strong>{t('Friction & support')}</strong><small>{t('Blocking guide, ally and privacy')}</small></span><Icon name="chev" size={15} /></button>
  </div>
</div>

<style>
  .home { display:flex; flex-direction:column; gap:15px; }
  .install-strip { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:18px; background:rgba(167,139,250,.07); box-shadow:inset 0 0 0 1px rgba(167,139,250,.16); }
  .install-strip > span { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:rgba(167,139,250,.1); color:var(--vio); }
  .install-strip strong, .install-strip small { display:block; }
  .install-strip small { color:var(--text-3); font-size:.75rem; margin-top:2px; }
  .urgent-shell, .plan-shell, .week-shell, .signal-shell { padding:5px; border-radius:var(--r-shell); background:var(--shell); box-shadow:inset 0 0 0 1px var(--hairline), var(--ambient); }
  .urgent-core { border-radius:var(--r-core); padding:24px; background:radial-gradient(34rem 18rem at 100% 0, rgba(251,113,133,.12), transparent 58%), #0b0d14; box-shadow:inset 0 0 0 1px rgba(251,113,133,.15); }
  .urgent-core h2, .today-main h2, .week-head h2 { font-size:clamp(1.28rem, 5vw, 1.65rem); margin-top:10px; }
  .urgent-core p, .today-main p { color:var(--text-2); font-size:.88rem; margin-top:8px; max-width:34rem; }
  .danger-dot { color:#fda4af; background:rgba(251,113,133,.08); border-color:rgba(251,113,133,.18); }
  .urge-btn { width:100%; justify-content:flex-start; min-height:62px; margin-top:22px; padding:8px 10px; color:#261014; background:linear-gradient(135deg,#fda4af,#fb7185); box-shadow:0 15px 36px -18px rgba(251,113,133,.75); }
  .urge-btn > span:nth-child(2) { flex:1; text-align:left; }
  .urge-btn strong,.urge-btn small { display:block; }.urge-btn small { margin-top:2px; font-size:.68rem; opacity:.72; }
  .urge-icon { width:42px; height:42px; border-radius:50%; display:grid; place-items:center; background:rgba(54,15,24,.09); }
  .toolkit-link { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; margin-top:12px; color:var(--text-3); font-size:.76rem; font-weight:650; transition:transform .4s var(--spring),color .4s var(--spring); }.toolkit-link:active{transform:scale(.97);color:var(--text-2)}
  .signal-core { display:flex; align-items:center; gap:13px; padding:16px; border-radius:var(--r-core); background:linear-gradient(135deg,rgba(94,234,212,.07),rgba(167,139,250,.035)); box-shadow:inset 0 0 0 1px rgba(94,234,212,.13); }
  .signal-glyph { width:42px; height:42px; flex-shrink:0; display:grid; place-items:center; border-radius:14px; color:var(--acc); background:rgba(94,234,212,.09); box-shadow:inset 0 0 0 1px rgba(94,234,212,.16); }.signal-core strong,.signal-core small{display:block}.signal-core strong{margin-top:7px;font-size:.84rem}.signal-core small{margin-top:4px;color:var(--text-3);font-size:.68rem;line-height:1.45}
  .today-grid { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(150px,.8fr); gap:12px; }
  .today-main, .status-card { padding:22px; border-radius:25px; background:var(--core); box-shadow:inset 0 0 0 1px var(--hairline), var(--hairline-shadow); }
  .today-main .btn { margin-top:18px; }
  .status-card { display:flex; flex-direction:column; justify-content:center; }
  .status-number { font-size:3rem; font-weight:800; letter-spacing:-.06em; color:var(--acc); line-height:1; }
  .status-label { color:var(--text-2); font-size:.78rem; margin-top:7px; }
  .status-rule { height:1px; background:var(--hairline); margin:16px 0; }
  .status-note { color:var(--text-3); font-size:.72rem; line-height:1.45; }
  .plan-core, .week-core { padding:21px; border-radius:var(--r-core); background:var(--core); box-shadow:inset 0 0 0 1px var(--hairline); }
  blockquote { margin:0; font-size:1.08rem; font-weight:650; line-height:1.55; }
  .plan-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:15px; }
  .plan-actions span { padding:7px 11px; border-radius:999px; color:var(--text-2); background:var(--core-2); font-size:.76rem; box-shadow:inset 0 0 0 1px var(--hairline); }
  .week-head { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
  .round-btn { width:42px; height:42px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; background:var(--core-2); box-shadow:inset 0 0 0 1px var(--hairline-strong); transition:transform .35s var(--spring); }
  .round-btn:active { transform:scale(.92); }
  .metric-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:20px; }
  .metric-grid div { padding:13px 10px; border-radius:16px; background:rgba(255,255,255,.025); }
  .metric-grid strong, .metric-grid span { display:block; }
  .metric-grid strong { font-size:1.35rem; }
  .metric-grid span { color:var(--text-3); font-size:.68rem; margin-top:2px; }
  .quick-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .quick-row button { display:flex; align-items:center; gap:11px; padding:15px; border-radius:20px; text-align:left; background:var(--core); box-shadow:inset 0 0 0 1px var(--hairline); transition:transform .35s var(--spring); }
  .quick-row button:active { transform:scale(.98); }
  .quick-row button > span { flex:1; }
  .quick-row strong, .quick-row small { display:block; }
  .quick-row strong { font-size:.83rem; }
  .quick-row small { color:var(--text-3); font-size:.68rem; margin-top:3px; }
  .quick-row :global(svg:last-child) { transform:rotate(-90deg); color:var(--text-3); }
  @media (max-width:520px) { .today-grid { grid-template-columns:1fr; } .status-card { display:grid; grid-template-columns:auto 1fr; column-gap:13px; align-items:center; } .status-number { grid-row:1 / 3; } .status-rule { display:none; } .metric-grid { grid-template-columns:1fr 1fr; } .quick-row { grid-template-columns:1fr; } }
</style>
