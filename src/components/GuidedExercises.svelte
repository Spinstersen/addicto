<script>
  import { onMount, onDestroy } from 'svelte'
  import { GUIDED_EXERCISES } from '../lib/content.js'
  import { settings } from '../lib/store.svelte.js'
  import { vibrate } from '../lib/helpers.js'
  import Icon from '../lib/Icon.svelte'

  let { initialId = 'five-senses', onclose, oncomplete } = $props()

  const senses = [
    { number: 5, label: 'things you can see', cue: 'Let your eyes land on shape, color and light.', symbol: '◌' },
    { number: 4, label: 'things you can feel', cue: 'Notice pressure, temperature and texture.', symbol: '≈' },
    { number: 3, label: 'things you can hear', cue: 'Listen for near sounds, then far sounds.', symbol: ')))' },
    { number: 2, label: 'things you can smell', cue: 'Notice the air, your clothes or the room.', symbol: '∿' },
    { number: 1, label: 'thing you can taste', cue: 'Notice one taste—or simply the feeling in your mouth.', symbol: '•' }
  ]
  const muscles = [
    { name: 'Hands', cue: 'Make soft fists. Keep breathing.', zone: 'hands' },
    { name: 'Shoulders', cue: 'Lift gently toward your ears.', zone: 'shoulders' },
    { name: 'Jaw', cue: 'Press lightly, never painfully.', zone: 'jaw' },
    { name: 'Legs', cue: 'Press your feet down and engage.', zone: 'legs' }
  ]
  const mindfulPrompts = [
    'Notice its outline without naming it.',
    'Find one color variation or shadow.',
    'Notice texture, reflection or movement.',
    'Let the object be ordinary. Return when attention wanders.'
  ]
  const places = ['Bed', 'Bathroom', 'Desk', 'Couch', 'Outside', 'Other']
  const saferPlaces = ['Another room', 'Outside', 'Shared space', 'Shower', 'Short walk']

  let activeId = $state('five-senses')
  let finished = $state(false)
  let senseIndex = $state(0)
  let senseCount = $state(0)
  let senseMoving = $state(false)
  let muscleIndex = $state(0)
  let musclePhase = $state('ready')
  let mindfulPrompt = $state(0)
  let currentPlace = $state('')
  let nextPlace = $state('')
  let locationMoved = $state(false)
  let chosenValue = $state('')
  let valueFlipped = $state(false)
  let timerTotal = $state(0)
  let remaining = $state(0)
  let timerKind = $state('')
  let timer = null
  let stageTimeout = null

  const exercise = $derived(GUIDED_EXERCISES.find((item) => item.id === activeId) || GUIDED_EXERCISES[0])
  const sense = $derived(senses[senseIndex])
  const muscle = $derived(muscles[muscleIndex])
  const timerProgress = $derived(timerTotal ? Math.min(1, Math.max(0, 1 - remaining / timerTotal)) : 0)
  const delayMinutes = $derived(Math.max(0, Math.ceil(remaining / 60)))
  const values = $derived(settings.values?.length ? settings.values : ['Health', 'Connection', 'Focus'])
  const valueLabel = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).replaceAll('-', ' ') : ''
  const chosenValueLabel = $derived(valueLabel(chosenValue))

  function clearTimers() {
    if (timer) clearInterval(timer)
    if (stageTimeout) clearTimeout(stageTimeout)
    timer = null
    stageTimeout = null
  }

  function startCountdown(seconds, kind) {
    clearTimers()
    timerTotal = seconds
    remaining = seconds
    timerKind = kind
    const started = Date.now()
    timer = setInterval(() => {
      remaining = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000))
      if (kind === 'mindful') mindfulPrompt = Math.min(mindfulPrompts.length - 1, Math.floor(timerProgress * mindfulPrompts.length))
      if (remaining <= 0) {
        clearInterval(timer)
        timer = null
        vibrate([70, 50, 70])
      }
    }, 200)
  }

  function activate(id) {
    clearTimers()
    activeId = id
    finished = false
    senseIndex = 0
    senseCount = 0
    muscleIndex = 0
    musclePhase = 'ready'
    mindfulPrompt = 0
    currentPlace = ''
    nextPlace = ''
    locationMoved = false
    chosenValue = ''
    valueFlipped = false
    timerTotal = 0
    remaining = 0
    timerKind = ''
    if (id === 'mindful-observe') startCountdown(60, 'mindful')
    if (id === 'leave-room') startCountdown(20, 'leave')
    vibrate(35)
  }

  function complete() {
    clearTimers()
    finished = true
    vibrate([55, 35, 80])
    oncomplete?.(activeId)
  }

  function noticeSense() {
    if (senseMoving) return
    vibrate(22)
    if (senseCount + 1 < sense.number) {
      senseCount += 1
      return
    }
    if (senseIndex === senses.length - 1) {
      complete()
      return
    }
    senseMoving = true
    senseCount = sense.number
    stageTimeout = setTimeout(() => {
      senseIndex += 1
      senseCount = 0
      senseMoving = false
    }, 420)
  }

  function runMuscle() {
    if (musclePhase !== 'ready') return
    musclePhase = 'tense'
    vibrate(35)
    stageTimeout = setTimeout(() => {
      musclePhase = 'release'
      vibrate(65)
      stageTimeout = setTimeout(() => {
        if (muscleIndex === muscles.length - 1) complete()
        else {
          muscleIndex += 1
          musclePhase = 'ready'
        }
      }, 2600)
    }, 4000)
  }

  function releaseNow() {
    if (musclePhase !== 'tense') return
    if (stageTimeout) clearTimeout(stageTimeout)
    musclePhase = 'release'
    vibrate(65)
    stageTimeout = setTimeout(() => {
      if (muscleIndex === muscles.length - 1) complete()
      else {
        muscleIndex += 1
        musclePhase = 'ready'
      }
    }, 2600)
  }

  function nextMindfulPrompt() {
    if (mindfulPrompt < mindfulPrompts.length - 1) mindfulPrompt += 1
    else complete()
    vibrate(24)
  }

  function chooseValue(value) {
    chosenValue = value
    valueFlipped = true
    vibrate(30)
  }

  function chooseCurrent(place) {
    currentPlace = place
    nextPlace = ''
    locationMoved = false
    vibrate(20)
  }

  function chooseNext(place) {
    nextPlace = place
    locationMoved = true
    vibrate([25, 25, 40])
  }

  function close() {
    clearTimers()
    onclose?.()
  }

  function keydown(event) {
    if (event.key === 'Escape') close()
  }

  const mmss = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`

  onMount(() => activate(initialId))
  onDestroy(clearTimers)
</script>

<svelte:window onkeydown={keydown} />

<div class="exercise-overlay" role="dialog" aria-modal="true" aria-label={exercise.title}>
  <div class="exercise-wrap">
    <header class="exercise-head">
      <button class="circle-btn" onclick={close} aria-label="Close guided exercise"><Icon name="x" size={18} /></button>
      <div>
        <span class="eyebrow">Guided action</span>
        <strong>{exercise.duration}</strong>
      </div>
      <button class="circle-btn" onclick={() => activate(GUIDED_EXERCISES[(GUIDED_EXERCISES.findIndex((item) => item.id === activeId) + 1) % GUIDED_EXERCISES.length].id)} aria-label="Next exercise"><Icon name="arrow" size={17} /></button>
    </header>

    {#if finished}
      <section class="finish-scene">
        <div class="finish-orbit"><span><Icon name="check" size={32} /></span></div>
        <span class="eyebrow on">Action completed</span>
        <h1>You created a pause.</h1>
        <p>Notice what changed—even a small shift counts as useful information.</p>
        <button class="btn btn-primary btn-lg" onclick={close}>Return to your tools <span class="arrow"><Icon name="arrow" size={16} /></span></button>
      </section>
    {:else}
      <div class="exercise-title">
        <span class="exercise-index">0{GUIDED_EXERCISES.findIndex((item) => item.id === activeId) + 1}</span>
        <div><h1>{exercise.title}</h1><p>{exercise.sub}</p></div>
      </div>

      <div class="stage-shell tone-{exercise.tone}">
        <div class="stage-core">
          {#if activeId === 'five-senses'}
            <section class="sense-stage" aria-live="polite">
              <div class="sense-orbit" class:moving={senseMoving}>
                {#each Array(sense.number) as _, index}
                  <span class:found={index < senseCount} style="--i:{index}; --n:{sense.number};"></span>
                {/each}
                <div class="sense-center" class:pop={senseCount > 0}>
                  <strong>{Math.max(0, sense.number - senseCount)}</strong>
                  <small>{sense.symbol}</small>
                </div>
              </div>
              <div class="stage-copy" key={senseIndex}>
                <span class="micro-label">Notice {sense.number}</span>
                <h2>{sense.label}</h2>
                <p>{sense.cue}</p>
              </div>
              <button class="action-pad" onclick={noticeSense}>
                <span class="tap-ripple"></span>
                <Icon name="plus" size={20} /> I notice one
              </button>
              <div class="step-dots" aria-label={`Sense ${senseIndex + 1} of ${senses.length}`}>
                {#each senses as _, index}<i class:active={index === senseIndex} class:done={index < senseIndex}></i>{/each}
              </div>
            </section>

          {:else if activeId === 'muscle-release'}
            <section class="muscle-stage {musclePhase}" aria-live="polite">
              <div class="body-map" data-zone={muscle.zone}>
                <svg viewBox="0 0 180 220" aria-hidden="true">
                  <circle class="body-part head" cx="90" cy="30" r="18" />
                  <path class="body-part torso" d="M62 62 Q90 50 118 62 L110 132 Q90 145 70 132Z" />
                  <path class="body-part arms" d="M64 67 35 112M116 67l29 45" />
                  <circle class="body-part hands left" cx="32" cy="119" r="8" />
                  <circle class="body-part hands right" cx="148" cy="119" r="8" />
                  <path class="body-part legs" d="M76 134 58 204M104 134l18 70" />
                  <path class="body-part shoulders" d="M61 66q29-17 58 0" />
                  <path class="body-part jaw" d="M78 36q12 12 24 0" />
                </svg>
                <span class="body-halo"></span>
              </div>
              <div class="stage-copy">
                <span class="micro-label">{muscleIndex + 1} of {muscles.length}</span>
                <h2>{musclePhase === 'tense' ? `Hold ${muscle.name.toLowerCase()}` : musclePhase === 'release' ? 'Release slowly' : muscle.name}</h2>
                <p>{musclePhase === 'release' ? 'Notice the contrast. Let the weight drop.' : muscle.cue}</p>
              </div>
              <button class="action-pad muscle-pad" class:pressed={musclePhase === 'tense'} onclick={musclePhase === 'tense' ? releaseNow : runMuscle} disabled={musclePhase === 'release'}>
                <span class="hold-ring"></span>
                {musclePhase === 'ready' ? 'Tap to tense gently' : musclePhase === 'tense' ? 'Release now' : 'Notice the release'}
              </button>
            </section>

          {:else if activeId === 'mindful-observe'}
            <section class="observe-stage">
              <div class="focus-field">
                <span class="focus-ring r1"></span><span class="focus-ring r2"></span><span class="focus-ring r3"></span>
                <span class="focus-object"></span>
                <svg class="focus-sweep" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 18a82 82 0 0 1 82 82" /></svg>
              </div>
              <div class="stage-copy prompt-swap" key={mindfulPrompt}>
                <span class="micro-label">Observe · {mmss(remaining)}</span>
                <h2>{mindfulPrompts[mindfulPrompt]}</h2>
                <p>Your job is not to empty your mind. Gently return to the same object.</p>
              </div>
              <button class="action-pad" onclick={nextMindfulPrompt}><Icon name="eye" size={20} /> I noticed that</button>
            </section>

          {:else if activeId === 'leave-room'}
            <section class="door-stage" class:open={remaining === 0}>
              <div class="door-scene">
                <span class="floor-line"></span>
                <div class="door-frame"><div class="door-panel"><i></i></div></div>
                <span class="walk-dot"></span>
              </div>
              <div class="stage-copy">
                <span class="micro-label">Create distance</span>
                <h2>{remaining > 0 ? `Stand up in ${remaining}` : 'Walk through the doorway'}</h2>
                <p>{remaining > 0 ? 'Put the device down. Feet on the floor. Get ready to move.' : 'Take the device only if you need the guide—keep the triggering screen closed.'}</p>
              </div>
              {#if remaining === 0}<button class="action-pad success" onclick={complete}><Icon name="door" size={20} /> I am in a different room</button>{/if}
            </section>

          {:else if activeId === 'values-choice'}
            <section class="values-stage">
              <div class="value-deck" class:flipped={valueFlipped}>
                <div class="value-card value-front">
                  <span class="micro-label">Your direction</span>
                  <Icon name="compass" size={38} />
                  <h2>{chosenValueLabel || 'Choose a value'}</h2>
                  <p>Values are directions you can move toward right now—not a test you pass.</p>
                </div>
                <div class="value-card value-back">
                  <span class="micro-label">One next action</span>
                  <h2>What would “{chosenValueLabel}” choose for the next ten minutes?</h2>
                  <p>{settings.reasons || 'Choose the action you will respect when this moment has passed.'}</p>
                </div>
              </div>
              <div class="value-pills">
                {#each values as value}<button class:selected={chosenValue === value} onclick={() => chooseValue(value)}>{valueLabel(value)}</button>{/each}
              </div>
              {#if valueFlipped}<button class="action-pad success" onclick={complete}><Icon name="arrow" size={20} /> Take one step toward {chosenValueLabel}</button>{/if}
            </section>

          {:else if activeId === 'location-shift'}
            <section class="location-stage" class:moving={locationMoved}>
              <div class="location-map">
                <div class="place-node current"><span><Icon name="map" size={21} /></span><small>{currentPlace || 'Here'}</small></div>
                <div class="travel-line"><i></i><b></b></div>
                <div class="place-node next"><span><Icon name="door" size={21} /></span><small>{nextPlace || 'Safer place'}</small></div>
              </div>
              <div class="stage-copy">
                <span class="micro-label">Step {currentPlace ? 2 : 1} of 2</span>
                <h2>{currentPlace ? 'Where will you move?' : 'Where are you now?'}</h2>
                <p>Changing the setting adds useful friction between the urge and an automatic action.</p>
              </div>
              <div class="place-pills">
                {#each currentPlace ? saferPlaces : places as place}
                  <button class:selected={(currentPlace === place && !nextPlace) || nextPlace === place} onclick={() => currentPlace ? chooseNext(place) : chooseCurrent(place)}>{place}</button>
                {/each}
              </div>
              {#if nextPlace}<button class="action-pad success" onclick={complete}><Icon name="check" size={20} /> I moved to {nextPlace.toLowerCase()}</button>{/if}
            </section>

          {:else if activeId === 'delayed-choice'}
            <section class="delay-stage">
              <div class="timer-orbit" style="--progress:{timerProgress};">
                <svg viewBox="0 0 150 150" aria-hidden="true">
                  <circle class="timer-track" cx="75" cy="75" r="63" />
                  <circle class="timer-fill" cx="75" cy="75" r="63" pathLength="100" style="stroke-dashoffset:{100 - timerProgress * 100}" />
                </svg>
                <div><strong>{timerTotal ? mmss(remaining) : '—'}</strong><small>{timerTotal ? `${delayMinutes} min left` : 'choose a delay'}</small></div>
              </div>
              <div class="stage-copy">
                <span class="micro-label">Not never · not now</span>
                <h2>{timerTotal ? 'You do not have to decide yet.' : 'How much space can you make?'}</h2>
                <p>During the delay, change location or do one absorbing action. Recheck instead of acting automatically.</p>
              </div>
              <div class="delay-options">
                {#each [120, 300, 600] as seconds}<button class:active={timerTotal === seconds} onclick={() => startCountdown(seconds, 'delay')}>{seconds / 60} min</button>{/each}
              </div>
              {#if timerTotal}<button class="action-pad" onclick={complete}><Icon name="check" size={20} /> Check my choice now</button>{/if}
            </section>
          {/if}
        </div>
      </div>

      <nav class="exercise-switcher" aria-label="Guided exercise picker">
        {#each GUIDED_EXERCISES as item}
          <button class:active={item.id === activeId} onclick={() => activate(item.id)} aria-label={item.title}><Icon name={item.icon} size={17} /></button>
        {/each}
      </nav>
    {/if}
  </div>
</div>

<style>
  .exercise-overlay { position:fixed; inset:0; z-index:110; overflow-y:auto; color:var(--text); background:radial-gradient(35rem 28rem at 12% 4%,rgba(94,234,212,.14),transparent 64%),radial-gradient(34rem 32rem at 100% 18%,rgba(167,139,250,.13),transparent 62%),#05070d; animation:overlay-arrive .7s var(--spring) both; }
  :global(body:has(.exercise-overlay) .nav-island) { opacity:0; pointer-events:none; transform:translateY(22px); }
  .exercise-wrap { width:min(100%,620px); min-height:100dvh; margin:0 auto; padding:calc(18px + var(--safe-top)) 18px calc(34px + var(--safe-bottom)); display:flex; flex-direction:column; }
  .exercise-head { display:grid; grid-template-columns:44px 1fr 44px; align-items:center; gap:12px; }
  .exercise-head > div { text-align:center; }
  .exercise-head strong { display:block; margin-top:4px; color:var(--text-3); font-size:.72rem; }
  .circle-btn { width:44px; height:44px; display:grid; place-items:center; border-radius:50%; background:rgba(255,255,255,.045); box-shadow:inset 0 0 0 1px var(--hairline); transition:transform .45s var(--spring),background .45s var(--spring); }
  .circle-btn:active { transform:scale(.9); }
  .exercise-title { display:flex; gap:14px; align-items:flex-start; padding:30px 6px 20px; animation:title-in .75s var(--spring) both; }
  .exercise-title h1 { font-size:clamp(1.7rem,7vw,2.65rem); }
  .exercise-title p { color:var(--text-3); margin-top:5px; font-size:.86rem; }
  .exercise-index { color:var(--acc); font-size:.65rem; font-weight:800; letter-spacing:.14em; padding-top:7px; }
  .stage-shell { padding:6px; border-radius:36px; background:rgba(255,255,255,.035); box-shadow:inset 0 0 0 1px rgba(255,255,255,.075),0 32px 74px -35px rgba(0,0,0,.9); }
  .stage-core { min-height:530px; padding:28px 22px 24px; overflow:hidden; border-radius:30px; background:radial-gradient(28rem 24rem at 50% -8%,var(--stage-glow),transparent 62%),rgba(9,12,20,.94); box-shadow:inset 0 1px 1px rgba(255,255,255,.08); }
  .tone-mint { --stage:#5eead4; --stage-glow:rgba(94,234,212,.16); }
  .tone-violet { --stage:#a78bfa; --stage-glow:rgba(167,139,250,.17); }
  .tone-sky { --stage:#7dd3fc; --stage-glow:rgba(125,211,252,.16); }
  .tone-rose { --stage:#fda4af; --stage-glow:rgba(251,113,133,.15); }
  .tone-amber { --stage:#fbbf24; --stage-glow:rgba(251,191,36,.13); }
  .stage-copy { text-align:center; margin:22px auto 20px; max-width:410px; animation:copy-rise .65s var(--spring) both; }
  .stage-copy h2 { font-size:clamp(1.35rem,6vw,1.85rem); margin-top:7px; }
  .stage-copy p { color:var(--text-2); font-size:.86rem; margin-top:8px; }
  .micro-label { color:var(--stage); font-size:.65rem; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
  .action-pad { position:relative; width:100%; min-height:58px; padding:15px 20px; display:flex; align-items:center; justify-content:center; gap:9px; overflow:hidden; border-radius:999px; color:#061714; font-weight:800; background:var(--stage); box-shadow:0 18px 40px -22px var(--stage); transition:transform .42s var(--spring),filter .42s var(--spring); }
  .action-pad:active { transform:scale(.965); }
  .action-pad:disabled { color:var(--text-2); background:var(--core-2); box-shadow:none; }
  .action-pad.success { background:linear-gradient(135deg,#80f5df,#43d6b8); }
  .tap-ripple { position:absolute; width:12px; height:12px; border-radius:50%; background:rgba(255,255,255,.42); opacity:0; }
  .action-pad:active .tap-ripple { animation:tap-wave .55s var(--spring); }
  .sense-orbit { position:relative; width:218px; height:218px; margin:4px auto 0; display:grid; place-items:center; }
  .sense-orbit::before,.sense-orbit::after { content:''; position:absolute; inset:18px; border-radius:50%; box-shadow:inset 0 0 0 1px rgba(94,234,212,.16); animation:orbit-breathe 4.8s var(--spring) infinite alternate; }
  .sense-orbit::after { inset:42px; animation-delay:-2.2s; }
  .sense-orbit > span { position:absolute; width:19px; height:19px; border-radius:50%; background:rgba(255,255,255,.07); box-shadow:inset 0 0 0 1px rgba(255,255,255,.1); transform:rotate(calc(360deg / var(--n) * var(--i))) translateY(-91px); transition:transform .65s var(--spring),background .65s var(--spring),opacity .65s var(--spring); }
  .sense-orbit > span.found { background:var(--stage); box-shadow:0 0 18px rgba(94,234,212,.55); transform:rotate(calc(360deg / var(--n) * var(--i))) translateY(-91px) scale(1.32); }
  .sense-center { width:104px; height:104px; display:grid; place-items:center; align-content:center; border-radius:50%; background:rgba(94,234,212,.08); box-shadow:inset 0 0 0 1px rgba(94,234,212,.18),0 0 50px rgba(94,234,212,.08); transition:transform .5s var(--spring); }
  .sense-center.pop { animation:soft-pop .45s var(--spring); }
  .sense-center strong { font-size:3.2rem; line-height:.9; color:var(--stage); }
  .sense-center small { margin-top:8px; color:var(--text-3); }
  .step-dots { display:flex; justify-content:center; gap:7px; margin-top:18px; }
  .step-dots i { width:7px; height:7px; border-radius:7px; background:rgba(255,255,255,.1); transition:transform .5s var(--spring),background .5s var(--spring); }
  .step-dots i.active { transform:scaleX(2.2); background:var(--stage); }
  .step-dots i.done { background:rgba(94,234,212,.42); }
  .body-map { position:relative; width:180px; height:220px; margin:0 auto; }
  .body-map svg { width:100%; height:100%; overflow:visible; }
  .body-part { fill:none; stroke:rgba(255,255,255,.18); stroke-width:7; stroke-linecap:round; stroke-linejoin:round; transition:stroke .6s var(--spring),transform .6s var(--spring),opacity .6s var(--spring); transform-origin:center; }
  .body-halo { position:absolute; inset:40px 30px; border-radius:50%; background:var(--stage-glow); filter:blur(28px); opacity:.5; animation:body-calm 3.2s var(--spring) infinite alternate; }
  .body-map[data-zone='hands'] .hands,.body-map[data-zone='shoulders'] .shoulders,.body-map[data-zone='jaw'] .jaw,.body-map[data-zone='legs'] .legs { stroke:var(--stage); filter:drop-shadow(0 0 7px var(--stage)); }
  .muscle-stage.tense .body-part { transform:scale(.96); }
  .muscle-stage.tense .body-halo { transform:scale(.72); opacity:.9; }
  .muscle-stage.release .body-part { transform:scale(1.025); }
  .muscle-stage.release .body-halo { transform:scale(1.4); opacity:.18; }
  .muscle-pad.pressed { animation:held 4s cubic-bezier(.2,.7,.2,1) both; }
  .focus-field { position:relative; width:230px; height:230px; margin:2px auto 0; display:grid; place-items:center; }
  .focus-ring { position:absolute; border-radius:50%; box-shadow:inset 0 0 0 1px rgba(125,211,252,.16); animation:focus-pulse 5s var(--spring) infinite alternate; }
  .focus-ring.r1 { inset:16px; }.focus-ring.r2 { inset:42px; animation-delay:-1.7s; }.focus-ring.r3 { inset:67px; animation-delay:-3.4s; }
  .focus-object { width:34px; height:34px; border-radius:12px 18px 14px 20px; background:linear-gradient(145deg,#b9ecff,#64bddf); box-shadow:0 0 34px rgba(125,211,252,.36); animation:object-float 4.5s var(--spring) infinite alternate; }
  .focus-sweep { position:absolute; inset:0; width:100%; height:100%; animation:sweep 8s cubic-bezier(.45,.05,.55,.95) infinite; }
  .focus-sweep path { fill:none; stroke:var(--stage); stroke-width:2; stroke-linecap:round; }
  .door-scene { position:relative; width:230px; height:230px; margin:0 auto; perspective:700px; }
  .floor-line { position:absolute; left:18px; right:18px; bottom:28px; height:1px; background:rgba(255,255,255,.12); transform:rotateX(66deg); }
  .door-frame { position:absolute; width:108px; height:176px; left:61px; top:22px; border-radius:4px 4px 0 0; box-shadow:inset 0 0 0 5px rgba(253,164,175,.34),0 0 45px rgba(251,113,133,.08); perspective:550px; }
  .door-panel { position:absolute; inset:7px; transform-origin:left center; background:linear-gradient(145deg,rgba(253,164,175,.24),rgba(255,255,255,.045)); box-shadow:inset 0 0 0 1px rgba(255,255,255,.12); transition:transform 1.2s var(--spring); }
  .door-panel i { position:absolute; width:7px; height:7px; right:11px; top:50%; border-radius:50%; background:var(--stage); }
  .door-stage.open .door-panel { transform:rotateY(-72deg); }
  .walk-dot { position:absolute; width:14px; height:14px; left:108px; bottom:18px; border-radius:50%; background:var(--stage); opacity:0; }
  .door-stage.open .walk-dot { animation:walk-through 1.6s .25s var(--spring) both; }
  .value-deck { position:relative; width:100%; min-height:240px; transform-style:preserve-3d; transition:transform .9s var(--spring); }
  .value-deck.flipped { transform:rotateY(180deg); }
  .value-card { position:absolute; inset:0; padding:30px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; border-radius:27px; backface-visibility:hidden; background:radial-gradient(circle at 50% 0,rgba(251,191,36,.14),transparent 62%),rgba(255,255,255,.035); box-shadow:inset 0 0 0 1px rgba(251,191,36,.16); }
  .value-card :global(svg) { color:var(--stage); margin:18px 0 12px; }
  .value-card h2 { font-size:1.6rem; }.value-card p { color:var(--text-2); font-size:.84rem; margin-top:10px; }
  .value-back { transform:rotateY(180deg); }
  .value-pills,.place-pills,.delay-options { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:18px 0; }
  .value-pills button,.place-pills button,.delay-options button { padding:10px 14px; border-radius:999px; color:var(--text-2); background:rgba(255,255,255,.045); box-shadow:inset 0 0 0 1px var(--hairline); transition:transform .4s var(--spring),background .4s var(--spring),color .4s var(--spring); }
  .value-pills button.selected,.place-pills button.selected,.delay-options button.active { color:#211803; background:var(--stage); transform:translateY(-2px); }
  .location-map { height:180px; display:grid; grid-template-columns:72px 1fr 72px; align-items:center; }
  .place-node { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; color:var(--text-3); }
  .place-node span { width:58px; height:58px; display:grid; place-items:center; border-radius:50%; background:rgba(255,255,255,.045); box-shadow:inset 0 0 0 1px var(--hairline); transition:transform .7s var(--spring),background .7s var(--spring); }
  .place-node small { font-size:.66rem; }
  .travel-line { position:relative; height:2px; background:rgba(255,255,255,.09); overflow:visible; }
  .travel-line i { position:absolute; inset:0; transform:scaleX(0); transform-origin:left; background:var(--stage); transition:transform 1s var(--spring); }
  .travel-line b { position:absolute; width:10px; height:10px; left:-4px; top:-4px; border-radius:50%; background:var(--stage); opacity:0; }
  .location-stage.moving .travel-line i { transform:scaleX(1); }
  .location-stage.moving .travel-line b { animation:map-travel 1s var(--spring) both; }
  .location-stage.moving .place-node.next span { transform:scale(1.12); background:rgba(94,234,212,.15); }
  .timer-orbit { position:relative; width:220px; height:220px; margin:0 auto; display:grid; place-items:center; }
  .timer-orbit svg { position:absolute; inset:0; width:100%; height:100%; transform:rotate(-90deg); }
  .timer-track,.timer-fill { fill:none; stroke-width:5; }
  .timer-track { stroke:rgba(255,255,255,.07); }.timer-fill { stroke:var(--stage); stroke-linecap:round; stroke-dasharray:100; transition:stroke-dashoffset .35s var(--ease-soft); filter:drop-shadow(0 0 5px rgba(167,139,250,.45)); }
  .timer-orbit > div { text-align:center; }.timer-orbit strong,.timer-orbit small { display:block; }.timer-orbit strong { font-size:2.7rem; letter-spacing:-.06em; }.timer-orbit small { color:var(--text-3); font-size:.72rem; margin-top:5px; }
  .exercise-switcher { display:flex; justify-content:center; gap:7px; margin:18px auto 0; padding:6px; border-radius:999px; background:rgba(255,255,255,.03); box-shadow:inset 0 0 0 1px var(--hairline); }
  .exercise-switcher button { width:38px; height:38px; display:grid; place-items:center; border-radius:50%; color:var(--text-3); transition:transform .45s var(--spring),color .45s var(--spring),background .45s var(--spring); }
  .exercise-switcher button.active { color:#041a16; background:var(--acc); transform:scale(1.08); }
  .finish-scene { flex:1; min-height:70dvh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; animation:finish-in .8s var(--spring) both; }
  .finish-orbit { width:150px; height:150px; display:grid; place-items:center; margin-bottom:26px; border-radius:50%; box-shadow:inset 0 0 0 1px rgba(94,234,212,.16); animation:finish-ring 3s var(--spring) infinite alternate; }
  .finish-orbit span { width:82px; height:82px; display:grid; place-items:center; border-radius:50%; color:#05221c; background:var(--acc); box-shadow:0 0 50px rgba(94,234,212,.27); }
  .finish-scene h1 { font-size:clamp(2rem,9vw,3.2rem); margin:18px 0 10px; }.finish-scene p { max-width:390px; color:var(--text-2); margin-bottom:28px; }
  @keyframes overlay-arrive { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes title-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes copy-rise { from{opacity:0;transform:translateY(13px)} to{opacity:1;transform:none} }
  @keyframes tap-wave { 0%{opacity:.7;transform:scale(1)} 100%{opacity:0;transform:scale(20)} }
  @keyframes orbit-breathe { from{transform:scale(.94);opacity:.45} to{transform:scale(1.04);opacity:1} }
  @keyframes soft-pop { 0%{transform:scale(.92)} 65%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes body-calm { from{transform:scale(.8);opacity:.35} to{transform:scale(1.12);opacity:.7} }
  @keyframes held { from{transform:scale(1)} to{transform:scale(.96)} }
  @keyframes focus-pulse { from{transform:scale(.92);opacity:.34} to{transform:scale(1.05);opacity:.86} }
  @keyframes object-float { from{transform:translateY(5px) rotate(-5deg)} to{transform:translateY(-6px) rotate(5deg)} }
  @keyframes sweep { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
  @keyframes walk-through { 0%{opacity:0;transform:translateY(20px) scale(.6)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-120px) scale(.3)} }
  @keyframes map-travel { 0%{left:-4px;opacity:0} 15%{opacity:1} 100%{left:calc(100% - 5px);opacity:0} }
  @keyframes finish-in { from{opacity:0;transform:translateY(25px) scale(.98)} to{opacity:1;transform:none} }
  @keyframes finish-ring { from{transform:scale(.95)} to{transform:scale(1.05)} }
  @media (max-width:520px) { .stage-core{min-height:510px;padding:24px 18px 20px}.exercise-title{padding-top:24px}.exercise-switcher{gap:4px}.exercise-switcher button{width:35px;height:35px}.sense-orbit{width:202px;height:202px}.sense-orbit > span{transform:rotate(calc(360deg / var(--n) * var(--i))) translateY(-84px)}.sense-orbit > span.found{transform:rotate(calc(360deg / var(--n) * var(--i))) translateY(-84px) scale(1.3)} }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.focus-sweep{display:none} }
</style>
