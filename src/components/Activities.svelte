<script>
  import { onDestroy } from 'svelte'
  import { ACTIVITIES, GUIDED_EXERCISES } from '../lib/content.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'
  import GuidedExercises from './GuidedExercises.svelte'

  let { go } = $props()

  let activeCat = $state(null)
  let activeGuided = $state(null)
  let remaining = $state(0)
  let timerTotal = $state(0)
  let ticking = null

  function startTimer(seconds) {
    if (ticking) clearInterval(ticking)
    timerTotal = seconds
    remaining = seconds
    vibrate(50)
    ticking = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(ticking)
        ticking = null
        vibrate([100, 50, 100])
      }
    }, 1000)
  }

  function stopTimer() {
    if (ticking) clearInterval(ticking)
    ticking = null
    remaining = 0
    timerTotal = 0
  }

  onDestroy(() => {
    if (ticking) clearInterval(ticking)
  })

  const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
  const timerPct = $derived(timerTotal ? (1 - remaining / timerTotal) * 100 : 0)
</script>

<div class="screen">
  <ScreenHeader eyebrow={t('Behavioral activation')} title={t('Meet the need another way.')} {go} back="home" />

  <div class="shell">
    <div class="core">
      <p class="body">
        {t('The behavior may have been doing a job — escape, stimulation, soothing or connection.')}
        {t('Pick an alternative that serves the same need, then check whether it actually helped.')}
      </p>
    </div>
  </div>

  <section class="guided-block">
    <div class="guided-heading">
      <div><span class="eyebrow on">{t('Guided actions')}</span><h2>{t('Do it with the app.')}</h2></div>
      <span class="faint">{t('Tap · move · notice')}</span>
    </div>
    <div class="guided-grid">
      {#each GUIDED_EXERCISES as item, index (item.id)}
        <button class="guided-card tone-{item.tone}" onclick={() => (activeGuided = item.id)}>
          <span class="guide-visual visual-{index}">
            <i></i><i></i><i></i>
            <Icon name={item.icon} size={22} />
          </span>
          <span class="guide-copy"><strong>{t(item.title)}</strong><small>{t(item.sub)}</small></span>
          <span class="guide-meta">{item.duration}<Icon name="arrow" size={13} /></span>
        </button>
      {/each}
    </div>
  </section>

  <div class="section-rule"><span>{t('Replacement menu')}</span></div>

  {#if timerTotal > 0}
    <div class="shell" style="border-color: rgba(94,234,212,0.3);">
      <div class="core center">
        <div class="hero-num" style="font-size:2.8rem; color:var(--text); -webkit-text-fill-color: var(--text);">{mmss(remaining)}</div>
        <div class="faint" style="font-size:0.82rem; margin-top:4px;">{t('Stay with the chosen activity, then re-rate what you need.')}</div>
        <div class="progress" style="margin:12px 0;"><div style="width:{timerPct}%;"></div></div>
        <button class="btn btn-soft btn-sm" onclick={stopTimer}><Icon name="x" size={15} /> {t('Stop')}</button>
      </div>
    </div>
  {/if}

  <div class="cat-grid">
    {#each ACTIVITIES as a (a.mood)}
      <button class="cat-btn" class:selected={activeCat === a.mood} onclick={() => (activeCat = activeCat === a.mood ? null : a.mood)}>
        <span class="cat-ic"><Icon name={a.icon} size={22} /></span>
        <span style="font-weight:700; font-size:0.92rem;">{t(a.label)}</span>
        <span class="faint" style="font-size:0.72rem;">{t(a.sub)}</span>
      </button>
    {/each}
  </div>

  {#if activeCat}
    {@const group = ACTIVITIES.find((a) => a.mood === activeCat)}
    <div class="shell" style="border-color: rgba(94,234,212,0.2);">
      <div class="core">
        <div class="card-title"><span class="dot"></span>{t(group.sub)}</div>
        {#each group.items as item (item.name)}
          <div class="list-item">
            <span style="font-weight:600;">{t(item.name)}</span>
            <button class="btn btn-soft btn-sm" onclick={() => startTimer(item.seconds)}>
              <Icon name="clock" size={14} />
              {Math.round(item.seconds / 60)} min
            </button>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="shell flat">
      <div class="core center faint">
        <Icon name="target" size={22} style="margin: 0 auto 8px;" />
        <p>{t('Pick the function you need right now.')}</p>
      </div>
    </div>
  {/if}

  <div class="callout vio" style="margin-top:14px;">
    <Icon name="dumbbell" size={20} />
    <div><strong>{t('Practical experiment:')}</strong> {t('Try 20–30 minutes of movement before a commonly difficult time and see whether it changes your own pattern.')}</div>
  </div>
</div>

{#if activeGuided}
  <GuidedExercises initialId={activeGuided} onclose={() => (activeGuided = null)} oncomplete={() => {}} />
{/if}

<style>
  .guided-block { margin-bottom:22px; }
  .guided-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin:22px 4px 13px; }
  .guided-heading h2 { margin-top:8px; font-size:1.35rem; }
  .guided-heading > .faint { font-size:.68rem; text-transform:uppercase; letter-spacing:.12em; padding-bottom:3px; }
  .guided-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .guided-card { --tone:var(--acc); --tone-glow:rgba(94,234,212,.16); position:relative; min-height:174px; padding:15px; display:flex; flex-direction:column; align-items:flex-start; overflow:hidden; text-align:left; border-radius:24px; background:radial-gradient(14rem 10rem at 95% 0,var(--tone-glow),transparent 60%),var(--core); box-shadow:inset 0 0 0 1px var(--hairline),var(--hairline-shadow); transition:transform .55s var(--spring),box-shadow .55s var(--spring); }
  .guided-card:nth-child(3),.guided-card:nth-child(6) { grid-column:span 2; min-height:144px; display:grid; grid-template-columns:68px 1fr auto; align-items:center; gap:12px; }
  .guided-card:active { transform:scale(.975); }
  .guided-card.tone-violet { --tone:var(--vio); --tone-glow:rgba(167,139,250,.17); }.guided-card.tone-sky { --tone:var(--sky); --tone-glow:rgba(125,211,252,.15); }.guided-card.tone-rose { --tone:#fda4af; --tone-glow:rgba(251,113,133,.15); }.guided-card.tone-amber { --tone:var(--warn); --tone-glow:rgba(251,191,36,.14); }
  .guide-visual { position:relative; width:58px; height:58px; display:grid; place-items:center; margin-bottom:18px; border-radius:19px; color:var(--tone); background:rgba(255,255,255,.035); box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tone) 24%,transparent); }
  .guide-visual i { position:absolute; inset:8px; border-radius:50%; box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tone) 20%,transparent); animation:preview-breathe 3.4s var(--spring) infinite alternate; }
  .guide-visual i:nth-child(2){inset:14px;animation-delay:-1.2s}.guide-visual i:nth-child(3){inset:20px;animation-delay:-2.2s}
  .guide-visual :global(svg) { position:relative; z-index:1; }
  .visual-3 i { border-radius:4px; transform-origin:left; animation:preview-door 3s var(--spring) infinite alternate; }.visual-4 :global(svg){animation:preview-compass 5s cubic-bezier(.45,.05,.55,.95) infinite}.visual-6 i{animation:preview-time 4s var(--spring) infinite alternate}
  .guide-copy { flex:1; }.guide-copy strong,.guide-copy small { display:block; }.guide-copy strong { font-size:.91rem; }.guide-copy small { margin-top:4px; color:var(--text-3); font-size:.7rem; line-height:1.4; }
  .guide-meta { width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:14px; color:var(--tone); font-size:.64rem; font-weight:750; letter-spacing:.04em; }
  .guided-card:nth-child(3) .guide-visual,.guided-card:nth-child(6) .guide-visual { margin:0; }.guided-card:nth-child(3) .guide-meta,.guided-card:nth-child(6) .guide-meta { width:auto; gap:8px; margin:0; }
  .section-rule { display:flex; align-items:center; gap:12px; margin:24px 3px 14px; color:var(--text-3); font-size:.67rem; font-weight:750; letter-spacing:.15em; text-transform:uppercase; }.section-rule::before,.section-rule::after{content:'';height:1px;flex:1;background:var(--hairline)}
  .cat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .cat-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 16px;
    border-radius: var(--r-sm);
    background: var(--core);
    border: 1px solid var(--hairline);
    box-shadow: var(--hairline-shadow);
    text-align: left;
    transition: transform 0.3s var(--spring), border-color 0.25s, background 0.25s;
  }
  .cat-btn:active { transform: scale(0.96); }
  .cat-btn.selected {
    border-color: rgba(94,234,212,0.4);
    background: linear-gradient(180deg, rgba(94,234,212,0.1), rgba(94,234,212,0.03));
  }
  .cat-ic {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: linear-gradient(160deg, rgba(94,234,212,0.14), rgba(94,234,212,0.03));
    border: 1px solid rgba(94,234,212,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .cat-ic :global(svg) { stroke: var(--acc); }
  @keyframes preview-breathe { from{transform:scale(.78);opacity:.35} to{transform:scale(1.12);opacity:1} }
  @keyframes preview-door { from{transform:rotateY(0);opacity:.35} to{transform:rotateY(-65deg);opacity:1} }
  @keyframes preview-compass { from{transform:rotate(-12deg)} to{transform:rotate(348deg)} }
  @keyframes preview-time { from{transform:scale(.7);opacity:.3} to{transform:scale(1.08);opacity:.9} }
  @media (max-width:420px) { .guided-card:nth-child(3),.guided-card:nth-child(6){grid-template-columns:58px 1fr}.guided-card:nth-child(3) .guide-meta,.guided-card:nth-child(6) .guide-meta{display:none} }
  @media (prefers-reduced-motion:reduce) { .guide-visual i,.guide-visual :global(svg){animation:none!important} }
</style>
