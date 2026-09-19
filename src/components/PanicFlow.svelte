<script>
  import { onMount, onDestroy } from 'svelte'
  import { TIPP, DENTS, BREATH_CYCLES, FAITH, THOUGHT_EXAMPLES } from '../lib/content.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import { addPanic, updatePanic } from '../lib/db.js'
  import { load, settings, data } from '../lib/store.svelte.js'
  import { copingInsights } from '../lib/insights.js'
  import Icon from '../lib/Icon.svelte'
  import BreathingOrb from './BreathingOrb.svelte'
  import GuidedExercises from './GuidedExercises.svelte'

  let { onclose, ongoing, mode = 'guided' } = $props()

  let phase = $state('check') // check | surf | tipp | breathe | escape | neutralize | rerate | done
  let tippItem = $state(null)
  let cycle = $state(BREATH_CYCLES[0])
  let completed = $state(false)
  let startUrge = $state(7)
  let currentUrge = $state(7)
  let panicId = null
  let sessionStarted = null
  let actions = $state([])
  let activeExercise = $state(null)
  let quickRemaining = $state(60)
  let quickMoved = $state(false)
  let quickTicker = null

  let faithVerse = $state(FAITH.verses[0])
  let faithDua = $state(FAITH.duas[0])

  let surfSeconds = $state(0)
  let urgePct = $state(70)
  let raf = null
  let canvas = $state(null)
  let ctx = null

  // breathing state
  let stepLabel = $state('')
  let stepDuration = $state(0)
  let breathKind = $state('inhale')
  let progressPct = $state(0)
  let cycleCounter = $state(0)
  let breatheTimer = null

  // TIPP timer state
  let tipSec = $state(0)
  let tipTotal = $state(0)
  let tipTimer = null
  const coping = $derived(copingInsights(data.panics))
  const quickRecommendation = $derived(coping.best || null)

  const guidedForAction = {
    relax: 'muscle-release',
    'muscle-release': 'muscle-release',
    delay: 'delayed-choice',
    'delayed-choice': 'delayed-choice',
    escape: 'leave-room',
    'leave-room': 'leave-room',
    'location-shift': 'location-shift',
    neutralize: 'mindful-observe',
    'mindful-observe': 'mindful-observe',
    'five-senses': 'five-senses',
    'values-choice': 'values-choice'
  }

  async function startQuick() {
    phase = 'quick'
    sessionStarted = Date.now()
    startUrge = 7
    currentUrge = 7
    actions = ['paced-breathing']
    panicId = await addPanic({ completed: false, startUrge, actions: [...actions] })
    quickRemaining = 60
    quickMoved = false
    runQuickBreath('inhale')
    const started = Date.now()
    quickTicker = setInterval(() => {
      quickRemaining = Math.max(0, 60 - Math.floor((Date.now() - started) / 1000))
      if (quickRemaining <= 0) {
        clearInterval(quickTicker)
        quickTicker = null
        vibrate([70, 40, 70])
      }
    }, 200)
  }

  function runQuickBreath(kind) {
    clearInterval(breatheTimer)
    const dur = kind === 'inhale' ? 4 : 6
    stepDuration = dur
    breathKind = kind
    stepLabel = kind === 'inhale' ? 'Breathe in' : 'Breathe out'
    vibrate(kind === 'inhale' ? 35 : 55)
    const started = Date.now()
    breatheTimer = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000
      progressPct = Math.min(100, (elapsed / dur) * 100)
      if (elapsed >= dur) {
        clearInterval(breatheTimer)
        breatheTimer = null
        if (phase === 'quick') runQuickBreath(kind === 'inhale' ? 'exhale' : 'inhale')
      }
    }, 100)
  }

  function quickToToolkit() {
    clearInterval(quickTicker)
    clearInterval(breatheTimer)
    quickTicker = null
    breatheTimer = null
    phase = 'surf'
    requestAnimationFrame(resizeCanvas)
  }

  function confirmQuickMove() {
    quickMoved = !quickMoved
    if (quickMoved) recordAction('leave-room')
    vibrate(quickMoved ? [25, 25, 45] : 20)
  }

  function openExercise(id) {
    recordAction(id)
    activeExercise = id
  }

  function useRecommendation() {
    const id = quickRecommendation?.id
    if (!id || id === 'paced-breathing' || id === 'breath') return
    const guided = guidedForAction[id]
    if (guided) openExercise(guided)
    else recordAction(id)
  }

  async function startSurf() {
    startUrge = Number(startUrge)
    currentUrge = startUrge
    urgePct = currentUrge * 10
    sessionStarted = Date.now()
    panicId = await addPanic({ completed: false, startUrge, actions: [] })
    phase = 'surf'
    surfSeconds = 0
    requestAnimationFrame(resizeCanvas)
    faithVerse = FAITH.verses[Math.floor(Math.random() * FAITH.verses.length)]
    faithDua = FAITH.duas[Math.floor(Math.random() * FAITH.duas.length)]
    if (!raf) {
      const start = Date.now()
      const tick = () => {
        surfSeconds = (Date.now() - start) / 1000
        urgePct = currentUrge * 10
        drawWave()
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
  }

  function urgeStrength() {
    return Math.max(0.08, currentUrge / 10)
  }

  function drawWave() {
    if (!canvas || !ctx) return
    const W = canvas.clientWidth
    const H = canvas.clientHeight
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

  function urgePassed() {
    cancelAnimationFrame(raf)
    raf = null
    clearInterval(quickTicker)
    clearInterval(breatheTimer)
    quickTicker = null
    breatheTimer = null
    phase = 'rerate'
  }

  async function finishSession() {
    cancelAnimationFrame(raf)
    raf = null
    currentUrge = Number(currentUrge)
    completed = true
    await updatePanic(panicId, {
      completed,
      endUrge: currentUrge,
      actions: [...actions],
      durationSec: sessionStarted ? Math.round((Date.now() - sessionStarted) / 1000) : 0
    })
    vibrate([60, 40, 60])
    await load()
    phase = 'done'
  }

  function recordAction(action) {
    if (!actions.includes(action)) actions = [...actions, action]
  }

  // ————— breathing —————
  function openBreathe() {
    recordAction('paced-breathing')
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
    stepDuration = dur
    breathKind = kind
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
    requestAnimationFrame(resizeCanvas)
  }

  // ————— generic TIPP timer —————
  function openTipp(item) {
    if (item.id === 'relax') {
      openExercise('muscle-release')
      return
    }
    recordAction(item.id)
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
    recordAction(d.id)
    if (d.id === 'deny') {
      openExercise('delayed-choice')
    } else if (d.id === 'escape') {
      openExercise('leave-room')
    } else if (d.id === 'neutralize') {
      phase = 'neutralize'
    } else if (ongoing) {
      ongoing('activities')
    }
  }

  async function close() {
    cancelAnimationFrame(raf)
    clearInterval(breatheTimer)
    clearInterval(tipTimer)
    clearInterval(quickTicker)
    if (panicId && phase !== 'done') {
      await updatePanic(panicId, {
        completed: false,
        endUrge: currentUrge,
        actions: [...actions],
        durationSec: sessionStarted ? Math.round((Date.now() - sessionStarted) / 1000) : 0
      })
    }
    onclose()
  }

  onMount(() => {
    requestAnimationFrame(resizeCanvas)
    if (mode === 'quick') startQuick()
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(breatheTimer)
      clearInterval(tipTimer)
      clearInterval(quickTicker)
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(raf)
    clearInterval(breatheTimer)
    clearInterval(tipTimer)
    clearInterval(quickTicker)
  })

  const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
</script>

<svelte:window onresize={resizeCanvas} />

<div class="overlay">
  {#if phase === 'check'}
    <div class="breathe-screen center check-screen">
      <button class="btn btn-soft btn-sm close-top" onclick={close}><Icon name="x" size={16} /></button>
      <span class="eyebrow on">{t('Start with what is true')}</span>
      <div class="big-glyph"><Icon name="wave" size={30} /></div>
      <h1>{t('How strong is the urge right now?')}</h1>
      <p class="muted">{t('Your rating—not a scripted curve—will show whether the next action helped.')}</p>
      <div class="urge-readout">{startUrge}<span>/10</span></div>
      <input class="urge-slider" type="range" min="0" max="10" step="1" bind:value={startUrge} style="--fill:{startUrge * 10}%;" aria-label={t('Urge intensity')} />
      <button class="btn btn-primary btn-lg btn-block" onclick={startSurf}>
        {t('Choose a coping action')} <span class="arrow"><Icon name="arrow" size={16} /></span>
      </button>
      <p class="faint evidence-caption">{t('This flow supports coping. If you may hurt yourself or someone else, contact local emergency services or a crisis line now.')}</p>
    </div>
  {:else if phase === 'quick'}
    <div class="quick-screen">
      <header class="quick-head">
        <div><span class="eyebrow on">{t('Immediate support')}</span><h1>{t('Stay with this minute.')}</h1></div>
        <button class="btn btn-soft btn-sm" onclick={close} aria-label={t('Close')}><Icon name="x" size={16} /></button>
      </header>

      <div class="quick-stage-shell">
        <div class="quick-stage-core">
          <BreathingOrb phase={breathKind} label={t(stepLabel || 'Breathe in')} progress={progressPct} seconds={Math.max(0, Math.ceil(stepDuration * (1 - progressPct / 100)))} />
          <div class="quick-time">
            <span class="quick-pulse"></span>
            <div><strong>{mmss(quickRemaining)}</strong><small>{t('decision delayed')}</small></div>
          </div>
        </div>
      </div>

      <div class="quick-instruction">
        <span class="instruction-num">01</span>
        <div><strong>{t('Put the triggering screen down.')}</strong><small>{t('Keep this guide visible only if it helps you move.')}</small></div>
      </div>
      <button class="quick-action" class:done={quickMoved} onclick={confirmQuickMove}>
        <span><Icon name={quickMoved ? 'check' : 'door'} size={21} /></span>
        <div><strong>{quickMoved ? t('Location changed') : t('Stand up and leave this room')}</strong><small>{quickMoved ? t('Physical distance added') : t('Tap after your feet cross the doorway')}</small></div>
        <Icon name="arrow" size={16} />
      </button>

      <div class="quick-grid">
        <button class="quick-card" onclick={useRecommendation}>
          <span class="micro">{quickRecommendation ? t('Your strongest signal') : t('Suggested next')}</span>
          <strong>{quickRecommendation?.short || t('Use five-senses grounding')}</strong>
          <small>{quickRecommendation ? `${quickRecommendation.avgDrop.toFixed(1)} ${t('point average change')} · ${quickRecommendation.samples}×` : t('No history needed')}</small>
        </button>
        {#if settings.crisis?.contact}
          <div class="quick-card contact-card">
            <span class="micro">{t('Trusted contact')}</span>
            <strong>{settings.crisis.contact}</strong>
            <small>{t('Reach out before deciding')}</small>
          </div>
        {:else}
          <button class="quick-card" onclick={() => openExercise('five-senses')}>
            <span class="micro">{t('Ground')}</span><strong>{t('5 · 4 · 3 · 2 · 1')}</strong><small>{t('Use all five senses')}</small>
          </button>
        {/if}
      </div>

      <div class="quick-rating">
        <div><span>{t('Starting estimate')}</span><strong>{startUrge}/10</strong></div>
        <input class="urge-slider" type="range" min="0" max="10" step="1" bind:value={startUrge} style="--fill:{startUrge * 10}%;" aria-label={t('Starting urge estimate')} />
      </div>

      <div class="quick-actions-row">
        <button class="btn btn-soft" onclick={quickToToolkit}><Icon name="sliders" size={17} /> {t('Full toolkit')}</button>
        <button class="btn btn-primary" onclick={urgePassed}>{t('Check the urge')} <span class="arrow"><Icon name="arrow" size={15} /></span></button>
      </div>
    </div>
  {:else if phase === 'surf'}
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
        <span class="faint"> {t('elapsed')}</span>
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

    <div class="row" style="justify-content: center; gap: 12px; margin-top: 18px; flex-wrap:wrap;">
      <button class="btn btn-soft" onclick={() => openExercise('five-senses')}><Icon name="target" size={18} /> {t('Guided grounding')}</button>
      <button class="btn btn-soft" onclick={openBreathe}><Icon name="wind" size={18} /> {t('Guided breathing')}</button>
      <button class="btn btn-primary" onclick={urgePassed}><Icon name="check" size={18} /> {t('Check the urge again')}</button>
    </div>
  {:else if phase === 'breathe'}
    <div class="breathe-screen center">
      <button class="btn btn-soft btn-sm" style="position:absolute; top:16px; left:16px;" onclick={backToSurf}><Icon name="arrow" size={16} style="transform:rotate(180deg)" />{t('back')}</button>
      <BreathingOrb phase={breathKind} label={t(stepLabel)} progress={progressPct} seconds={Math.max(0, Math.ceil(stepDuration * (1 - progressPct / 100)))} />
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
      <button class="btn btn-primary btn-lg btn-block" onclick={backToSurf}>
        <Icon name="wave" size={18} /> {t('Back to surfing')}
      </button>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={urgePassed}>
        <Icon name="check" size={16} /> {t('Check the urge again')}
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
      <button class="btn btn-primary btn-lg btn-block" onclick={backToSurf}>
        <Icon name="wave" size={18} /> {t('Back to surfing')}
      </button>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={urgePassed}>
        <Icon name="check" size={16} /> {t('Check the urge again')}
      </button>
    </div>
  {:else if phase === 'rerate'}
    <div class="breathe-screen center check-screen">
      <span class="eyebrow on">{t('Notice, don’t grade')}</span>
      <div class="big-glyph"><Icon name="activity" size={30} /></div>
      <h1>{t('How strong is it now?')}</h1>
      <p class="muted">{t('No result is a failure. If it stayed high, choose a different action or contact support.')}</p>
      <div class="urge-compare"><span>{startUrge}<small>{t('before')}</small></span><Icon name="arrow" size={22} /><span class:lower={currentUrge < startUrge}>{currentUrge}<small>{t('now')}</small></span></div>
      <input class="urge-slider" type="range" min="0" max="10" step="1" bind:value={currentUrge} style="--fill:{currentUrge * 10}%;" aria-label={t('Current urge intensity')} />
      <button class="btn btn-primary btn-lg btn-block" onclick={finishSession}>{t('Save this session')}</button>
      <button class="btn btn-soft btn-block" onclick={backToSurf}>{t('Choose another action')}</button>
    </div>
  {:else}
    <div class="breathe-screen center">
      <div class="big-glyph"><Icon name={completed ? 'wave' : 'leaf'} size={30} /></div>
      {#if currentUrge < startUrge}
        <h1 style="font-size:1.7rem;">{t('You rode it out.')}</h1>
        <p class="muted" style="margin:8px auto; max-width:340px;">
          {t('The urge moved from')} {startUrge}/10 {t('to')} {currentUrge}/10. {t('Keep the action that helped in your plan.')}
        </p>
      {:else}
        <h1 style="font-size:1.7rem;">{t('You stayed with the plan.')}</h1>
        <p class="muted" style="margin:8px auto; max-width:340px;">
          {t('The urge did not drop yet. Change your setting, move away from the device, or contact someone you trust before deciding what to do next.')}
        </p>
      {/if}
      <div class="spacer"></div>
      <button class="btn btn-primary btn-lg" onclick={close}><Icon name="check" size={18} />{t("I'm okay now")}</button>
    </div>
  {/if}
</div>

{#if activeExercise}
  <GuidedExercises
    initialId={activeExercise}
    onclose={() => (activeExercise = null)}
    oncomplete={(id) => recordAction(id)}
  />
{/if}

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
  .quick-screen { width:min(100%,560px); margin:0 auto; padding-bottom:20px; }
  .quick-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin:4px 2px 18px; }
  .quick-head h1 { margin-top:8px; font-size:clamp(1.75rem,7vw,2.55rem); }
  .quick-stage-shell { padding:6px; border-radius:34px; background:rgba(255,255,255,.035); box-shadow:inset 0 0 0 1px rgba(255,255,255,.075),0 26px 64px -34px rgba(0,0,0,.9); }
  .quick-stage-core { position:relative; min-height:350px; display:grid; place-items:center; overflow:hidden; border-radius:28px; background:radial-gradient(24rem 18rem at 50% 35%,rgba(94,234,212,.12),transparent 62%),rgba(9,12,20,.96); box-shadow:inset 0 1px 1px rgba(255,255,255,.08); }
  .quick-stage-core :global(.breath-instrument) { transform:scale(.84); }
  .quick-time { position:absolute; left:18px; right:18px; bottom:16px; display:flex; justify-content:center; align-items:center; gap:9px; padding:10px 14px; border-radius:999px; background:rgba(4,8,13,.72); box-shadow:inset 0 0 0 1px var(--hairline); }
  .quick-time strong,.quick-time small { display:block; }.quick-time strong{font-size:.88rem}.quick-time small{color:var(--text-3);font-size:.62rem;text-transform:uppercase;letter-spacing:.12em}.quick-pulse{width:7px;height:7px;border-radius:50%;background:var(--acc);box-shadow:0 0 12px var(--acc-glow);animation:quick-pulse 1.8s var(--spring) infinite alternate}
  .quick-instruction { display:flex; gap:13px; align-items:flex-start; padding:20px 8px 13px; }
  .instruction-num { color:var(--acc); font-size:.62rem; font-weight:800; letter-spacing:.12em; padding-top:3px; }.quick-instruction strong,.quick-instruction small{display:block}.quick-instruction strong{font-size:.9rem}.quick-instruction small{color:var(--text-3);font-size:.71rem;margin-top:4px}
  .quick-action { width:100%; display:grid; grid-template-columns:46px 1fr auto; align-items:center; gap:12px; padding:13px; text-align:left; border-radius:22px; background:linear-gradient(135deg,rgba(253,164,175,.12),rgba(251,113,133,.035)); box-shadow:inset 0 0 0 1px rgba(251,113,133,.19); transition:transform .5s var(--spring),background .5s var(--spring); }
  .quick-action:active{transform:scale(.98)}.quick-action.done{background:linear-gradient(135deg,rgba(94,234,212,.12),rgba(94,234,212,.035));box-shadow:inset 0 0 0 1px rgba(94,234,212,.2)}.quick-action>span{width:46px;height:46px;display:grid;place-items:center;border-radius:15px;color:#2c1117;background:#fda4af;transition:transform .6s var(--spring),background .6s var(--spring)}.quick-action.done>span{color:#05221c;background:var(--acc);transform:rotate(-4deg) scale(1.05)}.quick-action strong,.quick-action small{display:block}.quick-action strong{font-size:.84rem}.quick-action small{color:var(--text-3);font-size:.68rem;margin-top:4px}.quick-action>:global(svg:last-child){color:var(--text-3)}
  .quick-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:10px; }
  .quick-card { min-height:116px; padding:15px; text-align:left; border-radius:20px; background:var(--core); box-shadow:inset 0 0 0 1px var(--hairline); transition:transform .45s var(--spring),background .45s var(--spring); }.quick-card:active{transform:scale(.97)}.quick-card .micro{display:block;color:var(--vio);font-size:.58rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.quick-card strong,.quick-card small{display:block}.quick-card strong{font-size:.83rem;margin-top:10px}.quick-card small{color:var(--text-3);font-size:.64rem;margin-top:5px}.contact-card{background:linear-gradient(145deg,rgba(167,139,250,.085),rgba(255,255,255,.025))}
  .quick-rating { margin:12px 2px 0; padding:14px 16px; border-radius:20px; background:rgba(255,255,255,.025); box-shadow:inset 0 0 0 1px var(--hairline); }.quick-rating>div{display:flex;justify-content:space-between;align-items:center;color:var(--text-3);font-size:.67rem}.quick-rating strong{color:var(--text-2);font-size:.78rem}.quick-rating .urge-slider{margin:10px 0 1px}
  .quick-actions-row { display:flex; justify-content:flex-end; gap:9px; margin-top:14px; }.quick-actions-row .btn{flex:1;padding-left:15px;padding-right:15px}
  @keyframes quick-pulse { from{transform:scale(.75);opacity:.45} to{transform:scale(1.25);opacity:1} }
  .check-screen { max-width:520px; margin:0 auto; }
  .check-screen h1 { font-size:clamp(1.9rem, 8vw, 3rem); margin:18px 0 10px; max-width:480px; }
  .check-screen > .muted { max-width:420px; }
  .close-top { position:absolute; top:0; right:0; }
  .urge-readout { margin:28px 0 10px; font-size:4.5rem; line-height:1; letter-spacing:-.07em; font-weight:800; color:var(--acc); }
  .urge-readout span { color:var(--text-3); font-size:1.1rem; letter-spacing:0; margin-left:6px; }
  .urge-slider { width:min(100%,420px); margin:8px 0 28px; }
  .check-screen .btn-block { max-width:420px; margin-top:9px; }
  .evidence-caption { max-width:420px; margin-top:16px; line-height:1.5; }
  .urge-compare { display:flex; align-items:center; justify-content:center; gap:22px; margin:26px 0 10px; }
  .urge-compare > span { min-width:82px; font-size:3rem; line-height:1; font-weight:800; color:var(--text-2); }
  .urge-compare > span.lower { color:var(--acc); }
  .urge-compare small { display:block; margin-top:7px; color:var(--text-3); font-size:.67rem; letter-spacing:.12em; text-transform:uppercase; }
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
