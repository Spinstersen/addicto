<script>
  import { vibrate } from '../lib/helpers.js'

  let { onunlock } = $props()

  let display = $state('0')
  let expr = $state('')
  let acc = $state(null)
  let op = $state(null)
  let fresh = $state(true)
  let error = $state(false)

  const format = (n) => {
    if (!isFinite(n)) return 'Error'
    const s = String(Math.round(n * 1e10) / 1e10)
    return s.length > 12 ? n.toExponential(6) : s
  }

  function digit(d) {
    if (error) clearAll()
    if (fresh) {
      display = d
      fresh = false
    } else {
      display = display === '0' ? d : display + d
    }
    vibrate(12)
  }

  function dot() {
    if (error) clearAll()
    if (fresh) {
      display = '0.'
      fresh = false
    } else if (!display.includes('.')) {
      display += '.'
    }
    vibrate(12)
  }

  function setOp(nextOp) {
    if (error) clearAll()
    if (op !== null && !fresh) {
      const r = compute(acc, parseFloat(display), op)
      if (!isFinite(r)) {
        error = true
        display = 'Error'
        expr = ''
        op = null
        fresh = true
        return
      }
      acc = r
      display = format(r)
    } else {
      acc = parseFloat(display)
    }
    op = nextOp
    fresh = true
    expr = `${format(acc)} ${op}`
    vibrate(12)
  }

  function compute(a, b, o) {
    if (o === '+') return a + b
    if (o === '−') return a - b
    if (o === '×') return a * b
    if (o === '÷') return a / b
    return b
  }

  function equals() {
    if (op === null) return
    const b = parseFloat(display)
    // Secret unlock: 0 ÷ 0 = opens the real app
    if (op === '÷' && acc === 0 && b === 0) {
      vibrate([40, 30, 60, 40])
      onunlock()
      return
    }
    const r = compute(acc, b, op)
    expr = `${format(acc)} ${op} ${format(b)} =`
    if (!isFinite(r)) {
      error = true
      display = 'Error'
      fresh = true
      op = null
      return
    }
    display = format(r)
    acc = null
    op = null
    fresh = true
    vibrate(12)
  }

  function clearAll() {
    display = '0'
    expr = ''
    acc = null
    op = null
    fresh = true
    error = false
    vibrate(12)
  }

  function clearEntry() {
    display = '0'
    fresh = true
  }

  function backspace() {
    if (fresh || error) return
    display = display.length > 1 ? display.slice(0, -1) : '0'
    if (display === '-' || display === '') display = '0'
  }

  function negate() {
    if (fresh || error) return
    display = display.startsWith('-') ? display.slice(1) : '-' + display
  }

  function percent() {
    if (fresh || error) return
    display = format(parseFloat(display) / 100)
  }

  function sqrt() {
    if (error) return
    const n = parseFloat(display)
    if (n < 0) {
      error = true
      display = 'Error'
      return
    }
    display = format(Math.sqrt(n))
    fresh = true
  }

  function handleKey(event) {
    if (/^[0-9]$/.test(event.key)) {
      digit(event.key)
      return
    }
    if (event.key === '.') dot()
    else if (event.key === '+') setOp('+')
    else if (event.key === '-') setOp('−')
    else if (event.key === '*') setOp('×')
    else if (event.key === '/') setOp('÷')
    else if (event.key === 'Enter' || event.key === '=') equals()
    else if (event.key === 'Backspace') backspace()
    else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') clearAll()
    else if (event.key === '%') percent()
    else return
    event.preventDefault()
  }

  const keys = [
    { label: 'C', cls: 'fn', fn: clearAll },
    { label: '⌫', cls: 'fn', fn: backspace },
    { label: '%', cls: 'fn', fn: percent },
    { label: '÷', cls: 'op', fn: () => setOp('÷') },
    { label: '7', cls: '', fn: () => digit('7') },
    { label: '8', cls: '', fn: () => digit('8') },
    { label: '9', cls: '', fn: () => digit('9') },
    { label: '×', cls: 'op', fn: () => setOp('×') },
    { label: '4', cls: '', fn: () => digit('4') },
    { label: '5', cls: '', fn: () => digit('5') },
    { label: '6', cls: '', fn: () => digit('6') },
    { label: '−', cls: 'op', fn: () => setOp('−') },
    { label: '1', cls: '', fn: () => digit('1') },
    { label: '2', cls: '', fn: () => digit('2') },
    { label: '3', cls: '', fn: () => digit('3') },
    { label: '+', cls: 'op', fn: () => setOp('+') },
    { label: '±', cls: '', fn: negate },
    { label: '0', cls: '', fn: () => digit('0') },
    { label: '.', cls: '', fn: dot },
    { label: '=', cls: 'eq', fn: equals }
  ]
</script>

<svelte:window onkeydown={handleKey} />

<div class="calc">
  <div class="calc-head">
    <div>
      <span class="calc-title">Calculator</span>
      <span class="calc-subtitle">Standard</span>
    </div>
    <span class="calc-status" aria-hidden="true"><i></i><i></i><i></i></span>
  </div>

  <div class="calc-screen" aria-live="polite" aria-atomic="true">
    <div class="screen-glint"></div>
    <div class="calc-expr">{expr}</div>
    <div class="calc-display" class:error={error}>{display}</div>
  </div>

  <div class="calc-keys">
    {#each keys as k (k.label)}
      <button
        class="calc-key"
        class:op={k.cls === 'op'}
        class:eq={k.cls === 'eq'}
        class:fn={k.cls === 'fn'}
        onclick={k.fn}
        aria-label={k.label}
        title={k.label === 'C' ? 'Clear' : k.label === '⌫' ? 'Backspace' : k.label}
      >
        {k.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .calc {
    max-width: 440px;
    width: 100%;
    align-self: center;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: calc(22px + var(--safe-top)) 20px calc(22px + var(--safe-bottom));
    background:
      radial-gradient(32rem 22rem at 100% -8%, rgba(73, 102, 146, .18), transparent 62%),
      linear-gradient(180deg, #080d17, #050912);
  }
  .calc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 0 4px;
    margin-bottom: 14px;
  }
  .calc-title, .calc-subtitle { display:block; }
  .calc-title { color:#dce5f3; font-size:.96rem; font-weight:750; letter-spacing:-.01em; }
  .calc-subtitle { color:#4e5d74; font-size:.58rem; font-weight:750; letter-spacing:.18em; text-transform:uppercase; margin-top:2px; }
  .calc-status { display:flex; align-items:center; gap:4px; padding:10px 12px; border-radius:999px; background:rgba(255,255,255,.025); box-shadow:inset 0 0 0 1px rgba(255,255,255,.045); }
  .calc-status i { width:3px; height:3px; border-radius:50%; background:#5e6d84; }
  .calc-status i:nth-child(2) { opacity:.68; }
  .calc-status i:nth-child(3) { opacity:.38; }
  .calc-screen {
    position:relative;
    overflow:hidden;
    min-height:168px;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    padding: 28px 24px 24px;
    border-radius: 29px;
    background:
      radial-gradient(20rem 10rem at 95% 0, rgba(94, 234, 212, .055), transparent 58%),
      linear-gradient(165deg, #101a29, #0a111e);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.07),
      inset 0 -18px 45px rgba(0,0,0,.18),
      0 24px 55px -34px rgba(0,0,0,.9),
      0 0 0 5px rgba(255,255,255,.018),
      0 0 0 6px rgba(255,255,255,.035);
    text-align: right;
    direction: ltr;
  }
  .screen-glint { position:absolute; width:220px; height:90px; right:-55px; top:-56px; border-radius:50%; background:rgba(255,255,255,.055); transform:rotate(-14deg); filter:blur(2px); pointer-events:none; }
  .calc-expr {
    font-size: 0.88rem;
    color: #526077;
    min-height: 1.4rem;
    word-break: break-all;
    font-variant-numeric: tabular-nums;
  }
  .calc-display {
    font-size: clamp(2.7rem, 15vw, 4.25rem);
    font-weight: 620;
    color: #f3f7fc;
    letter-spacing: -0.055em;
    font-variant-numeric: tabular-nums;
    line-height: 1.04;
    word-break: break-all;
    text-shadow:0 3px 20px rgba(125,211,252,.08);
  }
  .calc-display.error { color: var(--danger); }
  .calc-keys {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(9px, 3vw, 13px);
    align-content: end;
    margin-top: 26px;
  }
  .calc-key {
    height: clamp(58px, 9.4vh, 76px);
    border-radius: 24px;
    background: linear-gradient(155deg, #1d293b, #131d2d);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.085),
      inset 0 -1px 0 rgba(0,0,0,.28),
      0 7px 0 #0a111c,
      0 16px 30px -22px rgba(0,0,0,.9);
    font-size: 1.42rem;
    font-weight: 620;
    color: #dbe5f4;
    display: flex;
    align-items: center;
    justify-content: center;
    transform:translateY(0);
    transition:transform .28s cubic-bezier(.32,.72,0,1), filter .28s cubic-bezier(.32,.72,0,1), box-shadow .28s cubic-bezier(.32,.72,0,1);
  }
  .calc-key:active {
    transform: translateY(5px) scale(.985);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 2px 0 #0a111c;
  }
  .calc-key.fn { color:#9fb0c7; font-size:1.18rem; background:linear-gradient(155deg,#273348,#1b2639); }
  .calc-key.op {
    background: linear-gradient(155deg, #22465a, #173347);
    color: #8debdc;
    font-size: 1.7rem;
  }
  .calc-key.eq {
    background: linear-gradient(155deg, #57dfc0, #2eae91);
    color: #062b27;
    font-size: 1.8rem;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.32), 0 7px 0 #11604f, 0 18px 34px -20px rgba(52,211,153,.8);
  }
  @media (hover:hover) { .calc-key:hover { filter:brightness(1.12); transform:translateY(-2px); } .calc-key:active { transform:translateY(5px) scale(.985); } }
  @media (max-height:690px) { .calc { padding-top:calc(12px + var(--safe-top)); padding-bottom:calc(12px + var(--safe-bottom)); } .calc-head { margin-bottom:8px; } .calc-screen { min-height:125px; padding-top:20px; padding-bottom:18px; } .calc-keys { margin-top:18px; } .calc-key { height:55px; border-radius:19px; } }
  @media (prefers-reduced-motion:reduce) { .calc-key { transition-duration:.01ms; } }
</style>
