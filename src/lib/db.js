import Dexie from 'dexie'

const db = new Dexie('addicto')

db.version(1).stores({
  checkins: '++id, ts',
  slips: '++id, ts',
  panics: '++id, ts',
  program: '++id, week',
  daily: '&day',
  settings: 'key'
})

db.version(2).stores({
  checkins: '++id, ts',
  slips: '++id, ts',
  panics: '++id, ts',
  program: '++id, week',
  daily: '&day',
  settings: 'key',
  practices: '++id, order',
  cba: 'key'
})

export async function addCheckin({ urge, mood, context }) {
  return db.checkins.add({ ts: Date.now(), urge, mood, context })
}

export async function addSlip({ urge = null, mood = null, note = '', escalation = [], sleepBad = false }) {
  return db.slips.add({ ts: Date.now(), urge, mood, note, escalation, sleepBad })
}

export async function addPanic({ completed, urge = null }) {
  return db.panics.add({ ts: Date.now(), completed, urge })
}

export async function getCheckins(limit = 500) {
  return db.checkins.orderBy('ts').reverse().limit(limit).toArray()
}

export async function getSlips(limit = 500) {
  return db.slips.orderBy('ts').reverse().limit(limit).toArray()
}

export async function getPanics(limit = 500) {
  return db.panics.orderBy('ts').reverse().limit(limit).toArray()
}

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  // Svelte $state values are Proxies, which IndexedDB's structured clone rejects.
  // Serialize to a plain, cloneable structure before storing.
  const plain = typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value
  return db.settings.put({ key, value: plain })
}

// daily lever log — keyed by YYYY-MM-DD
export async function setDaily(day, patch) {
  const existing = await db.daily.get(day)
  return db.daily.put({ day, ...(existing || {}), ...patch })
}

export async function getDaily(day) {
  return (await db.daily.get(day)) || {}
}

export async function getDailyRange(days) {
  const since = Date.now() - days * 86400000
  const rows = await db.daily.orderBy('day').filter((r) => {
    const t = new Date(r.day + 'T00:00:00').getTime()
    return t >= since
  }).toArray()
  return rows
}

// ————— Daily practices —————
export async function getPractices() {
  return db.practices.orderBy('order').toArray()
}

// Bulk-replace the practice list (used by templates + reordering).
export async function setPractices(items) {
  await db.practices.clear()
  if (items.length) {
    await db.practices.bulkAdd(items.map((p, i) => ({ name: p.name, icon: p.icon || 'bolt', order: i })))
  }
}

export async function addPractice(name, icon = 'bolt') {
  const count = await db.practices.count()
  return db.practices.add({ name, icon, order: count })
}

export async function updatePractice(id, patch) {
  return db.practices.update(id, patch)
}

export async function deletePractice(id) {
  return db.practices.delete(id)
}

// ————— CBA worksheet (single row) —————
export async function getCba() {
  const row = await db.cba.get('main')
  return row ? row.value : null
}

export async function setCba(value) {
  return db.cba.put({ key: 'main', value })
}

export async function markWeekDone(week) {
  return db.program.add({ week, completedAt: Date.now() })
}

export async function isWeekDone(week) {
  const rows = await db.program.where('week').equals(week).toArray()
  return rows.length > 0
}

export async function getDoneWeeks() {
  const rows = await db.program.toArray()
  return new Set(rows.map((r) => r.week))
}

export default db
