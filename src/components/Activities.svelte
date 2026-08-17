<script>
  import { onDestroy } from 'svelte'
  import { ACTIVITIES } from '../lib/content.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go } = $props()

  let activeCat = $state(null)
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
  const timerPct = timerTotal ? (1 - remaining / timerTotal) * 100 : 0
</script>

<div class="screen">
  <ScreenHeader eyebrow={t('Legal dopamine')} title={t('Pick your replacement.')} {go} back="home" />

  <div class="shell">
    <div class="core">
      <p class="body">
        {t('Porn was doing a job — escape, stimulation, numbing. You can\'t remove the behavior without replacing its function.')}
        {t('These are grouped by the function they serve. Boredom, novelty craving, and emotional states each have a different substitute.')}
      </p>
    </div>
  </div>

  {#if timerTotal > 0}
    <div class="shell" style="border-color: rgba(94,234,212,0.3);">
      <div class="core center">
        <div class="hero-num" style="font-size:2.8rem; color:var(--text); -webkit-text-fill-color: var(--text);">{mmss(remaining)}</div>
        <div class="faint" style="font-size:0.82rem; margin-top:4px;">{t('Ride the 10-minute wave. It peaks and fades.')}</div>
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
    <div><strong>{t('Research lever:')}</strong> {t('20–30 min of exercise before your peak trigger window changes the chemistry of the hour. Schedule it like an appointment.')}</div>
  </div>
</div>

<style>
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
</style>
