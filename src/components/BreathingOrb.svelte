<script>
  let { phase = 'inhale', label = 'Breathe in', progress = 0, seconds = 0 } = $props()

  const circumference = 603.19
  const dashOffset = $derived(circumference * (1 - Math.min(100, Math.max(0, progress)) / 100))
</script>

<div class="breath-instrument" class:inhale={phase === 'inhale'} class:exhale={phase === 'exhale'} class:hold={phase === 'hold' || phase === 'holdout'}>
  <svg class="breath-svg" viewBox="0 0 240 240" role="img" aria-label={`${label}, ${seconds} seconds`}>
    <defs>
      <radialGradient id="orb-core" cx="36%" cy="28%" r="76%">
        <stop offset="0" stop-color="#b9fff2" stop-opacity=".95" />
        <stop offset=".4" stop-color="#5eead4" stop-opacity=".78" />
        <stop offset="1" stop-color="#1a756c" stop-opacity=".32" />
      </radialGradient>
      <linearGradient id="orbit-line" x1="25" y1="30" x2="215" y2="210" gradientUnits="userSpaceOnUse">
        <stop stop-color="#a78bfa" stop-opacity=".42" />
        <stop offset=".48" stop-color="#5eead4" stop-opacity=".9" />
        <stop offset="1" stop-color="#7dd3fc" stop-opacity=".25" />
      </linearGradient>
      <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <clipPath id="orb-clip"><circle cx="120" cy="120" r="67" /></clipPath>
    </defs>

    <circle class="halo halo-a" cx="120" cy="120" r="82" />
    <circle class="halo halo-b" cx="120" cy="120" r="96" />
    <circle class="orbit-track" cx="120" cy="120" r="96" />
    <circle class="orbit-progress" cx="120" cy="120" r="96" style={`stroke-dashoffset:${dashOffset}`} />
    <g class="ticks">
      {#each Array(12) as _, index (index)}
        <line x1="120" y1="12" x2="120" y2={index % 3 === 0 ? 19 : 16} transform={`rotate(${index * 30} 120 120)`} />
      {/each}
    </g>

    <g class="orb-group">
      <circle class="orb-glow" cx="120" cy="120" r="67" />
      <circle class="orb" cx="120" cy="120" r="67" />
      <g clip-path="url(#orb-clip)" class="inner-waves">
        <path d="M35 113c22-18 41-18 62 0s42 18 64 0 42-18 65 0" />
        <path d="M22 137c25-17 46-17 69 0s45 17 68 0 44-17 69 0" />
      </g>
    </g>
  </svg>

  <div class="breath-copy" aria-hidden="true">
    <span>{label}</span>
    <strong>{seconds}</strong>
    <small>{phase === 'exhale' ? 'slowly' : phase === 'inhale' ? 'gently' : 'stay soft'}</small>
  </div>
</div>

<style>
  .breath-instrument { --breath-scale:.9; position:relative; width:min(76vw,310px); aspect-ratio:1; display:grid; place-items:center; isolation:isolate; }
  .breath-instrument.inhale { --breath-scale:1.08; }
  .breath-instrument.exhale { --breath-scale:.86; }
  .breath-instrument.hold { --breath-scale:1.02; }
  .breath-svg { width:100%; height:100%; overflow:visible; filter:drop-shadow(0 26px 50px rgba(0,0,0,.3)); }
  .halo { fill:none; stroke:url(#orbit-line); transform-origin:120px 120px; opacity:.22; transition:transform 1.1s var(--spring), opacity .8s var(--spring); }
  .halo-a { r:82; stroke-width:1.2; stroke-dasharray:5 9; animation:orbit 18s cubic-bezier(.45,.05,.55,.95) infinite; }
  .halo-b { r:96; stroke-width:.8; stroke-dasharray:2 14; animation:orbit-reverse 27s cubic-bezier(.45,.05,.55,.95) infinite; }
  .inhale .halo { opacity:.5; transform:scale(1.04); }
  .exhale .halo { opacity:.16; transform:scale(.96); }
  .orbit-track { fill:none; stroke:rgba(255,255,255,.055); stroke-width:3; }
  .orbit-progress { fill:none; stroke:url(#orbit-line); stroke-width:3; stroke-linecap:round; stroke-dasharray:603.19; transform:rotate(-90deg); transform-origin:120px 120px; transition:stroke-dashoffset .14s cubic-bezier(.32,.72,0,1); }
  .ticks line { stroke:rgba(255,255,255,.17); stroke-width:1; stroke-linecap:round; }
  .orb-group { transform-origin:120px 120px; transform:scale(var(--breath-scale)); transition:transform 1.15s cubic-bezier(.32,.72,0,1); }
  .orb-glow { fill:#5eead4; opacity:.2; filter:url(#soft-glow); }
  .orb { fill:url(#orb-core); stroke:rgba(209,255,247,.36); stroke-width:1; }
  .inner-waves { opacity:.52; }
  .inner-waves path { fill:none; stroke:rgba(3,34,31,.45); stroke-width:4; stroke-linecap:round; stroke-dasharray:14 8; animation:wave-drift 5s cubic-bezier(.32,.72,0,1) infinite; }
  .inner-waves path:last-child { stroke:rgba(255,255,255,.28); stroke-width:2; animation-direction:reverse; animation-duration:7s; }
  .breath-copy { position:absolute; display:flex; flex-direction:column; align-items:center; pointer-events:none; color:#052d28; text-shadow:0 1px 0 rgba(255,255,255,.25); }
  .breath-copy span { max-width:110px; font-size:.78rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
  .breath-copy strong { font-size:3.3rem; line-height:1; letter-spacing:-.06em; margin:2px 0; }
  .breath-copy small { font-size:.66rem; font-weight:700; opacity:.64; letter-spacing:.12em; text-transform:uppercase; }
  @keyframes orbit { to { transform:rotate(360deg); } }
  @keyframes orbit-reverse { to { transform:rotate(-360deg); } }
  @keyframes wave-drift { to { stroke-dashoffset:-44; } }
  @media (prefers-reduced-motion:reduce) {
    .halo, .inner-waves path { animation:none; }
    .orb-group { transition-duration:.15s; }
  }
</style>
