<script>
  import { settings, data, load, setLang } from '../lib/store.svelte.js'
  import { setSetting } from '../lib/db.js'
  import db from '../lib/db.js'
  import { BLOCKED_DOMAINS_DEFAULT, BLOCKING_GUIDES } from '../lib/content.js'
  import { LANGUAGES, t } from '../lib/i18n.svelte.js'
  import { onMount } from 'svelte'
  import { vibrate } from '../lib/helpers.js'
  import Icon from '../lib/Icon.svelte'
  import ScreenHeader from './ScreenHeader.svelte'

  let { go, onlock } = $props()

  let note = $state('')
  let blockedList = $state([])
  let newDomain = $state('')
  let exportUrl = $state(null)
  let editCrisis = $state(false)
  let editAnchor = $state(false)
  let crisisTriggers = $state('')
  let crisisAlternatives = $state('')
  let platform = $state('android')

  onMount(async () => {
    blockedList = settings.blockedDomains.length ? [...settings.blockedDomains] : [...BLOCKED_DOMAINS_DEFAULT]
    await setSetting('blockedDomains', blockedList)
    settings.blockedDomains = blockedList
  })

  function flash(msg, ms = 3000) {
    note = msg
    setTimeout(() => (note = ''), ms)
  }

  async function toggleGate() {
    settings.gateEnabled = !settings.gateEnabled
    await setSetting('gateEnabled', settings.gateEnabled)
    vibrate(30)
  }

  async function toggleFaith() {
    settings.faithMode = !settings.faithMode
    await setSetting('faithMode', settings.faithMode)
    vibrate(30)
  }

  async function toggleStealth() {
    settings.stealth = !settings.stealth
    await setSetting('stealth', settings.stealth)
    vibrate(30)
  }

  async function changeLang(code) {
    await setLang(code)
    vibrate(30)
  }

  async function notifyHourChanged() {
    await setSetting('notifyHour', settings.notifyHour)
    flash(t('Reminder set for') + ' ' + settings.notifyHour)
  }

  async function addDomain() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d || blockedList.includes(d)) return
    blockedList = [...blockedList, d]
    settings.blockedDomains = blockedList
    await setSetting('blockedDomains', blockedList)
    newDomain = ''
  }

  async function removeDomain(d) {
    blockedList = blockedList.filter((x) => x !== d)
    settings.blockedDomains = blockedList
    await setSetting('blockedDomains', blockedList)
  }

  const hostsEntries = $derived(blockedList.map((d) => `0.0.0.0 ${d}\n0.0.0.0 www.${d}`).join('\n'))
  const domainList = $derived(blockedList.join('\n'))

  async function copyText(text, msg) {
    await navigator.clipboard.writeText(text)
    flash(msg, 4000)
  }

  function openCrisisEdit() {
    crisisTriggers = settings.crisis.topTriggers.join('\n')
    crisisAlternatives = settings.crisis.topAlternatives.join('\n')
    editCrisis = true
  }

  async function saveCrisis() {
    settings.crisis.topTriggers = crisisTriggers.split('\n').map((s) => s.trim()).filter(Boolean)
    settings.crisis.topAlternatives = crisisAlternatives.split('\n').map((s) => s.trim()).filter(Boolean)
    await setSetting('crisis', settings.crisis)
    editCrisis = false
    flash(t('Crisis plan saved'))
  }

  async function saveAnchor() {
    await setSetting('reasons', settings.reasons)
    editAnchor = false
    flash(t('Anchor saved'))
  }

  async function exportBackup() {
    const backup = {
      app: 'addicto', version: 3, exportedAt: new Date().toISOString(),
      settings,
      checkins: data.checkins, slips: data.slips, panics: data.panics,
      daily: await db.daily.toArray(), program: await db.program.toArray(),
      practices: await db.practices.toArray(), cba: await db.cba.toArray()
    }
    exportUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [['type', 'date', 'urge', 'mood', 'note']]
    for (const c of data.checkins) rows.push(['checkin', new Date(c.ts).toISOString(), c.urge, c.mood, ''])
    for (const s of data.slips) rows.push(['slip', new Date(s.ts).toISOString(), s.urge, s.mood, (s.escalation || []).join(';')])
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'addicto-data.csv'
    a.click()
    flash(t('CSV downloaded'))
  }

  async function importBackup(file) {
    try {
      const backup = JSON.parse(await file.text())
      if (!backup || backup.app !== 'addicto') throw new Error('bad')
      await db.checkins.clear(); await db.slips.clear(); await db.panics.clear()
      await db.program.clear(); await db.daily.clear(); await db.practices.clear(); await db.cba.clear()
      await db.checkins.bulkAdd(backup.checkins || [])
      await db.slips.bulkAdd(backup.slips || [])
      await db.panics.bulkAdd(backup.panics || [])
      await db.daily.bulkAdd(backup.daily || [])
      await db.practices.bulkAdd((backup.practices || []).map((p, i) => ({ name: p.name, icon: p.icon || 'bolt', order: p.order ?? i })))
      if (backup.program) await db.program.bulkAdd(backup.program)
      if (backup.cba) await db.cba.bulkAdd(backup.cba)
      for (const [k, v] of Object.entries(backup.settings)) await setSetting(k, v)
      await load()
      flash(t('Backup imported ✓'))
    } catch {
      flash(t('That file is not a valid Addicto backup'), 4000)
    }
  }

  async function resetAll() {
    if (!confirm(t('Delete ALL data permanently?'))) return
    await db.checkins.clear(); await db.slips.clear(); await db.panics.clear()
    await db.program.clear(); await db.daily.clear(); await db.practices.clear(); await db.cba.clear()
    await db.settings.clear()
    await load()
    flash(t('All data deleted'))
  }

  function allySummary() {
    const d = data.slips.length
    const last30 = data.slips.filter((s) => s.ts > Date.now() - 30 * 86400000).length
    const ridden = data.panics.filter((p) => p.completed).length
    const name = settings.allyName ? `Hey ${settings.allyName}, ` : ''
    return (
      `${name}${t('here\'s my Addicto weekly summary.')}\n\n` +
      `${t('Days since last slip')}: ${Math.floor((Date.now() - (data.slips[0]?.ts ?? Date.now())) / 86400000)}\n` +
      `${t('Slips logged total')}: ${d} (${last30} ${t('in the last 30 days')})\n` +
      `${t('Urges ridden out')}: ${ridden}\n` +
      `${t('Check-ins logged')}: ${data.checkins.length}\n\n` +
      `${t('Keeping it honest. No judgement — just accountability.')}`
    )
  }

  async function copyAlly() {
    await navigator.clipboard.writeText(allySummary())
    flash(t('Summary copied — paste it to your ally'))
  }

  const guide = $derived(BLOCKING_GUIDES[platform])
</script>

<div class="screen">
  <ScreenHeader eyebrow={t('Environment & privacy')} title={t('Your defenses.')} {go} back="home" />

  {#if note}
    <div class="callout acc" style="margin-bottom:14px;"><Icon name="check" size={18} /><div>{note}</div></div>
  {/if}

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Language')}</div>
      <div class="lang-grid">
        {#each LANGUAGES as l (l.code)}
          <button class="lang-btn" class:selected={settings.lang === l.code} onclick={() => changeLang(l.code)}>
            {l.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Stealth mode')}</div>
      <div class="list-item">
        <div>
          <div class="l-label">{t('Disguise as calculator')}</div>
          <div class="l-sub">{t('The app looks and is named like a calculator. Type 0 ÷ 0 = to open it.')}</div>
        </div>
        <label class="toggle"><input type="checkbox" checked={settings.stealth} onchange={toggleStealth} /><span class="track"></span></label>
      </div>
      {#if settings.stealth}
        <button class="btn btn-ghost btn-block btn-sm" style="margin-top:10px;" onclick={() => onlock && onlock()}>
          <Icon name="lock" size={16} /> {t('Lock now')}
        </button>
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Faith mode')}</div>
      <div class="list-item">
        <div>
          <div class="l-label">{t('Islamic recovery module')}</div>
          <div class="l-sub">{t('Adds duas, Quran verses and a spiritual anchor to the panic moment and practices. Off by default.')}</div>
        </div>
        <label class="toggle"><input type="checkbox" checked={settings.faithMode} onchange={toggleFaith} /><span class="track"></span></label>
      </div>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Friction mode')}</div>
      <div class="list-item">
        <div>
          <div class="l-label">{t('Daily check-in gate')}</div>
          <div class="l-sub">{t('Opening the app asks for a 10-second check-in first. Environment beats willpower.')}</div>
        </div>
        <label class="toggle"><input type="checkbox" checked={settings.gateEnabled} onchange={toggleGate} /><span class="track"></span></label>
      </div>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Your anchor')}</div>
      {#if editAnchor}
        <textarea class="field" bind:value={settings.reasons} placeholder={t('One line that matters to you.')}></textarea>
        <div class="row" style="gap:8px;">
          <button class="btn btn-primary btn-sm" onclick={saveAnchor}><Icon name="check" size={15} /> {t('Save')}</button>
          <button class="btn btn-soft btn-sm" onclick={() => (editAnchor = false)}>{t('Cancel')}</button>
        </div>
      {:else}
        <div class="list-item">
          <div class="grow">
            <div class="l-label">{settings.reasons || t('No anchor yet')}</div>
            <div class="l-sub">{t('Shown in the panic moment.')}</div>
          </div>
          <button class="btn btn-soft btn-sm" onclick={() => (editAnchor = true)}><Icon name="edit" size={15} /> {t('Edit')}</button>
        </div>
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Crisis plan')}</div>
      {#if editCrisis}
        <div class="label-block">{t('Top triggers')} <span class="faint">{t('(one per line)')}</span></div>
        <textarea class="field" rows="3" bind:value={crisisTriggers} placeholder={t('late night, alone in bed, after stress')}></textarea>
        <div class="label-block">{t('Best alternatives')} <span class="faint">{t('(one per line)')}</span></div>
        <textarea class="field" rows="3" bind:value={crisisAlternatives} placeholder={t('leave room, cold water, push-ups, text a friend')}></textarea>
        <div class="label-block">{t('One person to contact')}</div>
        <input class="field" bind:value={settings.crisis.contact} />
        <div class="row" style="gap:8px;">
          <button class="btn btn-primary btn-sm" onclick={saveCrisis}><Icon name="check" size={15} /> {t('Save')}</button>
          <button class="btn btn-soft btn-sm" onclick={() => (editCrisis = false)}>{t('Cancel')}</button>
        </div>
      {:else}
        <div class="list-item">
          <div class="grow">
            <div class="l-sub" style="font-size:0.9rem;">
              {settings.crisis.topTriggers.length ? settings.crisis.topTriggers.slice(0, 3).join(' · ') : t('No triggers yet')}
            </div>
          </div>
          <button class="btn btn-soft btn-sm" onclick={openCrisisEdit}><Icon name="edit" size={15} /> {t('Edit')}</button>
        </div>
        <p class="faint" style="font-size:0.78rem;">{t('Written while calm, shown mid-craving — when your executive function is offline.')}</p>
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Block porn on your device')}</div>
      <p class="body" style="font-size:0.88rem;">
        {t('Pick your device for step-by-step setup. Your custom blocklist is below the guide.')}
      </p>
      <div class="platform-switch" style="margin:14px 0;">
        {#each Object.values(BLOCKING_GUIDES) as g (g.title)}
          <button class="plat-btn" class:selected={platform === g.title.toLowerCase()} onclick={() => (platform = g.title.toLowerCase())}>
            <Icon name={g.icon} size={18} />
            {g.title}
          </button>
        {/each}
      </div>

      {#if guide}
        {#each guide.steps as s, i (i)}
          <div class="step">
            <div class="step-num">{i + 1}</div>
            <div class="grow">
              <div style="font-weight:700; font-size:0.95rem;">{t(s.t)}</div>
              <p class="muted" style="font-size:0.86rem; margin-top:4px;">{t(s.d)}</p>
              {#if s.action}
                {#if platform === 'android' && s.action.startsWith('dns')}
                  <button class="btn btn-soft btn-sm" style="margin-top:8px;" onclick={() => copyText(s.action, t('DNS host copied — paste into Private DNS'))}><Icon name="copy" size={14} /> {s.action}</button>
                {:else if platform === 'windows' && s.action.startsWith('generate')}
                  <button class="btn btn-soft btn-sm" style="margin-top:8px;" onclick={() => copyText(hostsEntries, t('Hosts entries copied'))}><Icon name="copy" size={14} /> {t('Copy hosts entries')}</button>
                {:else}
                  <span class="tag" style="margin-top:8px;">{t(s.action)}</span>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
        <div class="callout vio" style="margin-top:12px;">
          <Icon name="shield" size={18} />
          <div>{t(guide.note)}</div>
        </div>
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Your blocklist')}</div>
      <div class="pill-grid" style="margin:12px 0;">
        {#each blockedList as d (d)}
          <span class="tag">{d} <button style="margin-left:6px; color:var(--text-4);" onclick={() => removeDomain(d)}><Icon name="x" size={12} /></button></span>
        {/each}
      </div>
      <div class="row">
        <input class="field" style="flex:1; margin:0;" placeholder={t('add domain')} bind:value={newDomain} onkeydown={(e) => e.key === 'Enter' && addDomain()} />
        <button class="btn btn-soft btn-sm" onclick={addDomain}><Icon name="plus" size={15} /></button>
      </div>
      <div class="row" style="gap:8px; margin-top:12px;">
        <button class="btn btn-primary btn-block" onclick={() => copyText(domainList, t('Domain list copied — use as a custom blocklist / never-allow list'))}>
          <Icon name="copy" size={16} /> {t('Copy domain list')}
        </button>
      </div>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" onclick={() => copyText(hostsEntries, t('Hosts entries copied (Windows/Mac)'))}>
        <Icon name="download" size={16} /> {t('Copy hosts entries')}
      </button>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Accountability')}</div>
      <div class="label-block">{t('Ally name')}</div>
      <div class="row">
        <input class="field" style="flex:1; margin:0;" bind:value={settings.allyName} onchange={async () => { await setSetting('allyName', settings.allyName); flash(t('Saved')) }} placeholder={t('Someone you trust')} />
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick={copyAlly}><Icon name="share" size={16} /> {t('Copy weekly summary to share')}</button>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Reminder')}</div>
      <div class="list-item">
        <div>
          <div class="l-label">{t('Daily check-in reminder')}</div>
          <div class="l-sub">{t('Local PWA notification — fires while the app is open (Android: keep it installed).')}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" checked={settings.notifyEnabled} onchange={async () => { settings.notifyEnabled = !settings.notifyEnabled; await setSetting('notifyEnabled', settings.notifyEnabled); if (settings.notifyEnabled && 'Notification' in window) Notification.requestPermission() }} />
          <span class="track"></span>
        </label>
      </div>
      {#if settings.notifyEnabled}
        <input type="time" class="field" bind:value={settings.notifyHour} onchange={notifyHourChanged} />
      {/if}
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('Your data')}</div>
      <div class="row" style="gap:8px;">
        <button class="btn btn-ghost btn-block" onclick={exportBackup}><Icon name="upload" size={16} /> {t('Backup')}</button>
        {#if exportUrl}
          <a class="btn btn-primary btn-block" href={exportUrl} download="addicto-backup.json">{t('Save')}</a>
        {/if}
      </div>
      <label class="btn btn-soft btn-block" style="margin-top:8px;">
        <Icon name="download" size={16} /> {t('Import backup')}
        <input type="file" accept="application/json" style="display:none;" onchange={(e) => importBackup(e.target.files[0])} />
      </label>
      <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick={exportCsv}><Icon name="chart" size={16} /> {t('Export CSV (spreadsheets)')}</button>
      <button class="btn btn-danger btn-block" style="margin-top:14px;" onclick={resetAll}><Icon name="trash" size={16} /> {t('Delete all data')}</button>
    </div>
  </div>

  <div class="shell">
    <div class="core">
      <div class="card-title"><span class="dot"></span>{t('About')}</div>
      <p class="body" style="font-size:0.85rem;">
        {t('Addicto is a local, private, open-source recovery companion. Methods: CBT, motivational interviewing, mindfulness, SMART Recovery 4-Point, DBT distress tolerance (TIPP), and the ADHD dopamine-dysregulation research (sleep, exercise, environmental design as the primary levers). It is a support tool, not medical treatment — if you\'re in crisis or your use causes serious distress, talk to a licensed therapist.')}
      </p>
    </div>
  </div>
</div>

<style>
  .label-block {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-3);
    margin: 10px 0 2px;
  }
  .lang-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  }
  .lang-btn {
    padding: 13px 10px; border-radius: var(--r-sm);
    background: var(--core); border: 1px solid var(--hairline);
    color: var(--text-2); font-weight: 700; font-size: 0.95rem;
    transition: all 0.25s var(--ease-soft);
  }
  .lang-btn.selected {
    color: var(--acc); border-color: rgba(94,234,212,0.4);
    background: rgba(94,234,212,0.08);
  }
  .platform-switch {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  }
  .plat-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 6px; border-radius: var(--r-sm);
    background: var(--core); border: 1px solid var(--hairline);
    color: var(--text-3); font-weight: 700; font-size: 0.82rem;
    transition: all 0.25s var(--ease-soft);
  }
  .plat-btn :global(svg) { stroke: var(--text-3); }
  .plat-btn.selected {
    color: var(--acc); border-color: rgba(94,234,212,0.4);
    background: rgba(94,234,212,0.08);
  }
  .plat-btn.selected :global(svg) { stroke: var(--acc); }
  .step {
    display: flex; gap: 12px; padding: 12px 0;
    border-bottom: 1px solid var(--hairline);
  }
  .step:last-child { border-bottom: none; }
  .step-num {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    background: var(--core-2); border: 1px solid var(--hairline-strong);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.8rem;
  }
</style>
