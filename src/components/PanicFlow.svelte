<script>
  import { onMount, onDestroy } from 'svelte'
  import { TIPP, DENTS, BREATH_CYCLES, FAITH, THOUGHT_EXAMPLES } from '../lib/content.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import { addPanic } from '../lib/db.js'
  import { load, settings, data } from '../lib/store.svelte.js'
  import Icon from '../lib/Icon.svelte'

  let { onclose, ongoing } = $props()

  let phase = $state('surf') // surf | tipp | breathe | escape | neutralize | done
  let tippItem = $state(null)
  let cycle = $state(BREATH_CYCLES[0])
  let completed = $state(false)

  let faithVerse = $state(FAITH.verses[0])
  let faithDua = $state(FAITH.duas[0])

  let surfSeconds = $state(0)
  let urgePct = $state(100)
  const SURF_MIN = 8 // minutes the demo urge curve runs
  let raf = null
  let canvas = null
  let ctx = null

  // breathing state
  let stepLabel = $state('')
  let progressPct = $state(0)
  let cycleCounter = $state(0)
  let breatheTimer = null

  // TIPP timer state
  let tipSec = $state(0)
  let tipTotal = $state(0)
  let tipTimer = null

  function startSurf() {
    addPanic({ completed: false })
    phase = 'surf'
    surfSeconds = 0
    faithVerse = FAITH.verses[Math.floor(Math.random() * FAITH.verses.length)]
    faithDua = FAITH.duas[Math.floor(Math.random() * FAITH.duas.length)]
    if (!raf) {
      const start = Date.now()
      const tick = () => {
        surfSeconds = (Date.now() - start) / 1000
        urgePct = Math.round(urgeStrength() * 100)
        drawWave()
        if (surfSeconds >= SURF_MIN * 60) {
          urgePassed()
          return
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
  }

  function urgeStrength() {
    const t = surfSeconds / (SURF_MIN * 60)
    return Math.max(0, 1 - t) // linear decay
  }

  function drawWave() {
    if (!canvas || !ctx) return
    const W = canvas.width
    const H = canvas.height
    const strength = urgeStrength()
    ctx.clearRect(0, 0, W, H)

    // baseline
    const baseY = H - 30
    ctx.strokeStyle = 'rgba(94,234,212,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    ctx.lineTo(W, baseY)
    ctx.stroke()

    const amp = (H * 0.34) * (0.25 + strength * 0.75)
    const speed = 0.012

    // wave path
    ctx.strokeStyle = 'rgba(94,234,212,0.55)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let x = 0; x <= W; x += 4) {
      const y = baseY - (Math.sin(x * 0.022 + surfSeconds * speed) * amp + Math.sin(x * 0.05 + surfSeconds * 0.02) * amp * 0.4)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // fill below wave
    const grad = ctx.createLinearGradient(0, baseY - amp - 20, 0, baseY)
    grad.addColorStop(0, 'rgba(94,234,212,0.18)')
    grad.addColorStop(1, 'rgba(94,234,212,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    for (let x = 0; x <= W; x += 4) {
      const y = baseY - (Math.sin(x * 0.022 + surfSeconds * speed) * amp + Math.sin(x * 0.05 + surfSeconds * 0.02) * amp * 0.4)
      ctx.lineTo(x, y)
    }
    ctx.lineTo(W, baseY)
    ctx.closePath()
    ctx.fill()

    // surfer ball — rides near the crest
    const bx = (surfSeconds * speed * 100) % W
    const by = baseY - (Math.sin(bx * 0.022 + surfSeconds * speed) * amp + Math.sin(bx * 0.05 + surfSeconds * 0.02) * amp * 0.4) - 14
    ctx.beginPath()
    ctx.arc(bx, by, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#5eead4'
    ctx.shadowColor = 'rgba(94,234,212,0.7)'
    ctx.shadowBlur = 16
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(bx, by, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#04251f'
    ctx.fill()
  }

  function resizeCanvas() {
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
  }

  async function urgePassed() {
    cancelAnimationFrame(raf)
    raf = null
    completed = true
    phase = 'done'
    vibrate([60, 40, 60])
    addPanic({ completed: true })
    await load()
  }

  async function skipToDone() {
    cancelAnimationFrame(raf)
    raf = null
    completed = false
    phase = 'done'
  }

  // ————— breathing —————
  function openBreathe() {
    phase = 'breathe'
    cycle = BREATH_CYCLES[0]
    cycleCounter = 0
    runBreathStep('inhale')
  }

  function runBreathStep(kind) {
    const dur =
      kind === 'inhale' ? cycle.inhale
      : kind === 'hold' ? cycle.hold
      : kind === 'holdout' ? cycle.holdOut
      : cycle.exhale
    stepLabel = kind === 'inhale' ? 'Breathe in' : kind === 'exhale' ? 'Breathe out' : 'Hold'
    vibrate(kind === 'inhale' ? 40 : kind === 'exhale' ? 60 : 30)
    const started = Date.now()
    breatheTimer = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000
      progressPct = Math.min(100, (elapsed / dur) * 100)
      if (elapsed >= dur) {
        clearInterval(breatheTimer)
        breatheNext(kind)
      }
    }, 100)
  }

  function breatheNext(kind) {
    if (kind === 'inhale') runBreathStep(cycle.hold ? 'hold' : 'exhale')
    else if (kind === 'hold') runBreathStep(cycle.holdOut ? 'holdout' : 'exhale')
    else if (kind === 'holdout') runBreathStep('exhale')
    else {
      cycleCounter++
      if (cycleCounter >= cycle.cycles) backToSurf()
      else runBreathStep('inhale')
    }
  }

  function backToSurf() {
    clearInterval(breatheTimer)
    phase = 'surf'
  }

  // ————— generic TIPP timer —————
  function openTipp(item) {
    tippItem = item
    tipTotal = item.seconds
    tipSec = item.seconds
    phase = 'tipp'
    vibrate(50)
    const started = Date.now()
    tipTimer = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000
      tipSec = Math.max(0, tipTotal - Math.floor(elapsed))
      if (tipSec <= 0) {
        clearInterval(tipTimer)
        tipTimer = null
        vibrate([100, 50, 100])
      }
    }, 250)
  }

  function closeTipp() {
    clearInterval(tipTimer)
    tipTimer = null
    backToSurf()
  }

  // DENTS: each escape-the-loop option does something real in the moment
  function dentAction(d) {
    if (d.id === 'deny') {
      openTipp({
        id: 'delay',
        icon: 'clock',
        title: t(d.title),
        sub: t('10-minute delay'),
        action: t(d.text),
        seconds: 600
      })
    } else if (d.id === 'escape') {
      phase = 'escape'
    } else if (d.id === 'neutralize') {
      phase = 'neutralize'
    } else if (ongoing) {
      ongoing('activities')
    }
  }

  function close() {
    cancelAnimationFrame(raf)
    clearInterval(breatheTimer)
    clearInterval(tipTimer)
    onclose()
  }

  onMount(() => {
    startSurf()
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(breatheTimer)
      clearInterval(tipTimer)
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(raf)
    clearInterval(breatheTimer)
    clearInterval(tipTimer)
  })

  const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
</script>

<svelte:window onresize={resizeCanvas} />

<div class="overlay">
  {#if phase === 'surf'}
    <div class="surf-head">
      <div>
        <div class="faint" style="font-size:0.7rem; letter-spacing:0.16em; text-transform:uppercase; font-weight:700;">{t('Surf the urge')}</div>
        <h1 style="font-size:1.5rem;">{t('You are riding it out.')}</h1>
      </div>
      <button class="btn btn-soft btn-sm" onclick={close}><Icon name="x" size={16} /></button>
    </div>

    <div class="wave-stage">
      <span class="urge-label">{t('urge strength')}</span>
      <span class="urge-value">{urgePct}%</span>
      <canvas class="wave-canvas" bind:this={canvas}></canvas>
      <div class="surf-timer">
        <span class="muted" style="font-weight:700;">{mmss(surfSeconds)}</span>
        <span class="faint"> / {SURF_MIN}:00</span>
      </div>
    </div>

    <p class="faint" style="font-size:0.82rem; text-align:center; margin:-2px 6px 14px;">
      {t('Urges are waves: they rise, peak, and fall. You don\'t fight the wave — you stay on the board.')}
    </p>

    {#if settings.reasons}
      <div class="callout acc">
        <Icon name="star" size={20} />
        <div><strong>{t('Why you\'re doing this:')}</strong> "{settings.reasons}"</div>
      </div>
    {/if}

    {#if settings.crisis && (settings.crisis.topTriggers.length || settings.crisis.contact)}
      <div class="callout vio">
        <Icon name="shield" size={20} />
        <div>
          <strong>{t('Your plan:')}</strong>
          {#if settings.crisis.topAlternatives.length}
            {settings.crisis.topAlternatives.slice(0, 2).join(' · ')}
          {/if}
          {#if settings.crisis.contact}
            <span style="opacity:0.85;"> · {t('contact:')} {settings.crisis.contact}</span>
          {/if}
        </div>
      </div>
    {/if}

    {#if settings.faithMode}
      <div class="faith-card">
        <div class="row" style="justify-content:space-between;">
          <div class="faith-title">{t('Spiritual anchor')}</div>
          <span class="tag vio">{t('dua')} · {t(faithDua.title)}</span>
        </div>
        <p class="faith-arabic" dir="rtl" lang="ar">{faithDua.arabic}</p>
        <p class="faith-translit">{faithDua.translit}</p>
        <p class="faith-meaning">{t(faithDua.meaning)}</p>
        <div class="divider" style="margin:12px 0;"></div>
        <div class="row" style="justify-content:space-between;">
          <span class="tag acc">{faithVerse.ref}</span>
        </div>
        <p class="faith-arabic" dir="rtl" lang="ar" style="font-size:1.05rem;">{faithVerse.arabic}</p>
        <p class="faith-meaning">{t(faithVerse.meaning)}</p>
        <p class="faint" style="font-size:0.76rem; margin-top:10px;">{t(FAITH.prayerNote)}</p>
      </div>
    {/if}

    {#if data.cba && data.cba.consUse && data.cba.consUse.length}
      <div class="callout">
        <Icon name="chart" size={20} />
        <div>
          <strong>{t('What it costs you:')}</strong> {data.cba.consUse.slice(0, 3).join(' · ')}
        </div>
      </div>
    {/if}

    <div class="divider"></div>
    <div class="card-title"><span class="dot"></span>{t('Do one of these now')}</div>

    <div class="tipp-grid">
      {#each TIPP as tp (tp.id)}
        <button class="tipp-btn" onclick={() => openTipp(tp)}>
          <span class="tipp-ic"><Icon name={tp.icon} size={22} /></span>
          <span style="font-weight:700; font-size:0.9rem;">{t(tp.title)}</span>
          <span class="faint" style="font-size:0.74rem;">{t(tp.sub)}</span>
          <span class="tipp-time">{Math.round(tp.seconds / 60)} min</span>
        </button>
      {/each}
    </div>

    <div class="divider"></div>
    <div class="card-title"><span class="dot"></span>{t('Or escape the loop')}</div>
    <div class="dents">
      {#each DENTS as d (d.id)}
        <button class="dent-btn" onclick={() => dentAction(d)}>
          <Icon name={d.icon} size={18} />
          <span style="font-weight:700;">{t(d.title)}</span>
        </button>
      {/each}
    </div>

    <div class="row" style="justify-content: center; gap: 12px; margin-top: 18px;">
      <button class="btn btn-soft" onclick={openBreathe}><Icon name="wind" size={18} /> {t('Guided breathing')}</button>
      <button class="btn btn-primary" onclick={urgePassed}><Icon name="check" size={18} /> {t('It passed')}</button>
    </div>
  {:else if phase === 'breathe'}
    <div class="breathe-screen center">
      <button class="btn btn-soft btn-sm" style="position:absolute; top:16px; left:16px;" onclick={backToSurf}><Icon name="arrow" size={16} style="transform:rotate(180deg)" />{t('back')}</button>
      <div class="breath" style="transform: scale({stepLabel.startsWith('In') ? 1.3 : stepLabel.startsWith('Out') ? 0.82 : 1.1});">
        {t(stepLabel)}
        <span style="font-size:0.9rem; opacity:0.85;">{Math.max(0, Math.ceil(cycle.inhale * (1 - progressPct / 100)))}</span>
      </div>
      <div class="progress" style="max-width:240px; margin:16px auto;"><div style="width:{progressPct}%;"></div></div>
      <div class="faint">{t('Cycle')} {Math.min(cycleCounter + 1, cycle.cycles)} / {cycle.cycles} · {t('exhale longer than inhale')}</div>
    </div>
  {:else if phase === 'tipp' && tippItem}
    <div class="breathe-screen center">
      <div class="tipp-hero">
        <span class="tipp-ic" style="width:56px;height:56px;"><Icon name={tippItem.icon} size={26} /></span>
      </div>
      <h1 style="font-size:1.4rem; margin-top:10px;">{t(tippItem.title)}</h1>
      <p class="muted" style="font-size:0.9rem; max-width:320px; margin:8px auto 4px;">{t(tippItem.action)}</p>
      <div class="hero-num" style="font-size:3.4rem;">{mmss(tipSec)}</div>
      <div class="row" style="justify-content:center; gap:10px; margin-top:14px;">
        <button class="btn btn-soft" onclick={closeTipp}>{t('Done / skip')}</button>
      </div>
    </div>
  {:else if phase === 'escape'}
    <div class="breathe-screen center">
      <div class="big-glyph"><Icon name="mountain" size={30} /></div>
      <h1 style="font-size:1.7rem;">{t('Escape')}</h1>
      <p class="muted" style="margin:8px auto; max-width:340px;">
        {t(DENTS[1].text)}
      </p>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-lg btn-block" onclick={() => (phase = 'surf')}>
        <Icon name="wave" size={18} /> {t('Back to surfing')}
      </button>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={urgePassed}>
        <Icon name="check" size={16} /> {t('It passed')}
      </button>
    </div>
  {:else if phase === 'neutralize'}
    <div class="breathe-screen center">
      <div class="big-glyph"><Icon name="refresh" size={30} /></div>
      <h1 style="font-size:1.7rem;">{t('Neutralize')}</h1>
      <div class="callout" style="max-width:340px; margin:8px auto;">
        <Icon name="alert" size={18} />
        <div><em>"{t(THOUGHT_EXAMPLES[0])}"</em></div>
      </div>
      <p class="muted" style="margin:8px auto; max-width:340px;">
        {t(DENTS[2].text)}
      </p>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-lg btn-block" onclick={() => (phase = 'surf')}>
        <Icon name="wave" size={18} /> {t('Back to surfing')}
      </button>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={urgePassed}>
        <Icon name="check" size={16} /> {t('It passed')}
      </button>
    </div>
  {:else}
    <div class="breathe-screen center">
      <div class="big-glyph"><Icon name={completed ? 'wave' : 'leaf'} size={30} /></div>
      {#if completed}
        <h1 style="font-size:1.7rem;">{t('You rode it out.')}</h1>
        <p class="muted" style="margin:8px auto; max-width:340px;">
          {t('The wave peaked and you didn\'t feed it. That repetition is literally what rewires the reward circuit — each ride makes the next one easier.')}
        </p>
      {:else}
        <h1 style="font-size:1.7rem;">{t('Every wave ends.')}</h1>
        <p class="muted" style="margin:8px auto; max-width:340px;">
          {t('You chose to step out of the loop. That\'s a win to log, not a moment to judge.')}
        </p>
      {/if}
      <div class="spacer"></div>
      <button class="btn btn-primary btn-lg" onclick={close}><Icon name="check" size={18} />{t("I'm okay now")}</button>
    </div>
  {/if}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(40rem 26rem at 110% -10%, var(--vio-glow), transparent 60%),
      radial-gradient(34rem 26rem at -10% 12%, var(--acc-glow), transparent 60%),
      var(--bg);
    z-index: 100;
    overflow-y: auto;
    padding: calc(20px + var(--safe-top)) 18px calc(30px + var(--safe-bottom));
    animation: overlay-in 0.4s var(--spring) both;
  }
  @keyframes overlay-in {
    from { opacity: 0; transform: scale(1.04); }
    to { opacity: 1; transform: none; }
  }
  .surf-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .surf-timer {
    position: absolute;
    bottom: 8px;
    right: 14px;
    font-size: 0.85rem;
  }
  .tipp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .tipp-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 16px;
    border-radius: var(--r-sm);
    background: var(--core);
    border: 1px solid var(--hairline);
    box-shadow: var(--hairline-shadow);
    text-align: left;
    transition: transform 0.3s var(--spring), border-color 0.25s;
  }
  .tipp-btn:active { transform: scale(0.96); }
  .tipp-ic {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(94,234,212,0.14), rgba(94,234,212,0.03));
    border: 1px solid rgba(94,234,212,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .tipp-ic :global(svg) { stroke: var(--acc); }
  .tipp-time {
    margin-top: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-3);
  }
  .dents {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .dent-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border-radius: var(--r-sm);
    background: var(--core-2);
    border: 1px solid var(--hairline);
    color: var(--text-2);
    font-size: 0.9rem;
    transition: transform 0.3s var(--spring);
  }
  .dent-btn:active { transform: scale(0.96); }
  .dent-btn :global(svg) { stroke: var(--acc); flex-shrink: 0; }
  .breathe-screen {
    min-height: calc(100vh - 60px);
    min-height: calc(100dvh - 60px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .faith-card {
    background: linear-gradient(160deg, rgba(167,139,250,0.08), rgba(167,139,250,0.02));
    border: 1px solid rgba(167,139,250,0.22);
    border-radius: var(--r-sm);
    padding: 16px;
    margin-bottom: 12px;
  }
  .faith-title {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--vio);
  }
  .faith-arabic {
    font-size: 1.25rem;
    line-height: 1.9;
    margin: 12px 0 6px;
    color: var(--text);
  }
  .faith-translit {
    font-size: 0.84rem;
    color: var(--text-2);
    font-style: italic;
  }
  .faith-meaning {
    font-size: 0.9rem;
    color: var(--text-2);
    margin-top: 4px;
  }
</style>
