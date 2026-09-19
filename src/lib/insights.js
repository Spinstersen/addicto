const DAY = 86400000

export const ACTION_META = {
  'paced-breathing': { label: 'Paced breathing', short: 'Start paced breathing' },
  breath: { label: 'Paced breathing', short: 'Start paced breathing' },
  exercise: { label: 'Movement', short: 'Take a brisk walk' },
  temp: { label: 'Temperature grounding', short: 'Use cool water' },
  relax: { label: 'Muscle relaxation', short: 'Release muscle tension' },
  'muscle-release': { label: 'Muscle relaxation', short: 'Release muscle tension' },
  delay: { label: 'Delaying the choice', short: 'Delay the choice' },
  'delayed-choice': { label: 'Delaying the choice', short: 'Delay the choice' },
  escape: { label: 'Leaving the situation', short: 'Leave the room' },
  'leave-room': { label: 'Leaving the room', short: 'Leave the room' },
  'location-shift': { label: 'Changing location', short: 'Move to another place' },
  neutralize: { label: 'Unhooking from thoughts', short: 'Name the thought' },
  'mindful-observe': { label: 'Mindful observation', short: 'Observe one object' },
  'five-senses': { label: 'Five-senses grounding', short: 'Use five-senses grounding' },
  'values-choice': { label: 'A values-based choice', short: 'Read your values card' },
  tasks: { label: 'An absorbing task', short: 'Start an absorbing task' },
  swap: { label: 'A replacement activity', short: 'Start a replacement activity' }
}

const labelFor = (id) => ACTION_META[id]?.label || id.replaceAll('-', ' ')

export function copingInsights(panics = []) {
  const usable = panics.filter((session) =>
    session.completed && Number.isFinite(Number(session.startUrge)) &&
    Number.isFinite(Number(session.endUrge)) && Array.isArray(session.actions) &&
    session.actions.length
  )
  const buckets = new Map()

  for (const session of usable) {
    const drop = Number(session.startUrge) - Number(session.endUrge)
    const hour = new Date(session.ts).getHours()
    const night = hour >= 20 || hour < 5
    for (const id of new Set(session.actions)) {
      const row = buckets.get(id) || { id, label: labelFor(id), samples: 0, totalDrop: 0, helped: 0, nightSamples: 0, nightDrop: 0 }
      row.samples += 1
      row.totalDrop += drop
      if (drop > 0) row.helped += 1
      if (night) {
        row.nightSamples += 1
        row.nightDrop += drop
      }
      buckets.set(id, row)
    }
  }

  const ranked = [...buckets.values()].map((row) => ({
    ...row,
    avgDrop: row.totalDrop / row.samples,
    helpRate: row.helped / row.samples,
    nightAvgDrop: row.nightSamples ? row.nightDrop / row.nightSamples : null,
    short: ACTION_META[row.id]?.short || `Try ${row.label.toLowerCase()}`
  })).sort((a, b) => b.avgDrop - a.avgDrop || b.samples - a.samples)

  const night = ranked.filter((row) => row.nightSamples > 0)
    .sort((a, b) => b.nightAvgDrop - a.nightAvgDrop || b.nightSamples - a.nightSamples)[0] || null

  return { ranked, best: ranked[0] || null, night, sessions: usable.length }
}

function topCount(values) {
  const counts = new Map()
  for (const value of values.filter((value) => value !== null && value !== undefined && value !== '')) {
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || null
}

const CONTEXT_LABELS = {
  alone: 'being alone', bed: 'being in bed', bathroom: 'being in the bathroom',
  work: 'work or study', scrolling: 'scrolling'
}

const ENVIRONMENT_ACTIONS = {
  bed: 'Charge your phone outside the bedroom on three nights.',
  bathroom: 'Leave the phone outside the bathroom this week.',
  scrolling: 'Move the most triggering app off your home screen and set one phone-free window.',
  alone: 'Plan one check-in or shared-space activity for your highest-risk time.',
  work: 'Use a separate focus window and close unrelated tabs before starting.'
}

export function weeklyReview({ slips = [], checkins = [], panics = [] } = {}) {
  const since = Date.now() - 7 * DAY
  const recentSlips = slips.filter((item) => item.ts > since)
  const recentCheckins = checkins.filter((item) => item.ts > since)
  const highUrgeCheckins = recentCheckins.filter((item) => Number(item.urge) >= 6)
  const contextHit = topCount([
    ...recentSlips.map((item) => item.context),
    ...highUrgeCheckins.map((item) => item.context)
  ])
  const context = contextHit?.[0] || null
  const hourHit = topCount(recentSlips.map((item) => new Date(item.ts).getHours()))
  const peakHour = hourHit?.[0] ?? null
  const insight = copingInsights(panics)
  const strategy = insight.best
  const contextText = context
    ? `${CONTEXT_LABELS[context] || context} appeared most often in high-urge or slip entries (${contextHit[1]}×).`
    : recentCheckins.length
      ? 'No repeated high-risk setting is clear yet. Keep logging where urges happen.'
      : 'Add a few check-ins this week so the app can identify a useful setting pattern.'
  const timeText = peakHour !== null ? ` around ${String(peakHour).padStart(2, '0')}:00` : ''
  const environment = ENVIRONMENT_ACTIONS[context] || 'Choose one place where the phone will not go during your hardest hour.'
  const implementation = context
    ? `If I notice an urge while ${CONTEXT_LABELS[context] || context}${timeText}, then I will ${strategy?.short.toLowerCase() || 'change location and wait two minutes'}.`
    : `If an urge reaches 6/10, then I will ${strategy?.short.toLowerCase() || 'change location and wait two minutes'}.`
  const realisticGoal = recentCheckins.length >= 5
    ? 'Repeat your strongest coping action twice before the next review.'
    : `Complete ${Math.max(2, 4 - recentCheckins.length)} short check-ins on different days.`

  return {
    context,
    contextText,
    strategy,
    strategyText: strategy
      ? `${strategy.label} accompanied an average ${strategy.avgDrop.toFixed(1)}-point reduction across ${strategy.samples} ${strategy.samples === 1 ? 'session' : 'sessions'}.`
      : 'Complete and re-rate a coping session to learn which strategy appears most helpful.',
    environment,
    implementation,
    realisticGoal,
    sampleWarning: strategy && strategy.samples < 3 ? 'Early signal—repeat it before treating this as a reliable pattern.' : null
  }
}
