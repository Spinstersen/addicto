<script>
  import { PRACTICE_TEMPLATES, PRACTICE_ICON_CHOICES, GRATITUDE_PROMPTS } from '../lib/content.js'
  import { setPractices, addPractice, updatePractice, deletePractice, setDaily, getPractices } from '../lib/db.js'
  import { load, data, practicesProgress, practicesDoneToday, gratitudeToday, practiceStreak, todayKey } from '../lib/store.svelte.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go } = $props()

  let editMode = $state(false)
  let emptyStarted = $state(false)
  let newPractice = $state('')
  let newPracticeIcon = $state('bolt')
  let gratitudeInput = $state('')

  const R = 34
  const CIRC = 2 * Math.PI * R
  const prog = $derived(practicesProgress())
  const done = $derived(practicesDoneToday())
  const gratitude = $derived(gratitudeToday())

  async function pickTemplate(t) {
    await setPractices(t.items.map((i) => ({ name: i.name, icon: i.icon })))
    emptyStarted = false
    editMode = false
    await load()
    vibrate([40, 30, 40])
  }

  function startEmpty() {
    emptyStarted = true
    editMode = true
  }

  function backToTemplates() {
    emptyStarted = false
    editMode = false
  }

  async function resetToTemplates() {
    await setPractices([])
    emptyStarted = false
    editMode = false
    await load()
  }

  async function togglePractice(p) {
    const set = new Set(done)
    if (set.has(p.id)) set.delete(p.id)
    else set.add(p.id)
    await setDaily(todayKey(), { practices: [...set] })
    vibrate(set.has(p.id) ? 40 : 20)
    await load()
  }

  async function addPracticeItem() {
    const name = newPractice.trim()
    if (!name) return
    await addPractice(name, newPracticeIcon)
    newPractice = ''
    await load()
  }

  async function rename(p, name) {
    if (!name.trim()) return
    await updatePractice(p.id, { name: name.trim() })
    await load()
  }

  async function remove(p) {
    await deletePractice(p.id)
    await load()
  }

  async function move(p, dir) {
    const list = [...data.practices]
    const i = list.findIndex((x) => x.id === p.id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    await setPractices(list.map((x) => ({ name: x.name, icon: x.icon })))
    await load()
  }

  async function addGratitude() {
    const item = gratitudeInput.trim()
    if (!item) return
    const list = [...gratitude, item]
    await setDaily(todayKey(), { gratitude: list })
    gratitudeInput = ''
    vibrate(30)
    await load()
  }

  async function removeGratitude(i) {
    const list = [...gratitude]
    list.splice(i, 1)
    await setDaily(todayKey(), { gratitude: list })
    await load()
  }

  const isCba = (name) => /cba|cost/i.test(name)
</script>

<ScreenHeader eyebrow={prog.total ? `${t('Practice streak')} · ${practiceStreak()}` : t('your routine')} title={t('Daily practices.')} {go} />

{#if data.practices.length === 0 && !emptyStarted}
  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Build your day')}</div>
      <p class="body" style="margin-bottom:16px;">
        {t('Your recovery works better as a daily ritual than as a series of reactions. Pick a template — or start empty and add your own practices.')}
      </p>
      {#each Object.values(PRACTICE_TEMPLATES) as tp (tp.id)}
        <div class="shell flat" style="margin-bottom:12px;">
          <div class="core" style="padding:18px;">
            <div class="row" style="justify-content:space-between; margin-bottom:8px;">
              <div class="row">
                <span class="tipp-ic"><Icon name={tp.icon} size={20} /></span>
                <div>
                  <div style="font-weight:700;">{t(tp.label)}</div>
                  <div class="faint" style="font-size:0.8rem;">{t(tp.desc)}</div>
                </div>
              </div>
            </div>
            <div class="pill-grid" style="margin-bottom:12px;">
              {#each tp.items as it (it.name)}
                <span class="tag">{t(it.name)}</span>
              {/each}
            </div>
            <button class="btn btn-primary btn-block" onclick={() => pickTemplate(tp)}>
              {t('Use this template')} <span class="arrow"><Icon name="arrow" size={14} /></span>
            </button>
          </div>
        </div>
      {/each}
      <button class="btn btn-ghost btn-block" onclick={startEmpty}>
        <Icon name="edit" size={16} /> {t('Start from scratch')}
      </button>
    </div>
  </div>
{:else}
  {#if data.practices.length === 0}
    <div class="shell" style="border-color: rgba(94,234,212,0.25);">
      <div class="core center">
        <div class="big-glyph"><Icon name="edit" size={30} /></div>
        <p style="font-weight:700; font-size:1.1rem;">{t('Build it your way.')}</p>
        <p class="muted" style="font-size:0.9rem; margin-top:6px;">{t('Add your first practice below — a few small daily rituals are plenty.')}</p>
        <button class="btn btn-soft btn-sm" style="margin-top:14px;" onclick={backToTemplates}>
          <Icon name="book" size={14} /> {t('Choose a template instead')}
        </button>
      </div>
    </div>
  {/if}

  <div class="shell" style="border-color: rgba(94,234,212,0.25);">
    <div class="core" style="display:flex; align-items:center; gap:18px;">
      <div class="ring-wrap">
        <svg width="84" height="84" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={R} fill="none" stroke="var(--core-2)" stroke-width="7" />
          <circle
            cx="42" cy="42" r={R} fill="none"
            stroke="url(#g)" stroke-width="7" stroke-linecap="round"
            stroke-dasharray={CIRC}
            stroke-dashoffset={CIRC * (1 - prog.pct)}
            transform="rotate(-90 42 42)"
            style="transition: stroke-dashoffset 0.6s var(--spring);"
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#5eead4" />
              <stop offset="1" stop-color="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <span class="ring-label">{prog.done}/{prog.total}</span>
      </div>
      <div class="grow">
        <div style="font-weight:800; font-size:1.15rem;">{prog.total === 0 ? t('Add your rituals') : prog.done === prog.total ? t('Day complete ✦') : `${prog.done} ${t('of')} ${prog.total} ${t('done')}`}</div>
        <div class="muted" style="font-size:0.88rem;">{practiceStreak()} {t('day')} {t('streak')} · {t('ritual, not reaction.')}</div>
        <button class="btn btn-soft btn-sm" style="margin-top:10px;" onclick={() => (editMode = !editMode)}>
          <Icon name="edit" size={14} /> {editMode ? t('Done editing') : t('Edit routine')}
        </button>
      </div>
    </div>
  </div>

  <div class="shell">
    <div class="core" style="padding: 10px 18px;">
      {#each data.practices as p (p.id)}
        <div class="prac-row">
          <button
            class="prac-check" class:on={done.has(p.id)}
            onclick={() => togglePractice(p)}
            aria-label={t('toggle') + ' ' + t(p.name)}
          >
            {#if done.has(p.id)}<Icon name="check" size={16} />{/if}
          </button>

          {#if editMode}
            <input class="prac-edit" value={p.name} onchange={(e) => rename(p, e.currentTarget.value)} onblur={(e) => rename(p, e.currentTarget.value)} />
            <button class="hd-btn" style="width:38px;height:38px;" onclick={() => move(p, -1)} aria-label={t('move up')}><Icon name="chev" size={16} style="transform:rotate(90deg)" /></button>
            <button class="hd-btn" style="width:38px;height:38px;" onclick={() => move(p, 1)} aria-label={t('move down')}><Icon name="chev" size={16} style="transform:rotate(-90deg)" /></button>
            <button class="hd-btn" style="width:38px;height:38px; border-color:rgba(251,113,133,0.3);" onclick={() => remove(p)} aria-label={t('Remove')}><Icon name="trash" size={16} style="stroke:var(--danger)" /></button>
          {:else}
            <span class="prac-name">
              <span class="prac-ic"><Icon name={p.icon || 'bolt'} size={17} /></span>
              {t(p.name)}
            </span>
            {#if isCba(p.name)}
              <button class="btn btn-soft btn-sm" onclick={() => go('cba')}>
                <Icon name="chart" size={14} /> {t('Open CBA')}
              </button>
            {/if}
          {/if}
        </div>
      {/each}

      {#if editMode}
        <div class="divider"></div>
        <div class="label-block">{t('Add a practice')}</div>
        <div class="row">
          <input class="field" style="flex:1; margin:0;" bind:value={newPractice} placeholder={t('e.g. 20 push-ups')} onkeydown={(e) => e.key === 'Enter' && addPracticeItem()} />
          <button class="btn btn-primary btn-sm" onclick={addPracticeItem}><Icon name="plus" size={15} /></button>
        </div>
        <div class="pill-grid" style="margin-top:10px;">
          {#each PRACTICE_ICON_CHOICES as c (c.id)}
            <button class="choice-pill" class:selected={newPracticeIcon === c.id} onclick={() => (newPracticeIcon = c.id)}>{t(c.label)}</button>
          {/each}
        </div>
        <button class="btn btn-soft btn-block btn-sm" style="margin-top:12px;" onclick={resetToTemplates}>
          <Icon name="book" size={14} /> {t('Replace with a template')}
        </button>
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Gratitude list')}</div>
      <p class="faint" style="font-size:0.82rem; margin-bottom:10px;">{t('Gratitude trains the reward system to notice real life again. Write three things.')}</p>
      {#each gratitude as g, i (i)}
        <div class="list-item" style="padding-top:8px;">
          <span>✦ {g}</span>
          <button class="hd-btn" style="width:34px;height:34px;" onclick={() => removeGratitude(i)} aria-label={t('Remove')}><Icon name="x" size={14} /></button>
        </div>
      {/each}
      {#if gratitude.length < 3}
        <div class="row" style="margin-top:8px;">
          <input class="field" style="flex:1; margin:0;" bind:value={gratitudeInput} placeholder={t(GRATITUDE_PROMPTS[gratitude.length] || 'Keep going…')} onkeydown={(e) => e.key === 'Enter' && addGratitude()} />
          <button class="btn btn-primary btn-sm" onclick={addGratitude}><Icon name="plus" size={15} /></button>
        </div>
      {/if}
    </div>
  </div>

  <div class="callout vio">
    <Icon name="chart" size={20} />
    <div><strong>{t('Why you\'re doing this:')}</strong> {t('rituals turn recovery from a daily decision into a default. The CBA sheet is the reminder of the cost side — open it when the checklist feels heavy.')}</div>
  </div>
{/if}

<style>
  .ring-wrap { position: relative; width: 84px; height: 84px; flex-shrink: 0; }
  .ring-wrap svg { width: 84px; height: 84px; }
  .ring-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 1rem;
  }
  .prac-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--hairline);
  }
  .prac-row:last-child { border-bottom: none; }
  .prac-check {
    width: 30px; height: 30px; border-radius: 50%;
    border: 2px solid var(--hairline-strong);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s var(--spring);
  }
  .prac-check.on {
    background: linear-gradient(135deg, #6ee7da, #34d399);
    border-color: transparent; color: #04251f;
  }
  .prac-name {
    flex: 1; display: flex; align-items: center; gap: 10px;
    font-weight: 600; font-size: 0.95rem;
  }
  .prac-ic {
    width: 34px; height: 34px; border-radius: 11px;
    background: var(--core-2); border: 1px solid var(--hairline);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .prac-ic :global(svg) { stroke: var(--acc); }
  .prac-edit {
    flex: 1; background: var(--core); border: 1px solid var(--hairline-strong);
    border-radius: 10px; padding: 10px 12px; color: var(--text);
  }
  .tipp-ic {
    width: 40px; height: 40px; border-radius: 13px;
    background: linear-gradient(160deg, rgba(94,234,212,0.14), rgba(94,234,212,0.03));
    border: 1px solid rgba(94,234,212,0.22);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tipp-ic :global(svg) { stroke: var(--acc); }
  .label-block {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-3);
    margin: 10px 0 4px;
  }
</style>
