import { getCheckins, getSlips, getPanics, getSetting, setSetting, getDailyRange, getPractices, getCba } from './db'
import { MILESTONES } from './content.js'
import { applyDir, detectLang } from './i18n.svelte.js'

export async function setLang(code) {
  settings.lang = code
  applyDir(code)
  await setSetting('lang', code)
}

export const settings = $state({
  startDate: null,
  gateEnabled: false,
  blockedDomains: [],
  notifyEnabled: false,
  notifyHour: '21:00',
  allyName: '',
  onboardingDone: false,
  reasons: '',
  values: [],
  crisis: { topTriggers: [], topAlternatives: [], contact: '' },
  faithMode: false,
  stealth: false,
  lang: 'en'
})

export const data = $state({
  loaded: false,
  checkins: [],
  slips: [],
  panics: [],
  daily: [],
  practices: [],
  cba: null
})

export async function load() {
  const [checkins, slips, panics, daily, practices, cba, stored] = await Promise.all([
    getCheckins(2000),
    getSlips(2000),
    getPanics(2000),
    getDailyRange(30),
    getPractices(),
    getCba(),
    {
      startDate: await getSetting('startDate', null),
      gateEnabled: await getSetting('gateEnabled', false),
      blockedDomains: await getSetting('blockedDomains', []),
      notifyEnabled: await getSetting('notifyEnabled', false),
      notifyHour: await getSetting('notifyHour', '21:00'),
      allyName: await getSetting('allyName', ''),
      onboardingDone: await getSetting('onboardingDone', false),
      reasons: await getSetting('reasons', ''),
      values: await getSetting('values', []),
      crisis: await getSetting('crisis', { topTriggers: [], topAlternatives: [], contact: '' }),
      faithMode: await getSetting('faithMode', false),
      stealth: await getSetting('stealth', false),
      lang: await getSetting('lang', null)
    }
  ])
  data.checkins = checkins
  data.slips = slips
  data.panics = panics
  data.daily = daily
  data.practices = practices
  data.cba = cba
  settings.startDate = stored.startDate
  settings.gateEnabled = stored.gateEnabled
  settings.blockedDomains = stored.blockedDomains
  settings.notifyEnabled = stored.notifyEnabled
  settings.notifyHour = stored.notifyHour
  settings.allyName = stored.allyName
  settings.onboardingDone = stored.onboardingDone
  settings.reasons = stored.reasons
  settings.values = stored.values
  settings.crisis = stored.crisis
  settings.faithMode = stored.faithMode
  settings.stealth = stored.stealth
  settings.lang = stored.lang || detectLang()
  applyDir(settings.lang)
  if (!settings.startDate) {
    settings.startDate = Date.now()
  }
  data.loaded = true
}

export const todayKey = () => new Date().toISOString().slice(0, 10)

export function dailyToday() {
  return data.daily.find((d) => d.day === todayKey()) || {}
}

export function practicesDoneToday() {
  const done = dailyToday().practices || []
  return new Set(done)
}

export function gratitudeToday() {
  return dailyToday().gratitude || []
}

export function practicesProgress() {
  const total = data.practices.length
  if (total === 0) return { done: 0, total: 0, pct: 0 }
  const done = practicesDoneToday().size
  return { done: Math.min(done, total), total, pct: Math.min(1, done / total) }
}

export function practiceStreak() {
  const days = new Set(data.daily.filter((d) => (d.practices || []).length).map((d) => d.day))
  let streak = 0
  const d = new Date()
  if (!days.has(todayKey())) {
    d.setDate(d.getDate() - 1)
  }
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

const DAY = 86400000

function latestSlipTs() {
  return data.slips.length > 0 ? Math.max(...data.slips.map((s) => s.ts)) : null
}

function cleanSinceTs() {
  const last = latestSlipTs()
  return last !== null ? last : settings.startDate
}

export function currentStreakMs() {
  return cleanSinceTs() !== null ? Date.now() - cleanSinceTs() : 0
}

export function currentStreakDays() {
  return Math.max(0, Math.floor(currentStreakMs() / DAY))
}

export function currentStreakHours() {
  return Math.max(0, Math.floor(currentStreakMs() / 3600000))
}

export function longestStreakDays() {
  if (data.slips.length === 0) return currentStreakDays()
  const pts = [...data.slips.map((s) => s.ts), Date.now()].sort((a, b) => a - b)
  let best = 0
  let start = settings.startDate
  for (const t of pts) {
    best = Math.max(best, Math.floor((t - start) / DAY))
    start = t
  }
  return Math.max(best, currentStreakDays())
}

export function totalSlips() {
  return data.slips.length
}

export function panicCount() {
  return data.panics.length
}

export function panicCompletedCount() {
  return data.panics.filter((p) => p.completed).length
}

export function slipsLast30() {
  return data.slips.filter((s) => s.ts > Date.now() - 30 * DAY).length
}

export function isRelapseRecent() {
  const last = latestSlipTs()
  return last !== null && Date.now() - last < 3 * DAY
}

// check-in engagement streak — rewards showing up, not just staying clean.
// Momentum built on daily logging is what the RCT dropout data says matters most.
export function checkinStreak() {
  const days = new Set(data.checkins.map((c) => new Date(c.ts).toDateString()))
  let streak = 0
  const d = new Date()
  if (!days.has(d.toDateString())) {
    d.setDate(d.getDate() - 1)
  }
  while (days.has(d.toDateString())) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function milestone() {
  const days = currentStreakDays()
  let current = null
  let next = null
  for (let i = 0; i < MILESTONES.length; i++) {
    if (days >= MILESTONES[i].days) current = MILESTONES[i]
    else {
      next = MILESTONES[i]
      break
    }
  }
  if (!current && MILESTONES.length) current = { days: 0, name: 'Day one', line: 'Every streak starts with a single decision.' }
  return { current, next }
}

// Urge trend — average check-in urge in recent weeks vs earlier weeks.
// Declining average urge = desensitization reversing (the recovery signal).
export function urgeTrend() {
  const recent = data.checkins.filter((c) => c.ts > Date.now() - 7 * DAY && c.urge != null)
  const prior = data.checkins.filter((c) => {
    const t = c.ts
    return t <= Date.now() - 7 * DAY && t > Date.now() - 21 * DAY && c.urge != null
  })
  const avg = (arr) => (arr.length ? arr.reduce((a, c) => a + c.urge, 0) / arr.length : null)
  return { recent: avg(recent), prior: avg(prior), recentN: recent.length, priorN: prior.length }
}

export function patternReport() {
  if (data.slips.length === 0) return null
  const moodCounts = {}
  for (const s of data.slips) {
    if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1
  }
  const hours = Array.from({ length: 24 }, () => 0)
  for (const s of data.slips) {
    hours[new Date(s.ts).getHours()]++
  }
  const peakHour = hours.indexOf(Math.max(...hours))
  const hourFrac = peakHour >= 20 || peakHour < 4 ? 'night' : peakHour < 12 ? 'morning' : 'afternoon'

  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, n]) => ({ mood: m, count: n }))

  const withUrge = data.slips.filter((s) => s.urge != null)
  const avgUrge = withUrge.length > 0
    ? Math.round((withUrge.reduce((a, s) => a + s.urge, 0) / withUrge.length) * 10) / 10
    : null

  const escalationCounts = {}
  for (const s of data.slips) {
    for (const e of s.escalation || []) escalationCounts[e] = (escalationCounts[e] || 0) + 1
  }
  const topEscalation = Object.entries(escalationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([e, n]) => ({ id: e, count: n }))

  const sleepBadCount = data.slips.filter((s) => s.sleepBad).length

  return {
    topMoods,
    peakHour,
    hourFrac,
    avgUrge,
    totalSlips: data.slips.length,
    topEscalation,
    sleepBadCount
  }
}

export function sleepCorrelation() {
  if (data.slips.length < 3) return null
  const slipDays = new Set(data.slips.map((s) => new Date(s.ts).toDateString()))
  const dayOf = (ts) => new Date(ts).toDateString()
  const slipDaysWithSleep = data.slips.filter((s) => data.daily.find((d) => d.day === dayOf(s.ts) && d.sleep === false)).length
  return { total: data.slips.length, slipDaysWithSleep }
}

export function weekActivity() {
  const since = Date.now() - 7 * DAY
  return {
    slips: data.slips.filter((s) => s.ts > since).length,
    checkins: data.checkins.filter((c) => c.ts > since).length,
    panics: data.panics.filter((p) => p.ts > since && p.completed).length
  }
}
