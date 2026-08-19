<script>
  import { MOODS, ESCALATION, SELF_COMPASSION, DAILY_LEVERS } from '../lib/content.js'
  import { addCheckin, addSlip, setDaily } from '../lib/db.js'
  import { load, data } from '../lib/store.svelte.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go, onpanic } = $props()

  let urge = $state(2)
  let mood = $state(null)
  let sleep = $state(false)
  let exercise = $state(false)

  let showSlip = $state(false)
  let slipUrge = $state(8)
  let slipMood = $state(null)
  let slipNote = $state('')
  let slipEsc = $state([])
  let slipSleepBad = $state(false)
  let saved = $state(false)
  let compassionIdx = $state(0)

  function pickMood(id) {
    mood = mood === id ? null : id
  }
  function pickSlipMood(id) {
    slipMood = slipMood === id ? null : id
  }
  function toggleEsc(id) {
    if (slipEsc.includes(id)) slipEsc = slipEsc.filter((e) => e !== id)
    else slipEsc = [...slipEsc, id]
  }

  async function save() {
    await addCheckin({ urge, mood })
    if (showSlip) {
      await addSlip({ urge: slipUrge, mood: slipMood, note: slipNote.trim(), escalation: [...slipEsc], sleepBad: slipSleepBad })
    }
    const today = new Date().toISOString().slice(0, 10)
    await setDaily(today, { sleep, exercise })
    await load()
    saved = true
    vibrate(50)
    if (showSlip) {
      compassionIdx = Math.floor(Math.random() * SELF_COMPASSION.length)
    }
    setTimeout(() => {
      saved = false
      urge = 2
      mood = null
      sleep = false
      exercise = false
      showSlip = false
      slipUrge = 8
      slipMood = null
      slipNote = ''
      slipEsc = []
      slipSleepBad = false
    }, 4000)
  }
</script>

<div class="screen">
  <ScreenHeader eyebrow={t('10 seconds')} title={t('Name the urge.')} {go} />

  <div class="shell">
  <div class="core">
    <div class="card-title"><span class="dot"></span>1 · {t('Rate the urge')}</div>
    <div class="slider-row">
      <span class="val">{urge}</span>
      <input
        type="range" min="0" max="10" step="1" bind:value={urge}
        style="--fill: {urge * 10}%;"
      />
    </div>
    <div class="row" style="justify-content:space-between;">
      <span class="faint" style="font-size:0.76rem;">{t('flat')}</span>
      <span class="faint" style="font-size:0.76rem;">{t('peaking')}</span>
    </div>
  </div>
</div>

<div class="shell">
  <div class="core">
    <div class="card-title"><span class="dot"></span>2 · {t('What\'s underneath?')} <span class="faint" style="text-transform:none; letter-spacing:0;">(HALT+)</span></div>
    <div class="mood-grid">
      {#each MOODS as m (m.id)}
        <button class="mood-btn" class:selected={mood === m.id} onclick={() => pickMood(m.id)}>
          <span class="m-ic"><Icon name={m.icon} size={26} /></span>
          {t(m.label)}
        </button>
      {/each}
    </div>
    <p class="faint" style="font-size:0.8rem; margin-top:12px;">
      {t('Bored, lonely, stressed — naming the state interrupts the automatic loop. Negative mood + craving intensity are the two strongest slip predictors.')}
    </p>
  </div>
</div>

<div class="shell">
  <div class="core">
    <div class="card-title"><span class="dot"></span>3 · {t('The two levers today')}</div>
    <div class="list-item">
      <div class="row">
        <span class="tipp-ic"><Icon name="moon" size={18} /></span>
        <div>
          <div class="l-label">{t('Slept 7+ hours')}</div>
          <div class="l-sub">{t('sleep debt raises dopamine hunger')}</div>
        </div>
      </div>
      <label class="toggle"><input type="checkbox" checked={sleep} onchange={() => (sleep = !sleep)} /><span class="track"></span></label>
    </div>
    <div class="list-item">
      <div class="row">
        <span class="tipp-ic"><Icon name="dumbbell" size={18} /></span>
        <div>
          <div class="l-label">{t('Moved 20+ minutes')}</div>
          <div class="l-sub">{t('the legal dopamine hit')}</div>
        </div>
      </div>
      <label class="toggle"><input type="checkbox" checked={exercise} onchange={() => (exercise = !exercise)} /><span class="track"></span></label>
    </div>
  </div>
</div>

{#if urge >= 6}
  <div class="callout">
    <Icon name="alert" size={20} />
    <div><strong>{t('Strong urge.')}</strong> {t('Don\'t fight it — ride it. Start a 10-minute timer with a replacement activity, or hit the panic button.')}</div>
  </div>
  <button class="btn btn-urgent btn-block btn-lg" style="margin-bottom:14px;" onclick={() => onpanic()}>
    <Icon name="wave" size={20} /> {t('I need help now')}
  </button>
{/if}

{#if !showSlip}
  <button class="btn btn-soft btn-block" onclick={() => (showSlip = true)}><Icon name="drop" size={16} /> {t('I slipped — log it as data')}</button>
{:else}
  <div class="shell" style="border-color: rgba(251,113,133,0.25);">
    <div class="core">
      <div class="card-title" style="color: var(--danger);"><span class="dot" style="background:var(--danger); box-shadow:0 0 10px rgba(251,113,133,0.4);"></span>{t('Log the slip — no shame, it\'s data')}</div>
      <div class="slider-row">
        <span class="val">{slipUrge}</span>
        <input type="range" min="0" max="10" step="1" bind:value={slipUrge} style="--fill: {slipUrge * 10}%;" />
      </div>
      <div class="label">{t('Feeling at the time')}</div>
      <div class="mood-grid" style="margin-bottom:14px;">
        {#each MOODS as m (m.id)}
          <button class="mood-btn" class:selected={slipMood === m.id} onclick={() => pickSlipMood(m.id)}>
            <span class="m-ic"><Icon name={m.icon} size={26} /></span>
            {t(m.label)}
          </button>
        {/each}
      </div>
      <div class="label">{t('Did escalation creep in?')} <span class="faint" style="text-transform:none;">{t('(the 5 documented mechanisms)')}</span></div>
      <div class="pill-grid" style="margin-bottom:14px;">
        {#each ESCALATION as e (e.id)}
          <button class="choice-pill" class:selected={slipEsc.includes(e.id)} onclick={() => toggleEsc(e.id)}>{t(e.label)}</button>
        {/each}
      </div>
      <div class="list-item" style="padding-top:0;">
        <div>
          <div class="l-label">{t('Poor sleep before this?')}</div>
          <div class="l-sub">{t('a documented amplifier of the inhibition gap')}</div>
        </div>
        <label class="toggle"><input type="checkbox" checked={slipSleepBad} onchange={() => (slipSleepBad = !slipSleepBad)} /><span class="track"></span></label>
      </div>
      <div class="label" style="margin-top:10px;">{t('One line on what happened')}</div>
      <textarea class="field" bind:value={slipNote} placeholder={t('What triggered it? (optional)')}></textarea>
    </div>
  </div>
{/if}

<div class="spacer"></div>

{#if saved}
  <div class="shell flat">
    <div class="core center">
      {#if compassionIdx >= 0 && showSlip}
        <div class="big-glyph" style="margin-bottom:14px;"><Icon name="heart" size={30} /></div>
        <p style="font-weight:600; font-size:1.02rem; line-height:1.5;">{t(SELF_COMPASSION[compassionIdx])}</p>
        <p class="faint" style="font-size:0.82rem; margin-top:10px;">{t('Logged ✓ — nothing reset, nothing judged.')}</p>
      {:else}
        <div class="big-glyph" style="margin-bottom:14px;"><Icon name="check" size={30} /></div>
        <p style="font-weight:600;">{t('Logged ✓')}</p>
        <p class="faint" style="font-size:0.82rem; margin-top:6px;">{t('Patterns update instantly.')}</p>
      {/if}
    </div>
  </div>
{:else}
  <button class="btn btn-primary btn-block btn-lg" onclick={save}><Icon name="check" size={18} /> {t('Save check-in')}</button>
{/if}

</div>

<style>
  .label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin: 4px 0 8px;
  }
  .tipp-ic {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: linear-gradient(160deg, rgba(94,234,212,0.12), rgba(94,234,212,0.03));
    border: 1px solid rgba(94,234,212,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tipp-ic :global(svg) { stroke: var(--acc); }
</style>
