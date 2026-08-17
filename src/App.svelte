<script>
  import { onMount } from 'svelte'
  import { load, settings, data } from './lib/store.svelte.js'
  import { t } from './lib/i18n.svelte.js'
  import Icon from './lib/Icon.svelte'
  import Home from './components/Home.svelte'
  import CheckIn from './components/CheckIn.svelte'
  import Practices from './components/Practices.svelte'
  import Program from './components/Program.svelte'
  import Report from './components/Report.svelte'
  import Activities from './components/Activities.svelte'
  import Settings from './components/Settings.svelte'
  import CBA from './components/CBA.svelte'
  import PanicFlow from './components/PanicFlow.svelte'
  import Onboarding from './components/Onboarding.svelte'
  import Calculator from './components/Calculator.svelte'

  let tab = $state('home')
  let showPanic = $state(false)
  let ready = $state(false)
  let locked = $state(false)
  let firedDay = null
  let notifyTimer = null

  onMount(() => {
    load().then(() => {
      ready = true
      locked = settings.stealth
      if (locked) return
      const params = new URLSearchParams(window.location.search)
      if (params.get('panic') === '1') {
        showPanic = true
      } else if (params.get('tab')) {
        tab = params.get('tab')
      }
      const checkedToday = data.checkins.some(
        (c) => new Date(c.ts).toDateString() === new Date().toDateString()
      )
      if (
        settings.onboardingDone &&
        settings.gateEnabled &&
        !checkedToday &&
        !params.get('panic') &&
        !params.get('tab')
      ) {
        tab = 'checkin'
      }
    })
    notifyTimer = setInterval(maybeNotify, 30000)
    return () => clearInterval(notifyTimer)
  })

  function maybeNotify() {
    if (!settings.notifyEnabled) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const now = new Date()
    const [h, m] = (settings.notifyHour || '21:00').split(':').map(Number)
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    if (now.getHours() === h && now.getMinutes() === m && firedDay !== todayKey) {
      firedDay = todayKey
      try {
        new Notification('Addicto', {
          body: 'Ten-second check-in? Naming the urge halves its power.',
          tag: 'addicto-daily'
        })
      } catch {
        /* no-op */
      }
    }
  }

  const tabs = [
    { id: 'home', label: 'Now', icon: 'bolt' },
    { id: 'checkin', label: 'Check-in', icon: 'wave' },
    { id: 'practices', label: 'Practices', icon: 'calendar' },
    { id: 'program', label: 'Program', icon: 'book' },
    { id: 'report', label: 'Patterns', icon: 'chart' }
  ]

  function go(id) {
    tab = id
    window.scrollTo({ top: 0 })
  }
</script>

{#if !ready}
  <div class="center" style="padding: 40vh 20px; color: var(--text-4); font-weight:600;">
    {t('Loading…')}
  </div>
{:else if locked}
  <Calculator onunlock={() => (locked = false)} />
{:else if !settings.onboardingDone}
  <Onboarding ondone={() => { settings.onboardingDone = true; tab = 'home' }} />
{:else}
  <main>
    {#if tab === 'home'}
      <div class="screen"><Home onpanic={() => (showPanic = true)} go={go} /></div>
    {:else if tab === 'checkin'}
      <div class="screen"><CheckIn go={go} onpanic={() => (showPanic = true)} /></div>
    {:else if tab === 'practices'}
      <div class="screen"><Practices go={go} /></div>
    {:else if tab === 'program'}
      <div class="screen"><Program go={go} onpanic={() => (showPanic = true)} /></div>
    {:else if tab === 'report'}
      <div class="screen"><Report go={go} /></div>
    {:else if tab === 'activities'}
      <div class="screen"><Activities go={go} /></div>
    {:else if tab === 'cba'}
      <div class="screen"><CBA go={go} /></div>
    {:else if tab === 'settings'}
      <div class="screen"><Settings go={go} onlock={() => (locked = true)} /></div>
    {/if}
  </main>

  <nav class="nav-island">
    <div class="nav-island-inner">
      {#each tabs as tb (tb.id)}
        <button class="nav-btn" class:active={tab === tb.id} onclick={() => go(tb.id)} aria-label={tb.label}>
          <span class="n-ic"><Icon name={tb.icon} size={22} /></span>
          {t(tb.label)}
        </button>
      {/each}
    </div>
  </nav>

  {#if showPanic}
    <PanicFlow
      onclose={() => (showPanic = false)}
      ongoing={(id) => {
        showPanic = false
        go(id)
      }}
    />
  {/if}
{/if}
