<script>
  import { onMount, onDestroy } from 'svelte'
  import { PROGRAM, VALUES, SELF_COMPASSION, BLOCKED_DOMAINS_DEFAULT } from '../lib/content.js'
  import { markWeekDone, isWeekDone, getSetting, setSetting } from '../lib/db.js'
  import { settings } from '../lib/store.svelte.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go, onpanic } = $props()

  let openWeek = $state(null)
  let doneWeeks = $state(new Set())
  let completedLessons = $state({}) // "week:idx" -> true

  let notes = $state({})
  let thought = $state({})
  let afterText = $state('')
  let commitSlip = $state(false)
  let pickedValues = $state([])
  let anchorDraft = $state('')
  let triggerDraft = $state({})
  let ifThen = $state({})
  let reflectDraft = $state({})
  let flash = $state('')
  let timer = $state({ running: false, left: 0 })
  let timerTick = null

  const LESSONS_KEY = 'lessonsDone'

  onMount(async () => {
    const stored = await getSetting(LESSONS_KEY, '{}')
    const flat = {}
    try {
      const obj = JSON.parse(stored)
      for (const [week, idxs] of Object.entries(obj)) {
        for (const i of idxs) flat[`${week}:${i}`] = true
      }
    } catch {
      /* no stored lessons */
    }
    completedLessons = flat
    for (const w of PROGRAM) {
      if (await isWeekDone(w.week)) doneWeeks.add(w.week)
    }
    notes = await getSetting('lessonNotes', {})
    thought = await getSetting('thoughtRecord', {})
    afterText = await getSetting('after', '')
    commitSlip = await getSetting('commitSlip', false)
    pickedValues = [...(settings.values || [])]
    anchorDraft = settings.reasons || ''
  })

  onDestroy(() => clearInterval(timerTick))

  function flashMsg(msg) {
    flash = msg
    setTimeout(() => (flash = ''), 2200)
  }

  async function markLesson(week, idx) {
    const key = `${week}:${idx}`
    completedLessons = { ...completedLessons, [key]: !completedLessons[key] }
    vibrate(30)
    await persistLessons()
  }

  async function persistLessons() {
    const obj = {}
    for (const [key, done] of Object.entries(completedLessons)) {
      if (!done) continue
      const [week, idx] = key.split(':')
      obj[week] = obj[week] || []
      obj[week].push(Number(idx))
    }
    await setSetting(LESSONS_KEY, JSON.stringify(obj))
  }

  async function toggleWeekDone(week) {
    if (doneWeeks.has(week)) return
    doneWeeks.add(week)
    await markWeekDone(week)
    vibrate([60, 40, 60])
  }

  const weekProgress = (week) => {
    const lesson = PROGRAM.find((w) => w.week === week)
    const done = Object.keys(completedLessons).filter((k) => k.startsWith(`${week}:`) && completedLessons[k]).length
    return Math.min(1, done / lesson.lessons.length)
  }

  const overallPct = $derived(
    Math.round((PROGRAM.reduce((a, w) => a + weekProgress(w.week), 0) / PROGRAM.length) * 100)
  )

  // ——— interactive widgets ———
  async function saveNote(key, field, value) {
    notes[key] = { ...(notes[key] || {}), [field]: value }
    await setSetting('lessonNotes', notes)
  }

  async function saveAnchor() {
    await setSetting('reasons', anchorDraft)
    settings.reasons = anchorDraft
    flashMsg(t('Saved ✓'))
  }

  async function toggleValue(id) {
    if (pickedValues.includes(id)) pickedValues = pickedValues.filter((v) => v !== id)
    else if (pickedValues.length < 3) pickedValues = [...pickedValues, id]
    await setSetting('values', pickedValues)
    settings.values = pickedValues
  }

  async function addTrigger(key) {
    const v = (triggerDraft[key] || '').trim()
    if (!v) return
    const list = [...settings.crisis.topTriggers]
    if (!list.includes(v)) list.push(v)
    settings.crisis.topTriggers = list
    await setSetting('crisis', settings.crisis)
    triggerDraft[key] = ''
    flashMsg(t('Saved ✓'))
  }

  async function addIfThen(key) {
    const trig = (ifThen[key + '_t'] || '').trim()
    const act = (ifThen[key + '_a'] || '').trim()
    if (!trig || !act) return
    const tList = [...settings.crisis.topTriggers]
    const aList = [...settings.crisis.topAlternatives]
    if (!tList.includes(trig)) tList.push(trig)
    if (!aList.includes(act)) aList.push(act)
    settings.crisis.topTriggers = tList
    settings.crisis.topAlternatives = aList
    await setSetting('crisis', settings.crisis)
    ifThen[key + '_t'] = ''
    ifThen[key + '_a'] = ''
    flashMsg(t('Saved ✓'))
  }

  async function toggleGate() {
    settings.gateEnabled = !settings.gateEnabled
    await setSetting('gateEnabled', settings.gateEnabled)
    flashMsg(t('Saved ✓'))
  }

  async function copyBlocklist() {
    await navigator.clipboard.writeText(BLOCKED_DOMAINS_DEFAULT.join('\n'))
    flashMsg(t('Copied'))
  }

  async function saveThought() {
    await setSetting('thoughtRecord', { ...thought })
    flashMsg(t('Saved ✓'))
  }

  async function saveCommit() {
    await setSetting('commitSlip', commitSlip)
    flashMsg(t('Saved ✓'))
  }

  async function saveAfter() {
    await setSetting('after', afterText)
    flashMsg(t('Saved ✓'))
  }

  function startTimer() {
    if (timerTick) clearInterval(timerTick)
    timer = { running: true, left: 600 }
    timerTick = setInterval(() => {
      if (timer.left <= 1) {
        clearInterval(timerTick)
        timer = { running: false, left: 0 }
        vibrate([100, 50, 100])
        return
      }
      timer = { running: true, left: timer.left - 1 }
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerTick)
    timer = { running: false, left: 0 }
  }

  const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
</script>

<div class="screen">
  {#snippet pctBadge()}
    <span class="eyebrow on"><Icon name="book" size={14} />{overallPct}%</span>
  {/snippet}

  <ScreenHeader eyebrow={t('6 weeks · ~10 min each')} title={t('The rewiring course.')} {go} right={pctBadge} />

  {#if flash}
    <div class="callout acc" style="margin-bottom:12px;"><Icon name="check" size={18} /><div>{flash}</div></div>
  {/if}

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('How it works')}</div>
      <p class="body" style="font-size:0.9rem;">
        {t('Six weeks. Each week has three short steps that build on the last. Every step explains the idea in plain language, then gives you a thing to actually do — right here in the app.')}
      </p>
      <div class="progress" style="margin-top:14px;"><div style="width:{overallPct}%;"></div></div>
      <div class="faint" style="font-size:0.74rem; margin-top:6px;">{t('The trial\'s finding: people who finished saw the biggest reductions. Finishing is the whole game.')}</div>
    </div>
  </div>

  {#each PROGRAM as w (w.week)}
    <div class="shell">
      <div class="core" style="padding: 18px;">
        <button class="acc-head" onclick={() => (openWeek = openWeek === w.week ? null : w.week)}>
          <div class="row" style="gap:12px;">
            <span class="week-badge" class:done={doneWeeks.has(w.week)}>
              {#if doneWeeks.has(w.week)}<Icon name="check" size={16} />{:else}{w.week}{/if}
            </span>
            <div>
              <div style="font-weight:700; font-size:1.02rem;">{t(w.title)}</div>
              <div class="faint" style="font-size:0.78rem;">{w.minutes} · {w.methods.map((m) => t(m)).join(' · ')}</div>
            </div>
          </div>
          <span class="chev" class:open={openWeek === w.week}><Icon name="chev" size={16} /></span>
        </button>

        <div class="goal-line">
          <Icon name="target" size={16} />
          <span>{t(w.goal)}</span>
        </div>

        <div class="progress" style="margin:10px 0 0;"><div style="width:{weekProgress(w.week) * 100}%;"></div></div>

        {#if openWeek === w.week}
          {#each w.lessons as lesson, i (i)}
            {@const key = `w${w.week}l${i}`}
            <div class="lesson" class:done={completedLessons[`${w.week}:${i}`]}>
              <div class="lesson-top">
                <span class="lesson-num">{i + 1}</span>
                <div class="grow">
                  <div class="lesson-title">{t(lesson.title)}</div>
                  <div class="lesson-summary">{t(lesson.summary)}</div>
                </div>
                <button
                  class="mark-btn" class:on={completedLessons[`${w.week}:${i}`]}
                  onclick={() => markLesson(w.week, i)}
                  aria-label={t('Mark lesson done')}
                >
                  {#if completedLessons[`${w.week}:${i}`]}<Icon name="check" size={15} />{:else}<span></span>{/if}
                </button>
              </div>

              <div class="idea-block">
                <div class="label-inline">{t('The idea')}</div>
                <p class="muted" style="font-size:0.9rem; margin-top:4px;">{t(lesson.text)}</p>
              </div>

              <div class="doitnow">
                <div class="label-inline" style="color: var(--acc);">{t('Do it now')}</div>

                {#if lesson.type === 'cba'}
                  <button class="btn btn-primary btn-block" onclick={() => go('cba')}>
                    <Icon name="chart" size={17} /> {t('Open the CBA sheet')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('The CBA sheet is the decisional balance — your costs on paper.')}</p>
                {:else if lesson.type === 'values'}
                  <div class="pill-grid" style="margin-bottom:8px;">
                    {#each VALUES as v (v.id)}
                      <button class="choice-pill" class:selected={pickedValues.includes(v.id)} onclick={() => toggleValue(v.id)}>{t(v.label)}</button>
                    {/each}
                  </div>
                  <p class="faint" style="font-size:0.8rem;">{t('Pick up to 3')} · {t('Your answers stay on this device.')}</p>
                {:else if lesson.type === 'anchor'}
                  <textarea class="field" bind:value={anchorDraft} placeholder={t('Write it here…')}></textarea>
                  <button class="btn btn-primary btn-block" onclick={saveAnchor}>
                    <Icon name="check" size={17} /> {t('Save')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('This sentence appears in the panic moment.')}</p>
                {:else if lesson.type === 'trigger'}
                  <input class="field" bind:value={triggerDraft[key]} placeholder={t('Name a trigger')} onkeydown={(e) => e.key === 'Enter' && addTrigger(key)} />
                  <button class="btn btn-primary btn-block" onclick={() => addTrigger(key)}>
                    <Icon name="plus" size={16} /> {t('Add to my plan')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Saved triggers show up in your crisis plan and the panic moment.')}</p>
                {:else if lesson.type === 'halt' || lesson.type === 'sleep' || lesson.type === 'exercise'}
                  <button class="btn btn-primary btn-block" onclick={() => go('checkin')}>
                    <Icon name="wave" size={17} /> {t('Log a check-in now')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('The check-in logs the feeling and the sleep/movement levers in ten seconds.')}</p>
                {:else if lesson.type === 'gate'}
                  <div class="row" style="gap:8px;">
                    <button class="btn btn-ghost btn-block" onclick={toggleGate}>
                      <Icon name="lock" size={16} /> {t('Turn on the daily gate')} {settings.gateEnabled ? '· ✓' : ''}
                    </button>
                  </div>
                  <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={copyBlocklist}>
                    <Icon name="copy" size={16} /> {t('Copy the blocklist')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Friction beats willpower. The gate asks for a check-in; the blocklist blocks known sites.')}</p>
                {:else if lesson.type === 'ifthen'}
                  <input class="field" bind:value={ifThen[key + '_t']} placeholder={t('IF (trigger)')} />
                  <input class="field" bind:value={ifThen[key + '_a']} placeholder={t('THEN (action)')} />
                  <button class="btn btn-primary btn-block" onclick={() => addIfThen(key)}>
                    <Icon name="plus" size={16} /> {t('Add to my plan')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Example: IF alone in bed at 11pm, THEN I move to the kitchen.')}</p>
                {:else if lesson.type === 'ten'}
                  {#if timer.running}
                    <div class="center" style="padding: 8px 0;">
                      <div class="hero-num" style="font-size:2.6rem; color:var(--text); -webkit-text-fill-color:var(--text);">{mmss(timer.left)}</div>
                      <button class="btn btn-soft btn-sm" style="margin-top:6px;" onclick={stopTimer}>{t('Stop')}</button>
                    </div>
                  {:else}
                    <div class="row" style="gap:8px;">
                      <button class="btn btn-primary btn-block" onclick={startTimer}>
                        <Icon name="clock" size={16} /> {t('Start a 10-minute timer')}
                      </button>
                    </div>
                  {/if}
                  <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={() => go('activities')}>
                    <Icon name="target" size={16} /> {t('Open replacement activities')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Ride the wave: 10 minutes of a substitute activity and most urges pass.')}</p>
                {:else if lesson.type === 'reflect'}
                  <textarea class="field" bind:value={reflectDraft[key]} placeholder={t('Write it here…')} onblur={() => saveNote(key, 'reflect', reflectDraft[key])}></textarea>
                  <p class="faint" style="font-size:0.8rem;">{t('What was it doing for you — escape, stimulation, numbing? Name it.')}</p>
                {:else if lesson.type === 'activities'}
                  <button class="btn btn-primary btn-block" onclick={() => go('activities')}>
                    <Icon name="target" size={17} /> {t('Open replacement activities')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Pick one Novelty and one Master activity this week.')}</p>
                {:else if lesson.type === 'thought'}
                  <div class="field-stack">
                    <div class="label-inline">{t('Situation')}</div>
                    <input class="field" bind:value={thought.situation} placeholder={t('Write it here…')} />
                    <div class="label-inline">{t('Automatic thought')}</div>
                    <input class="field" bind:value={thought.auto} placeholder={t('Write it here…')} />
                    <div class="label-inline">{t('Evidence against it')}</div>
                    <input class="field" bind:value={thought.evidence} placeholder={t('Write it here…')} />
                    <div class="label-inline">{t('Balanced thought')}</div>
                    <input class="field" bind:value={thought.balanced} placeholder={t('Write it here…')} />
                  </div>
                  <button class="btn btn-primary btn-block" onclick={saveThought}>
                    <Icon name="check" size={17} /> {t('Check the thought')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('The balanced thought only needs to be true enough to buy ten minutes.')}</p>
                {:else if lesson.type === 'selfcompassion'}
                  <div class="callout acc" style="margin-bottom:8px;">
                    <Icon name="heart" size={18} />
                    <div>{t(SELF_COMPASSION[0])}</div>
                  </div>
                  <button class="btn btn-soft btn-block" onclick={() => onpanic()}>
                    <Icon name="wave" size={16} /> {t('Try the panic flow')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Compassion is the tool. Shame just switches off the system you need.')}</p>
                {:else if lesson.type === 'commit'}
                  <div class="list-item" style="padding-top:4px;">
                    <div class="grow">
                      <div class="l-label">{t('I commit: slip → log it → continue')}</div>
                      <div class="l-sub">{t('No spiral, no restart-from-zero.')}</div>
                    </div>
                    <label class="toggle"><input type="checkbox" checked={commitSlip} onchange={() => { commitSlip = !commitSlip; saveCommit() }} /><span class="track"></span></label>
                  </div>
                {:else if lesson.type === 'crisis'}
                  <button class="btn btn-primary btn-block" onclick={() => go('settings')}>
                    <Icon name="shield" size={17} /> {t('Open your crisis plan')}
                  </button>
                  <p class="faint" style="font-size:0.8rem; margin-top:8px;">{t('Write it while calm — it shows up in the panic moment.')}</p>
                {:else if lesson.type === 'after'}
                  <textarea class="field" bind:value={afterText} placeholder={t('3 things I will do with my time')}></textarea>
                  <button class="btn btn-primary btn-block" onclick={saveAfter}>
                    <Icon name="check" size={17} /> {t('Save')}
                  </button>
                {/if}
              </div>
            </div>
          {/each}

          {#if weekProgress(w.week) === 1 && !doneWeeks.has(w.week)}
            <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick={() => toggleWeekDone(w.week)}>
              <Icon name="check" size={17} /> {t('Complete week')} {w.week}
            </button>
          {/if}
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .week-badge {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--core-2);
    border: 1px solid var(--hairline-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: var(--text-2);
    flex-shrink: 0;
  }
  .week-badge.done {
    background: rgba(94, 234, 212, 0.12);
    border-color: rgba(94, 234, 212, 0.35);
    color: var(--acc);
  }
  .goal-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--acc);
  }
  .goal-line :global(svg) { stroke: var(--acc); }
  .chev {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--core-2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.4s var(--spring);
    flex-shrink: 0;
  }
  .chev :global(svg) { stroke: var(--text-2); }
  .chev.open { transform: rotate(180deg); }
  .lesson {
    padding: 16px 0 6px;
    margin-top: 14px;
    border-top: 1px solid var(--hairline);
  }
  .lesson-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .lesson-num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--core-2);
    border: 1px solid var(--hairline-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.85rem;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .lesson-title {
    font-weight: 700;
    font-size: 1rem;
  }
  .lesson-summary {
    color: var(--text-2);
    font-size: 0.88rem;
    margin-top: 3px;
  }
  .mark-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid var(--hairline-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    transition: all 0.3s var(--spring);
  }
  .mark-btn.on {
    background: linear-gradient(135deg, #6ee7da, #34d399);
    border-color: transparent;
    color: #04251f;
  }
  .mark-btn span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-4); }
  .idea-block {
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: var(--r-sm);
    background: var(--core);
    border: 1px solid var(--hairline);
  }
  .label-inline {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
    margin: 12px 0 4px;
  }
  .doitnow { margin-top: 2px; }
  .doitnow .label-inline { margin-top: 12px; }
  .field-stack .field { margin: 4px 0 10px; }
</style>
