<script>
  import { VALUES } from '../lib/content.js'
  import { setSetting } from '../lib/db.js'
  import { settings } from '../lib/store.svelte.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'

  let { ondone } = $props()
  let step = $state(0)
  let goalMode = $state('stop')
  let fitCheck = $state({ control: false, impact: false, duration: false, moralOnly: false })
  let pickedValues = $state([])
  let reasons = $state('')
  let triggers = $state('')
  let alternatives = $state('')
  let contact = $state('')
  let gate = $state(true)
  let faith = $state(false)

  const stepLabels = ['Welcome', 'Goal', 'Fit check', 'Motivation', 'Plan']
  const waveAsset = `${import.meta.env.BASE_URL}urge-wave.webp`

  const fitItems = [
    { key: 'control', title: 'Loss of control', body: 'I repeatedly do more than I intended or have not been able to cut back.' },
    { key: 'impact', title: 'Real-life impact', body: 'It is interfering with relationships, work, sleep, sex, finances or other important parts of life.' },
    { key: 'duration', title: 'Persistent pattern', body: 'This has been a repeated pattern for months, not only a brief change.' },
    { key: 'moralOnly', title: 'Values conflict only', body: 'My distress is mainly that any pornography use conflicts with my moral or religious beliefs.' }
  ]

  const strongFit = $derived(fitCheck.control && fitCheck.impact && fitCheck.duration)
  const moralOnly = $derived(fitCheck.moralOnly && !fitCheck.impact && !fitCheck.control)

  function toggleValue(id) {
    pickedValues = pickedValues.includes(id)
      ? pickedValues.filter((value) => value !== id)
      : pickedValues.length < 3 ? [...pickedValues, id] : pickedValues
  }

  function toggleFit(key) {
    fitCheck[key] = !fitCheck[key]
    fitCheck = { ...fitCheck }
  }

  async function finish() {
    settings.values = pickedValues
    settings.reasons = reasons.trim()
    settings.goalMode = goalMode
    settings.fitCheck = { ...fitCheck }
    settings.crisis = {
      topTriggers: triggers.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 4),
      topAlternatives: alternatives.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 4),
      contact: contact.trim()
    }
    settings.gateEnabled = gate
    settings.faithMode = faith

    await Promise.all([
      setSetting('values', settings.values),
      setSetting('reasons', settings.reasons),
      setSetting('goalMode', settings.goalMode),
      setSetting('fitCheck', settings.fitCheck),
      setSetting('crisis', settings.crisis),
      setSetting('gateEnabled', gate),
      setSetting('faithMode', faith),
      setSetting('onboardingDone', true)
    ])
    ondone()
  }

  function next() {
    if (step === stepLabels.length - 1) finish()
    else step += 1
  }
</script>

<div class="onboard">
  <div class="ob-top">
    <span class="eyebrow on">{step + 1} / {stepLabels.length} · {t(stepLabels[step])}</span>
    <div class="ob-progress" aria-label={`Step ${step + 1} of ${stepLabels.length}`}>
      {#each stepLabels as _, index (index)}
        <span class="ob-bar" class:on={index <= step}></span>
      {/each}
    </div>
  </div>

  <div class="ob-step" class:compact={step === 4}>
    {#if step === 0}
      <div class="big-glyph"><Icon name="leaf" size={30} /></div>
      <p class="kicker">Private · local · practical</p>
      <h1>Change the pattern.<br /><span>Keep your dignity.</span></h1>
      <div class="ob-visual"><img src={waveAsset} alt="Abstract layered wave" /><span>Observe · choose · check again</span></div>
      <p class="ob-sub">This is a self-help companion for pornography use that feels hard to control or is harming your life. It supports change; it does not diagnose or promise a cure.</p>
      <div class="evidence-note">
        <Icon name="book" size={20} />
        <p><strong>What the evidence supports:</strong> structured CBT-style skills, motivation work, mindfulness, trigger planning and relapse prevention. App-specific evidence is still limited.</p>
      </div>
      <p class="fine">Frequent sexual behavior by itself is not a disorder. Distress caused only by moral disapproval is not enough for a CSBD diagnosis.</p>
    {:else if step === 1}
      <div class="big-glyph"><Icon name="target" size={30} /></div>
      <p class="kicker">Choose the direction</p>
      <h1>What would meaningful change look like?</h1>
      <p class="ob-sub">You can change this later. A clear goal makes the plan more useful.</p>
      <div class="goal-stack">
        <button class="goal-card" class:selected={goalMode === 'stop'} onclick={() => (goalMode = 'stop')}>
          <span class="goal-icon"><Icon name="shield" size={22} /></span>
          <span><strong>Stop pornography use</strong><small>A clear abstinence goal, without treating a slip as total failure.</small></span>
          <span class="radio"></span>
        </button>
        <button class="goal-card" class:selected={goalMode === 'control'} onclick={() => (goalMode = 'control')}>
          <span class="goal-icon"><Icon name="sliders" size={22} /></span>
          <span><strong>Regain choice and control</strong><small>Reduce unwanted use and focus on its impact on your life.</small></span>
          <span class="radio"></span>
        </button>
      </div>
    {:else if step === 2}
      <div class="big-glyph"><Icon name="sliders" size={30} /></div>
      <p class="kicker">A careful fit check</p>
      <h1>Focus on control and impact—not labels.</h1>
      <p class="ob-sub">This is not a diagnosis. It helps the app avoid pathologizing normal sexuality.</p>
      <div class="fit-list">
        {#each fitItems as item (item.key)}
          <button class="fit-item" class:selected={fitCheck[item.key]} onclick={() => toggleFit(item.key)}>
            <span class="check-box">{#if fitCheck[item.key]}<Icon name="check" size={15} />{/if}</span>
            <span><strong>{item.title}</strong><small>{item.body}</small></span>
          </button>
        {/each}
      </div>
      {#if strongFit}
        <div class="callout acc"><Icon name="users" size={20} /><div><strong>Self-help may be useful alongside care.</strong> A therapist experienced in compulsive sexual behavior can assess the full picture and tailor treatment.</div></div>
      {:else if moralOnly}
        <div class="callout vio"><Icon name="heart" size={20} /><div><strong>A shame-focused approach may fit better.</strong> Consider a sex-positive clinician who respects your values without automatically labeling sexual behavior as addiction.</div></div>
      {/if}
    {:else if step === 3}
      <div class="big-glyph"><Icon name="star" size={30} /></div>
      <p class="kicker">Motivation that is yours</p>
      <h1>What are you moving toward?</h1>
      <p class="ob-sub">Pick up to three values, then write one sentence you want available in a difficult moment.</p>
      <div class="pill-grid">
        {#each VALUES as value (value.id)}
          <button class="choice-pill" class:selected={pickedValues.includes(value.id)} onclick={() => toggleValue(value.id)}>{t(value.label)}</button>
        {/each}
      </div>
      <label class="ob-field">
        <span class="ob-label">My reason for changing</span>
        <textarea class="field" bind:value={reasons} placeholder="I want to be more present in my relationship and have my evenings back."></textarea>
      </label>
    {:else}
      <div class="big-glyph"><Icon name="shield" size={30} /></div>
      <p class="kicker">Make the next decision easy</p>
      <h1>Write a small plan while calm.</h1>
      <p class="ob-sub">Short, concrete choices are easier to use when an urge is strong.</p>
      <label class="ob-field"><span class="ob-label">Likely situations</span><input class="field" bind:value={triggers} placeholder="late at night, alone in bed, after stress" /></label>
      <label class="ob-field"><span class="ob-label">Actions that can help</span><input class="field" bind:value={alternatives} placeholder="leave the room, shower, walk, call someone" /></label>
      <label class="ob-field"><span class="ob-label">Support person <span>(optional)</span></span><input class="field" bind:value={contact} placeholder="someone I trust" /></label>
      <div class="pref-row">
        <div><strong>Daily check-in prompt</strong><small>Open on a quick check-in until one is logged.</small></div>
        <label class="toggle"><input type="checkbox" checked={gate} onchange={() => (gate = !gate)} /><span class="track"></span></label>
      </div>
      <div class="pref-row">
        <div><strong>Faith-based support</strong><small>Optional Islamic reflections in the urge flow.</small></div>
        <label class="toggle"><input type="checkbox" checked={faith} onchange={() => (faith = !faith)} /><span class="track"></span></label>
      </div>
    {/if}
  </div>

  <div class="ob-nav">
    {#if step > 0}<button class="btn btn-soft" onclick={() => (step -= 1)}>{t('Back')}</button>{/if}
    <button class="btn btn-primary grow" onclick={next}>
      {step === stepLabels.length - 1 ? 'Build my plan' : t('Continue')}
      <span class="arrow"><Icon name="arrow" size={15} /></span>
    </button>
  </div>
</div>

<style>
  .onboard { min-height:100vh; min-height:100dvh; max-width:640px; margin:0 auto; padding:calc(26px + var(--safe-top)) 22px calc(24px + var(--safe-bottom)); display:flex; flex-direction:column; }
  .ob-top { margin-bottom:30px; }
  .ob-progress { display:flex; gap:6px; margin-top:14px; }
  .ob-bar { flex:1; height:3px; border-radius:3px; background:var(--core-2); transition:background .5s var(--spring), transform .5s var(--spring); }
  .ob-bar.on { background:var(--acc); transform:scaleY(1.35); }
  .ob-step { flex:1; animation:ob-in .55s var(--spring) both; }
  @keyframes ob-in { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  .kicker { margin:18px 0 8px; color:var(--acc); font-size:.72rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
  h1 { font-size:clamp(2rem, 8vw, 3.35rem); line-height:1.04; letter-spacing:-.045em; max-width:570px; }
  h1 span { color:var(--text-2); }
  .ob-sub { color:var(--text-2); font-size:1rem; margin-top:16px; line-height:1.65; }
  .ob-visual { position:relative; height:170px; margin-top:22px; overflow:hidden; border-radius:26px; padding:5px; background:var(--shell); box-shadow:inset 0 0 0 1px var(--hairline), var(--ambient); }
  .ob-visual img { width:100%; height:100%; object-fit:cover; border-radius:21px; display:block; }
  .ob-visual::after { content:''; position:absolute; inset:5px; border-radius:21px; background:linear-gradient(180deg,transparent 45%,rgba(3,8,12,.76)); pointer-events:none; }
  .ob-visual span { position:absolute; z-index:1; left:22px; bottom:16px; color:rgba(238,242,247,.78); font-size:.68rem; font-weight:750; letter-spacing:.16em; text-transform:uppercase; }
  .fine { color:var(--text-3); font-size:.8rem; line-height:1.55; margin-top:14px; }
  .evidence-note { display:flex; gap:12px; margin-top:22px; padding:16px; border-radius:20px; background:rgba(94,234,212,.07); box-shadow:inset 0 0 0 1px rgba(94,234,212,.14); color:var(--text-2); }
  .evidence-note :global(svg) { flex-shrink:0; stroke:var(--acc); }
  .evidence-note p { font-size:.88rem; }
  .evidence-note strong { color:var(--text); }
  .goal-stack, .fit-list { display:grid; gap:10px; margin-top:22px; }
  .goal-card, .fit-item { width:100%; display:flex; align-items:flex-start; gap:13px; padding:17px; border-radius:20px; background:var(--core); box-shadow:inset 0 0 0 1px var(--hairline); text-align:left; transition:transform .35s var(--spring), background .35s var(--spring), box-shadow .35s var(--spring); }
  .goal-card:active, .fit-item:active { transform:scale(.98); }
  .goal-card.selected, .fit-item.selected { background:rgba(94,234,212,.08); box-shadow:inset 0 0 0 1px rgba(94,234,212,.38); }
  .goal-icon { width:42px; height:42px; border-radius:14px; display:grid; place-items:center; flex-shrink:0; background:var(--core-2); }
  .goal-card span:nth-child(2), .fit-item span:nth-child(2) { flex:1; }
  .goal-card strong, .fit-item strong, .pref-row strong { display:block; font-size:.94rem; }
  .goal-card small, .fit-item small, .pref-row small { display:block; color:var(--text-3); font-size:.79rem; line-height:1.45; margin-top:4px; }
  .radio { width:18px; height:18px; border-radius:50%; box-shadow:inset 0 0 0 1px var(--hairline-strong); margin-top:4px; }
  .selected .radio { border:5px solid var(--acc); background:var(--bg); }
  .check-box { width:24px; height:24px; border-radius:8px; display:grid; place-items:center; flex-shrink:0; box-shadow:inset 0 0 0 1px var(--hairline-strong); }
  .selected .check-box { color:#04251f; background:var(--acc); box-shadow:none; }
  .ob-field { display:block; margin-top:16px; }
  .ob-label { display:block; color:var(--text-3); font-size:.7rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:6px; }
  .ob-label span { text-transform:none; letter-spacing:0; font-weight:600; }
  .pref-row { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:15px 0; border-bottom:1px solid var(--hairline); }
  .ob-nav { display:flex; gap:10px; margin-top:28px; }
  @media (max-width:520px) { .onboard { padding-left:18px; padding-right:18px; } .ob-step.compact h1 { font-size:2rem; } }
  @media (prefers-reduced-motion:reduce) { .ob-step { animation:none; } }
</style>
