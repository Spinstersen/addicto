<script>
  import { VALUES } from '../lib/content.js'
  import { setSetting } from '../lib/db.js'
  import { settings } from '../lib/store.svelte.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from './../lib/Icon.svelte'

  let { ondone } = $props()
  let step = $state(0)
  let pickedValues = $state([])
  let reasons = $state('')
  let triggers = $state('')
  let alternatives = $state('')
  let contact = $state('')
  let gate = $state(true)
  let faith = $state(false)

  const steps = [
    { n: 1, t: 'The mechanism', s: '30 seconds that change everything' },
    { n: 2, t: 'Your values', s: 'What this is really for' },
    { n: 3, t: 'Your anchor', s: 'One line for the hard moments' },
    { n: 4, t: 'Your crisis plan', s: 'Decisions written while calm' },
    { n: 5, t: 'Your defenses', s: 'Set the friction' }
  ]

  function toggleValue(id) {
    if (pickedValues.includes(id)) pickedValues = pickedValues.filter((v) => v !== id)
    else if (pickedValues.length < 3) pickedValues = [...pickedValues, id]
  }

  async function next() {
    if (step === 4) {
      settings.values = pickedValues
      settings.reasons = reasons.trim()
      settings.crisis = {
        topTriggers: triggers.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4),
        topAlternatives: alternatives.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4),
        contact: contact.trim()
      }
      settings.gateEnabled = gate
      settings.faithMode = faith
      await setSetting('values', settings.values)
      await setSetting('reasons', settings.reasons)
      await setSetting('crisis', settings.crisis)
      await setSetting('gateEnabled', gate)
      await setSetting('faithMode', faith)
      await setSetting('onboardingDone', true)
      ondone()
      return
    }
    step++
  }

  function back() {
    if (step > 0) step--
  }
</script>

<div class="onboard">
  <div class="ob-progress">
    {#each steps as s, i (i)}
      <span class="ob-bar" class:on={i <= step} class:done={i < step}></span>
    {/each}
  </div>

  {#if step === 0}
    <div class="ob-step">
      <div class="big-glyph"><Icon name="wave" size={30} /></div>
      <h1>{t('This is a dopamine calibration problem, not a character flaw.')}</h1>
      <p class="ob-sub">
        {t('The ADHD brain runs blunted reward response and a weaker brake — and porn is a supranormal stimulus engineered for exactly that gap. That is why willpower and shame fail you, and why environment and skills work.')}
      </p>
      <p class="ob-sub muted">
        {t('Addicto uses the methods with real evidence behind them — the RCT-tested Hands-Off program, SMART Recovery\'s tools, and DBT distress-tolerance skills. Every button does something with a reason.')}
      </p>
    </div>
  {:else if step === 1}
    <div class="ob-step">
      <div class="big-glyph"><Icon name="award" size={30} /></div>
      <h1>{t('What is this actually for?')}</h1>
      <p class="ob-sub muted">{t('Pick up to three. Your values are the motivation that survives contact with cravings — generic goals don\'t.')}</p>
      <div class="pill-grid" style="margin-top:18px;">
        {#each VALUES as v (v.id)}
          <button class="choice-pill" class:selected={pickedValues.includes(v.id)} onclick={() => toggleValue(v.id)}>
            {t(v.label)}
          </button>
        {/each}
      </div>
    </div>
  {:else if step === 2}
    <div class="ob-step">
      <div class="big-glyph"><Icon name="star" size={30} /></div>
      <h1>{t('Write your anchor')}</h1>
      <p class="ob-sub muted">
        {t('At the peak of an urge you can\'t remember a paragraph — you can remember one sentence. This appears in the panic moment, pre-loaded.')}
      </p>
      <textarea class="field" style="margin-top:18px;" bind:value={reasons} placeholder={t('e.g. I want my energy and focus back for the things I actually care about.')}></textarea>
    </div>
  {:else if step === 3}
    <div class="ob-step">
      <div class="big-glyph"><Icon name="shield" size={30} /></div>
      <h1>{t('Write the plan while you\'re calm')}</h1>
      <p class="ob-sub muted">{t('Because mid-craving, your executive function is offline. Future-you needs these decisions made.')}</p>
      <div class="ob-field">
        <span class="ob-label">{t('Top triggers')} <span class="faint">{t('(comma-separated)')}</span></span>
        <input class="field" bind:value={triggers} placeholder={t('late night, alone in bed, after stress')} />
      </div>
      <div class="ob-field">
        <span class="ob-label">{t('Best alternatives')} <span class="faint">{t('(comma-separated)')}</span></span>
        <input class="field" bind:value={alternatives} placeholder={t('leave room, cold water, push-ups, text a friend')} />
      </div>
      <div class="ob-field">
        <span class="ob-label">{t('One person to contact')} <span class="faint">{t('(optional)')}</span></span>
        <input class="field" bind:value={contact} placeholder={t('name of someone you trust')} />
      </div>
    </div>
  {:else}
    <div class="ob-step">
      <div class="big-glyph"><Icon name="lock" size={30} /></div>
      <h1>{t('Set your defenses')}</h1>
      <p class="ob-sub muted">
        {t('Environment beats willpower — the prefrontal brake is the system that\'s already taxed.')}
      </p>
      <div class="shell flat" style="margin-top:18px;">
        <div class="core" style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
          <div>
            <div style="font-weight:700;">{t('Daily check-in gate')}</div>
            <div class="faint" style="font-size:0.85rem;">{t('Opening the app asks for a 10-second check-in first.')}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" checked={gate} onchange={() => (gate = !gate)} />
            <span class="track"></span>
          </label>
        </div>
      </div>
      <div class="shell flat" style="margin-top:10px;">
        <div class="core" style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
          <div>
            <div style="font-weight:700;">{t('Faith mode')} <span class="tag vio" style="margin-left:4px;">{t('optional')}</span></div>
            <div class="faint" style="font-size:0.85rem;">{t('Duas + Quran verses in the panic moment. Off by default.')}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" checked={faith} onchange={() => (faith = !faith)} />
            <span class="track"></span>
          </label>
        </div>
      </div>
      <p class="ob-sub muted" style="margin-top:12px;">
        {t('In Settings you can also generate a blocklist that blocks porn sites system-wide on this device — Android, iPhone and Windows guides included.')}
      </p>
    </div>
  {/if}

  <div class="ob-nav">
    {#if step > 0}
      <button class="btn btn-soft btn-sm" onclick={back}>{t('Back')}</button>
    {/if}
    <button class="btn btn-primary grow" onclick={next}>
      {step === 4 ? t('Begin') : t('Continue')}
      <span class="arrow"><Icon name="arrow" size={15} /></span>
    </button>
  </div>
</div>

<style>
  .onboard {
    min-height: 100vh;
    min-height: 100dvh;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 22px calc(24px + var(--safe-bottom));
    display: flex;
    flex-direction: column;
  }
  .ob-progress {
    display: flex;
    gap: 6px;
    margin-bottom: 28px;
  }
  .ob-bar {
    flex: 1;
    height: 3px;
    border-radius: 3px;
    background: var(--core-2);
    transition: background 0.4s var(--spring);
  }
  .ob-bar.on { background: var(--acc); box-shadow: 0 0 12px var(--acc-glow); }
  .ob-bar.done { background: var(--text-4); }
  .ob-step {
    flex: 1;
    animation: ob-in 0.5s var(--spring) both;
  }
  @keyframes ob-in {
    from { opacity: 0; transform: translateX(18px); filter: blur(4px); }
    to { opacity: 1; transform: none; filter: blur(0); }
  }
  .ob-step h1 {
    font-size: 2rem;
    line-height: 1.12;
    letter-spacing: -0.03em;
    margin: 16px 0 12px;
  }
  .acc-text {
    background: linear-gradient(90deg, var(--acc), var(--vio));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .ob-sub {
    color: var(--text-2);
    font-size: 0.98rem;
    margin-bottom: 12px;
  }
  .ob-sub em { color: var(--text); font-style: normal; font-weight: 600; }
  .ob-field { margin-top: 14px; }
  .ob-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 2px;
  }
  .ob-nav {
    display: flex;
    gap: 10px;
    margin-top: 28px;
  }
</style>
