<script>
  import { CBA_QUADRANTS } from '../lib/content.js'
  import { setCba } from '../lib/db.js'
  import { load, data } from '../lib/store.svelte.js'
  import { vibrate } from '../lib/helpers.js'
  import { t } from '../lib/i18n.svelte.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go } = $props()
  let drafts = $state({})

  const ACCENT = { prosUse: 'warn', consUse: 'danger', prosQuit: 'acc', consQuit: 'vio' }

  function init() {
    const base = {}
    for (const q of CBA_QUADRANTS) base[q.key] = []
    drafts = { ...base, ...(data.cba || {}) }
    for (const q of CBA_QUADRANTS) if (!Array.isArray(drafts[q.key])) drafts[q.key] = []
  }
  init()

  function addLine(key) {
    const value = drafts[key + '_input'] || ''
    if (!value.trim()) return
    drafts[key] = [...drafts[key], value.trim()]
    drafts[key + '_input'] = ''
    vibrate(25)
  }

  function removeLine(key, i) {
    drafts[key].splice(i, 1)
    drafts = { ...drafts }
  }

  async function save() {
    const clean = {}
    for (const q of CBA_QUADRANTS) clean[q.key] = [...(drafts[q.key] || [])]
    await setCba(clean)
    await load()
    vibrate([40, 30, 40])
    go('home')
  }
</script>

<ScreenHeader eyebrow={t('SMART cost-benefit analysis')} title={t('The honest sheet.')} {go} back="practices" />

<div class="shell">
  <div class="core">
    <p class="body" style="font-size:0.92rem;">
      {t('You got something out of this behavior — otherwise you wouldn\'t have done it. Write that down honestly.')}
      {t('This sheet is your pre-written argument against the urge, built while you\'re calm.')}
    </p>
  </div>
</div>

{#each CBA_QUADRANTS as q (q.key)}
  <div class="shell">
    <div class="core" style="padding:18px;">
      <div class="row" style="justify-content:space-between; margin-bottom:4px;">
        <div style="font-weight:800; font-size:1.05rem;">{t(q.title)}</div>
        <span class="tag {ACCENT[q.key]}">{drafts[q.key].length}</span>
      </div>
      <p class="faint" style="font-size:0.82rem; margin-bottom:10px;">{t(q.hint)}</p>
      {#each drafts[q.key] as line, i (q.key + i)}
        <div class="list-item" style="padding-top:8px;">
          <span style="font-size:0.92rem;">{line}</span>
          <button class="hd-btn" style="width:32px;height:32px;" onclick={() => removeLine(q.key, i)} aria-label={t('Remove')}><Icon name="x" size={13} /></button>
        </div>
      {/each}
      <div class="row" style="margin-top:6px;">
        <input class="field" style="flex:1; margin:0;" bind:value={drafts[q.key + '_input']} placeholder={t('add a line…')} onkeydown={(e) => e.key === 'Enter' && addLine(q.key)} />
        <button class="btn btn-primary btn-sm" onclick={() => addLine(q.key)}><Icon name="plus" size={15} /></button>
      </div>
    </div>
  </div>
{/each}

<div class="callout acc">
  <Icon name="star" size={20} />
  <div><strong>{t('Read this in the urge moment.')}</strong> {t('The "costs of continuing" column is your counter-argument when the craving-thoughts start.')}</div>
</div>

<button class="btn btn-primary btn-block btn-lg" onclick={save}><Icon name="check" size={18} /> {t('Save sheet')}</button>
