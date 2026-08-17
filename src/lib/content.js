// Evidence map: methods here are drawn from the RCT-tested Hands-Off program,
// SMART Recovery's 4-Point Program (REBT/CBT), DBT distress tolerance (TIPP),
// and the ADHD dopamine-dysregulation literature. Each feature cites its basis
// in the inline comments.

export const MOODS = [
  { id: 'bored', label: 'Bored', icon: 'hourglass' },
  { id: 'lonely', label: 'Lonely', icon: 'users' },
  { id: 'stressed', label: 'Stressed', icon: 'cloud' },
  { id: 'angry', label: 'Angry', icon: 'zap' },
  { id: 'tired', label: 'Tired', icon: 'moon' },
  { id: 'hungry', label: 'Hungry', icon: 'coffee' },
  { id: 'anxious', label: 'Anxious', icon: 'activity' },
  { id: 'sad', label: 'Sad', icon: 'drop' },
  { id: 'content', label: 'Content', icon: 'smile' },
  { id: 'excited', label: 'Excited', icon: 'star' }
]

export const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.id, m.label]))

// Escalation mechanisms documented in Addictive Behaviors (2024): volume,
// genre escalation, tab-jumping, edging, binging. ADHD novelty-seeking makes
// genre escalation + tab-jumping the most likely. Logging them reveals the pattern.
export const ESCALATION = [
  { id: 'volume', label: 'More time', hint: 'Longer sessions than before' },
  { id: 'genre', label: 'More extreme', hint: 'Content escalating in intensity' },
  { id: 'tabjump', label: 'Tab-jumping', hint: 'Rapid switching for novelty' },
  { id: 'edging', label: 'Edging', hint: 'Extending the build-up' },
  { id: 'binging', label: 'Binging', hint: 'Multi-session spirals' }
]

// DBT TIPP — the 4 distress-tolerance skills for emotional flooding.
// The "Temperature" step is fast relief for the acute arousal spike.
export const TIPP = [
  {
    id: 'temp',
    icon: 'snow',
    title: 'Temperature',
    sub: 'Cold resets the system',
    action: 'Hold ice or run cold water on your face / wrists for 30–60s. Or splash cold water repeatedly. This drops your arousal level fast — the single fastest physical reset.',
    seconds: 90
  },
  {
    id: 'exercise',
    icon: 'dumbbell',
    title: 'Intense exercise',
    sub: 'Burn the urge chemically',
    action: 'A burst — sprint, push-ups, squats, jumping jacks — for ~5 minutes. Movement raises the same dopamine circuits porn hijacks, legally.',
    seconds: 300
  },
  {
    id: 'breath',
    icon: 'wind',
    title: 'Paced breathing',
    sub: 'Exhale longer than you inhale',
    action: 'Breathe out slowly for longer than you breathe in (e.g. in 4, out 6–8). Long exhales activate the parasympathetic brake.',
    seconds: 120
  },
  {
    id: 'relax',
    icon: 'activity',
    title: 'Paired relaxation',
    sub: 'Tense, hold, release',
    action: 'Tense a muscle group 5s, release and notice the drop. Go hands → arms → shoulders → face. 60 seconds of this kills the "must act NOW" feeling.',
    seconds: 60
  }
]

export const ESCALATION_LABEL = Object.fromEntries(ESCALATION.map((e) => [e.id, e.label]))
// SMART Recovery DENTS — urge management toolkit
export const DENTS = [
  {
    id: 'deny',
    icon: 'rewind',
    title: 'Deny / Delay',
    text: '"Not now — maybe in 15 minutes." The urge will fade before the timer does. Delay is the whole game.'
  },
  {
    id: 'escape',
    icon: 'mountain',
    title: 'Escape',
    text: 'Leave the situation: change rooms, put the phone down and step away. You cannot act on an urge you are not facing.'
  },
  {
    id: 'neutralize',
    icon: 'refresh',
    title: 'Neutralize',
    text: 'Argue with the craving-thought. "This is my dopamine system talking, not a fact about me."'
  },
  {
    id: 'tasks',
    icon: 'bolt',
    title: 'Tasks',
    text: 'Do something absorbing for 10 minutes. Boredom feeds urges; engaged attention starves them.'
  },
  {
    id: 'swap',
    icon: 'sparkle',
    title: 'Swap',
    text: 'Substitute a different dopamine source — the Activities tab is a menu of legal ones.'
  }
]

export const BREATH_CYCLES = [
  { name: 'Urge-surf', inhale: 4, hold: 4, exhale: 6, cycles: 5 },
  { name: 'Box calm', inhale: 4, hold: 4, exhale: 4, holdOut: 4, cycles: 5 },
  { name: 'Quick reset', inhale: 3, exhale: 5, cycles: 8 }
]

// Replacement activities grouped by dopamine function. Based on:
// - behavioral activation (fun + mastery are the two healthy dopamine fuels)
// - the ADHD levers: exercise, novelty (channeled), social, sleep, sensory reset
export const ACTIVITIES = [
  {
    mood: 'novelty',
    label: 'Novelty fix',
    icon: 'sparkle',
    sub: 'Your brain craves the new. Feed it deliberately.',
    items: [
      { name: 'Try a new recipe or cuisine', seconds: 900 },
      { name: 'New music / a playlist you\'ve never heard', seconds: 600 },
      { name: 'Take a different route on a walk', seconds: 900 },
      { name: 'Learn one chord / 3 new phrases / 1 fact', seconds: 300 },
      { name: 'Rework a space in your room', seconds: 900 },
      { name: 'Pick up a hobby you abandoned', seconds: 1200 }
    ]
  },
  {
    mood: 'physical',
    label: 'Move',
    icon: 'dumbbell',
    sub: 'Exercise is a documented ADHD lever: dopamine + norepinephrine.',
    items: [
      { name: 'Run or jog 15–30 min', seconds: 1500 },
      { name: 'Push-ups / squats / burpees burst', seconds: 300 },
      { name: 'Fast walk outside', seconds: 1200 },
      { name: 'Dance to 3 songs', seconds: 600 },
      { name: 'Stairs up and down for 5 min', seconds: 300 }
    ]
  },
  {
    mood: 'social',
    label: 'Connect',
    icon: 'users',
    sub: 'Isolation is the habitat urges grow in. One real human is a shield.',
    items: [
      { name: 'Call or text someone real', seconds: 600 },
      { name: 'Go somewhere with people (cafe, gym)', seconds: 1200 },
      { name: 'Post honestly in a recovery community', seconds: 300 },
      { name: 'Make a plan with a friend this week', seconds: 300 }
    ]
  },
  {
    mood: 'rest',
    label: 'Restore',
    icon: 'moon',
    sub: 'Sleep debt raises dopamine hunger. Recharge instead of feed.',
    items: [
      { name: 'Eyes-closed rest or nap', seconds: 900 },
      { name: 'Daylight walk (sleep hygiene + mood)', seconds: 600 },
      { name: 'Water + protein snack', seconds: 180 },
      { name: 'Lie down, 5 slow breaths, no screens', seconds: 300 }
    ]
  },
  {
    mood: 'sensory',
    label: 'Reset',
    icon: 'snow',
    sub: 'DBT TIPP — physical sensation interrupts the emotional spike.',
    items: [
      { name: 'Cold water on face / wrists (TIPP)', seconds: 90 },
      { name: 'Hold an ice cube', seconds: 60 },
      { name: 'Strong mint / sour candy', seconds: 60 },
      { name: 'Shower — finish cold', seconds: 600 }
    ]
  },
  {
    mood: 'mastery',
    label: 'Master',
    icon: 'edit',
    sub: 'Achievement is the other healthy dopamine fuel. Stack small wins.',
    items: [
      { name: 'Do one small task you\'ve been avoiding', seconds: 600 },
      { name: 'Write, sketch, or build something', seconds: 1200 },
      { name: 'Organize one drawer / folder', seconds: 600 },
      { name: 'Plan tomorrow — 3 wins', seconds: 300 }
    ]
  }
]

// Soft-fail milestone levels. Framing avoids rigid-abstinence shame:
// streaks are evidence of momentum, never a score of worth.
export const MILESTONES = [
  { days: 1, name: 'First wave', line: 'You surfed the first urge. That is the whole mechanism.' },
  { days: 3, name: 'Pattern breaker', line: 'Three days is where automatic loops start to loosen.' },
  { days: 7, name: 'One week', line: 'A full cycle of your week — triggers seen, triggers named.' },
  { days: 14, name: 'Two weeks', line: 'The loop is learning a new script.' },
  { days: 30, name: 'Rewiring', line: 'A month. This is where receptor recalibration really happens.' },
  { days: 60, name: 'Two months', line: 'Two full months. Your baseline is noticeably flatter-calmer.' },
  { days: 90, name: 'Baseline restored', line: 'Three months. Most withdrawal-style symptoms have cleared.' },
  { days: 180, name: 'Half year', line: 'Half a year. You are no longer "stopping"; you live differently.' },
  { days: 365, name: 'A full year', line: 'A year of rewiring. The new script is the default.' }
]

export const VALUES = [
  { id: 'health', label: 'Health', icon: 'activity' },
  { id: 'relationship', label: 'Relationship', icon: 'heart' },
  { id: 'focus', label: 'Focus / work', icon: 'bolt' },
  { id: 'integrity', label: 'Integrity', icon: 'shield' },
  { id: 'energy', label: 'Energy', icon: 'zap' },
  { id: 'selfrespect', label: 'Self-respect', icon: 'award' },
  { id: 'intimacy', label: 'Real intimacy', icon: 'users' },
  { id: 'time', label: 'Time back', icon: 'clock' }
]

export const SELF_COMPASSION = [
  'This is a dopamine-calibration problem, not a character flaw. ADHD brains run the same loop you are interrupting right now.',
  'One slip is information. The only failure here is deciding one mistake erases everything and spiraling.',
  'Name what the urge was doing for you: escape? stimulation? numbing? That is a clue, not a confession.',
  'If your best friend just told you this, you would not shame them. Say to yourself what you would say to them.'
]

// Crisis plan — written once, shown in the panic moment. Pre-written decisions
// for the exact moment executive function is offline.
export const CRISIS_TEMPLATE = {
  topTriggers: [],
  topAlternatives: [],
  contact: ''
}

export const BLOCKED_DOMAINS_DEFAULT = [
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  'xhamster.com',
  'redtube.com',
  'youporn.com',
  'spankbang.com',
  'eporner.com',
  'tube8.com',
  'brazzers.com',
  'bangbros.com',
  'onlyfans.com'
]

export const PROGRAM = [
  {
    week: 1,
    title: 'Why this is worth it',
    goal: 'Build motivation on your own values',
    minutes: '~8 min',
    methods: ['Motivational interviewing', 'Values'],
    lessons: [
      {
        title: 'Decisional balance',
        summary: 'See clearly what this habit costs and what it buys — on paper, not in your head.',
        type: 'cba',
        text: 'Write honestly what porn gives you AND what it costs. Both columns matter. Motivation built on your real costs survives urges; motivation built on shame collapses in them.',
        action: 'Make two lists: what it gives you vs what it costs you.'
      },
      {
        title: 'Your values, not a script',
        summary: 'Anchor your goal to the values that actually matter to you.',
        type: 'values',
        text: 'Generic goals fade in three days. Goals tied to a value you actually hold survive contact with cravings. The ADHD brain follows what it finds meaningful — find what that is for you.',
        action: 'Pick the 3 values from onboarding that matter most.'
      },
      {
        title: 'The one-line anchor',
        summary: 'Write the one sentence that will hold you in the hard moment.',
        type: 'anchor',
        text: 'At peak urge you cannot remember a paragraph. You can remember one sentence. Distil your strongest reason into a line you would actually say out loud.',
        action: 'Write your one-line anchor. It appears in the panic moment.'
      }
    ]
  },
  {
    week: 2,
    title: 'Map your danger zones',
    goal: 'Identify risk situations',
    minutes: '~10 min',
    methods: ['Situational analysis', 'HALT'],
    lessons: [
      {
        title: 'External triggers',
        summary: 'Find the situations that reliably lead to a slip.',
        type: 'trigger',
        text: 'Your triggers are predictable: time of day, location (bed, bathroom), device, aloneness. Predictability is power — a known trigger is half-defused.',
        action: 'List your top 5 external triggers from your check-in data.'
      },
      {
        title: 'Internal triggers (HALT)',
        summary: 'Learn to name the feeling before it becomes an urge.',
        type: 'halt',
        text: 'Hungry, Angry, Lonely, Tired — plus bored, stressed, anxious. Negative mood and craving intensity are the two strongest slip predictors. Name the state before it becomes an urge.',
        action: 'Tag the feeling every time you log an urge.'
      },
      {
        title: 'Sleep is a lever, not a luxury',
        summary: 'Treat sleep as a lever: two good nights weaken every trigger.',
        type: 'sleep',
        text: 'Sleep deprivation suppresses the tonic dopamine baseline AND the prefrontal brake — both already taxed in ADHD. Two bad nights make every trigger stronger.',
        action: 'Log your sleep in the daily check-in for a week.'
      }
    ]
  },
  {
    week: 3,
    title: 'Engineer the environment',
    goal: 'Change behavior without willpower',
    minutes: '~10 min',
    methods: ['Habit replacement', 'Implementation intentions', 'Environmental design'],
    lessons: [
      {
        title: 'Willpower is a broken tool here',
        summary: 'Stop fighting with willpower — change the room instead.',
        type: 'gate',
        text: 'The prefrontal cortex is the compromised system — demanding "more willpower" from it is asking a sprained ankle to sprint. Environment beats discipline: reduce friction, not resistance.',
        action: 'Turn on the daily gate + blocklist. Phone not in the bedroom at night.'
      },
      {
        title: 'If-then plans',
        summary: 'Write simple if-then plans so hard moments run on autopilot.',
        type: 'ifthen',
        text: 'Implementation intentions offload decisions: "IF I am alone in bed at 11pm, THEN I move to the kitchen with my phone charging there." No in-the-moment thinking required.',
        action: 'Write if-then plans for your top 3 triggers.'
      },
      {
        title: 'The 10-minute rule',
        summary: 'Learn the 10-minute rule: urges peak and pass.',
        type: 'ten',
        text: 'Urges are waves: they rise, peak, and fall within 10–20 minutes. Delay beats deny — ride it with a substitute activity.',
        action: 'Next urge: set 10 minutes and do a replacement activity.'
      }
    ]
  },
  {
    week: 4,
    title: 'Refuel the reward system',
    goal: 'Legal dopamine sources',
    minutes: '~8 min',
    methods: ['Behavioral activation', 'Exercise'],
    lessons: [
      {
        title: 'Porn was doing a job',
        summary: 'Understand what porn was doing for you — then replace it.',
        type: 'reflect',
        text: 'For ADHD brains, arousal was a form of self-medication — a dopamine substitute. You cannot remove the behavior without replacing its function, or the function finds a new outlet.',
        action: 'What was it doing for you — escape, stimulation, numbing? Name it.'
      },
      {
        title: 'Exercise is the legal hit',
        summary: 'Use exercise as the legal dopamine hit before risky hours.',
        type: 'exercise',
        text: 'Aerobic exercise raises dopamine and norepinephrine in the prefrontal cortex — the same circuits medication targets. 20–30 minutes before a high-risk window changes the chemistry of the hour.',
        action: 'Move 20+ min today, ideally before your peak trigger window.'
      },
      {
        title: 'Fun + mastery = the two fuels',
        summary: 'Schedule the two healthy fuels: fun and small wins.',
        type: 'activities',
        text: 'Pleasure (novelty, play) and mastery (completion) are the two healthy dopamine streams. Schedule both; novelty is a drive to channel, not suppress.',
        action: 'Pick one Novelty and one Master activity this week.'
      }
    ]
  },
  {
    week: 5,
    title: 'Talk back to the loop',
    goal: 'CBT + emotional regulation',
    minutes: '~12 min',
    methods: ['CBT', 'REBT disputing', 'DBT distress tolerance'],
    lessons: [
      {
        title: 'Automatic thoughts lie',
        summary: 'Learn to catch the lying thoughts that cravings bring.',
        type: 'thought',
        text: 'Cravings come wrapped in thoughts: "one more time", "I deserve this", "already failed today". These are thoughts, not facts — and you can argue with them.',
        action: 'Catch one craving-thought and write it down this week.'
      },
      {
        title: 'The thought record',
        summary: 'Use the 4-step thought record to buy ten minutes.',
        type: 'thought',
        text: 'Situation → automatic thought → evidence against → balanced thought. You do not need to fully believe the balanced thought; you need it true enough to buy ten minutes.',
        action: 'Run the thought record next time a craving-thought appears.'
      },
      {
        title: 'The shame trap is mechanical',
        summary: 'Understand why shame backfires — and what to use instead.',
        type: 'selfcompassion',
        text: 'Shame activates the amygdala, which suppresses the prefrontal cortex — the exact system you need. Shame does not motivate ADHD change; it disables it. Compassion is the functional tool.',
        action: 'After any slip, read the self-compassion card. No punishment.'
      }
    ]
  },
  {
    week: 6,
    title: 'Slip-proof the long run',
    goal: 'Relapse prevention + crisis plan',
    minutes: '~10 min',
    methods: ['Relapse prevention', 'Compassion-focused coping'],
    lessons: [
      {
        title: 'Slip vs relapse',
        summary: 'Know the difference between a slip and a relapse.',
        type: 'commit',
        text: 'A slip is a moment. A relapse is the return to the pattern. The hinge is what you do in the next hour — guilt is what turns a slip into a relapse.',
        action: 'Pre-commit: slip → log it → continue. No spiral, no restart-from-zero.'
      },
      {
        title: 'Write the crisis plan while calm',
        summary: 'Write the crisis plan while calm, so it\'s ready later.',
        type: 'crisis',
        text: 'At the peak of a craving your executive function is offline. Future-you needs decisions written by calm-you: top triggers, best alternatives, one contact.',
        action: 'Fill the crisis plan in Settings. It shows in the panic moment.'
      },
      {
        title: 'Define the after',
        summary: 'Give the reclaimed time a purpose worth keeping.',
        type: 'after',
        text: 'Recovery is not subtraction. The reclaimed time and attention belong to something specific — a relationship, a skill, a body of work.',
        action: 'List 3 things you will do with the reclaimed time.'
      }
    ]
  }
]

export const THOUGHT_EXAMPLES = [
  'One more time, then I quit for real.',
  'I already messed up today, so why not.',
  'I deserve this — I had a hard day.',
  'I can\'t stand this feeling.',
  'Everyone does this, it\'s normal.',
  'I have no willpower.'
]

// The daily check-in prompts. Sleep + exercise are the two documented ADHD levers.
export const DAILY_LEVERS = {
  sleep: { label: 'Slept 7+ hrs', icon: 'moon', note: 'Sleep debt raises dopamine hunger' },
  exercise: { label: 'Moved 20+ min', icon: 'dumbbell', note: 'Exercise is the legal dopamine hit' }
}

// ————— Daily Practices —————
// Your routine becomes a daily checklist. Faith template mirrors the practices
// that build a spiritual recovery anchor; secular is the science-only core.
export const PRACTICE_TEMPLATES = {
  faith: {
    id: 'faith',
    label: 'Faith-based',
    icon: 'star',
    desc: 'Prayer, Quran, gratitude, dua and CBA review — a daily spiritual anchor.',
    items: [
      { name: '2 rak\'ahs Salat al-Hajah', icon: 'activity' },
      { name: 'Read 5 verses with meaning', icon: 'book' },
      { name: 'Listen to Quran recitation', icon: 'wave' },
      { name: 'Write a gratitude list', icon: 'heart' },
      { name: 'Make dua for strength', icon: 'star' },
      { name: 'Read your CBA sheet', icon: 'chart' }
    ]
  },
  secular: {
    id: 'secular',
    label: 'Secular',
    icon: 'leaf',
    desc: 'Mood check, movement, CBA review and one small win — pure behavior science.',
    items: [
      { name: 'Morning check-in', icon: 'wave' },
      { name: '20 minutes of movement', icon: 'dumbbell' },
      { name: 'Read your CBA sheet', icon: 'chart' },
      { name: 'One small win', icon: 'bolt' },
      { name: 'Evening gratitude', icon: 'heart' }
    ]
  }
}

export const PRACTICE_ICON_CHOICES = [
  { id: 'activity', label: 'Heart' },
  { id: 'book', label: 'Book' },
  { id: 'wave', label: 'Wave' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'chart', label: 'Chart' },
  { id: 'bolt', label: 'Bolt' },
  { id: 'dumbbell', label: 'Weights' },
  { id: 'moon', label: 'Moon' },
  { id: 'users', label: 'People' },
  { id: 'edit', label: 'Pen' },
  { id: 'shield', label: 'Shield' }
]

export const GRATITUDE_PROMPTS = [
  'One thing that went well today',
  'One person you\'re grateful for',
  'One small thing that made you smile',
  'One thing your body did for you',
  'One challenge you faced today'
]

// ————— Islamic module (off by default) —————
// Faith content surfaced in the panic moment and daily practices. Translations
// are provided for understanding — verify against a trusted scholar/source.
export const FAITH = {
  duas: [
    {
      title: 'Dua for strength',
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',
      translit: 'Allahumma inni as\'aluka al-\'afwa wal-\'afiyah',
      meaning: 'O Allah, I ask You for pardon and well-being.'
    },
    {
      title: 'Firmness of heart',
      arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
      translit: 'Ya muqallibal-qulub, thabbit qalbi \'ala dinik',
      meaning: 'O Turner of hearts, make my heart firm upon Your religion.'
    },
    {
      title: 'Dua of Yunus (for distress)',
      arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
      translit: 'La ilaha illa anta, subhanaka inni kuntu minaz-zalimin',
      meaning: 'There is no god but You, glory be to You — indeed, I was of the wrongdoers.'
    }
  ],
  verses: [
    { ref: 'Al-Baqarah 2:153', arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', meaning: 'Indeed, Allah is with the patient.' },
    { ref: 'Āli ʿImrān 3:139', arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ', meaning: 'Do not weaken and do not grieve, for you will be superior if you are believers.' },
    { ref: 'Al-Ankabut 29:69', arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا', meaning: 'And those who strive for Us — We will surely guide them to Our ways.' },
    { ref: 'Ash-Sharh 94:5-6', arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', meaning: 'Indeed, with hardship comes ease.' },
    { ref: 'An-Nur 24:30', arabic: 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ', meaning: 'Tell the believing men to lower their gaze and guard their chastity.' }
  ],
  salatHajah: {
    title: 'Salat al-Hajah',
    text: 'Pray 2 rak\'ahs with sincere intention, praise Allah and send blessings upon the Prophet ﷺ, then make your dua. Best performed at a time when prayer is not disliked.'
  },
  prayerNote: 'Wudu before the panic moment — the physical act itself interrupts the urge loop.'
}

// ————— CBA worksheet (SMART Cost-Benefit Analysis) —————
export const CBA_QUADRANTS = [
  { key: 'prosUse', title: 'What porn gives you', hint: 'Be honest. If it gave nothing, you wouldn\'t be here.' },
  { key: 'consUse', title: 'What it costs you', hint: 'The real price — energy, focus, shame, relationships.' },
  { key: 'prosQuit', title: 'What quitting gives you', hint: 'The life on the other side.' },
  { key: 'consQuit', title: 'What quitting costs you', hint: 'The discomfort. Name it so it loses power.' }
]

export const BLOCKING_GUIDES = {
  android: {
    title: 'Android',
    icon: 'android',
    steps: [
      {
        t: 'Private DNS (best free option — no app)',
        d: 'Settings → Network & internet → Private DNS → set to dns.adguard-dns.com. Filters adult content at the network level, on every browser and app, with zero battery cost.',
        action: 'dns.adguard-dns.com'
      },
      {
        t: 'AdGuard app (optional, stronger)',
        d: 'Install AdGuard → enable "DNS protection" → pick a Family filter or add a custom blocklist of the domains below. Runs as a local VPN; blocks ads + adult content in-app.',
        action: 'custom blocklist'
      },
      {
        t: 'SafeSearch on',
        d: 'In Chrome: Settings → Search engines → SafeSearch → On. This scrubs explicit results from Google.',
        action: ''
      },
      {
        t: 'App timer + uninstall friction',
        d: 'Digital Wellbeing → App timers on your riskiest apps. For serious friction, put the blocklist on a Pi-hole or use an app-locker that requires a PIN you don\'t know.',
        action: ''
      }
    ],
    note: 'Android is the strongest platform for this — Private DNS alone blocks system-wide, and a PWA works fully offline here.'
  },
  iphone: {
    title: 'iPhone',
    icon: 'phone',
    steps: [
      {
        t: 'Screen Time — the honest answer',
        d: 'Settings → Screen Time → Content & Privacy Restrictions → Content Restrictions → Web Content → "Limit Adult Websites". Add the blocked domains below to "Never Allow".',
        action: 'never allow list'
      },
      {
        t: 'Let your ally hold the passcode',
        d: 'The only way this holds: someone you trust sets and keeps the Screen Time passcode. You can\'t unlock it mid-urge.',
        action: ''
      },
      {
        t: 'Sensitive Content Warning',
        d: 'Settings → Privacy & Security → Sensitive Content Warning → On. Blurs explicit content that arrives via Messages/AirDrop.',
        action: ''
      },
      {
        t: 'Install the app as a PWA',
        d: 'Safari → Share → Add to Home Screen. It then runs fullscreen, offline.',
        action: ''
      }
    ],
    note: 'On iPhone no app can fully block its own removal. Screen Time with an ally-held passcode is the real mechanism.'
  },
  windows: {
    title: 'Windows',
    icon: 'monitor',
    steps: [
      {
        t: 'Hosts file blocklist',
        d: 'Paste the generated entries below into C:\\Windows\\System32\\drivers\\etc\\hosts as admin, then run ipconfig /flushdns.',
        action: 'generate + copy below'
      },
      {
        t: 'DNS-level filter',
        d: 'Set your router or network adapter to a family DNS (e.g. 176.103.130.130) for device-wide filtering.',
        action: ''
      }
    ],
    note: 'Hosts file works system-wide for every browser, but a savvy user can still edit it — pair with accountability.'
  }
}

export const DAILY_REVIEW_NOTES = {
  good: 'Fewer urges, more check-ins. The curve is bending.',
  mixed: 'Some days strong, some not. Consistency beats perfection.',
  hard: 'High urge days are when the skills earn their keep.'
}
