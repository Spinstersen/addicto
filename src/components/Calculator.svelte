<script>
  import { vibrate } from '../lib/helpers.js'
  import Icon from '../lib/Icon.svelte'

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

<div class="calc">
  <div class="calc-head">
    <span class="calc-brand"></span>
    <span class="calc-hint"><Icon name="lock" size={14} /></span>
  </div>

  <div class="calc-screen">
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
      >
        {k.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .calc {
    max-width: 420px;
    margin: 0 auto;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: calc(18px + var(--safe-top)) 18px calc(18px + var(--safe-bottom));
    background: var(--bg-deep);
  }
  .calc-head {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 28px;
  }
  .calc-hint {
    display: flex;
    align-items: center;
    color: var(--text-4);
  }
  .calc-hint :global(svg) { stroke: var(--text-4); }
  .calc-screen {
    margin-top: 6px;
    padding: 26px 22px;
    border-radius: 24px;
    background: linear-gradient(180deg, #0a1220, #0d1626);
    border: 1px solid var(--hairline);
    box-shadow: inset 0 2px 14px rgba(0, 0, 0, 0.5);
    text-align: right;
    direction: ltr;
  }
  .calc-expr {
    font-size: 0.95rem;
    color: var(--text-4);
    min-height: 1.4rem;
    word-break: break-all;
  }
  .calc-display {
    font-size: 3rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    word-break: break-all;
  }
  .calc-display.error { color: var(--danger); }
  .calc-keys {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-content: end;
    margin-top: 18px;
  }
  .calc-key {
    height: 68px;
    border-radius: 22px;
    background: linear-gradient(180deg, #232f47, #1c2740);
    border: 1px solid var(--hairline);
    box-shadow: var(--hairline-shadow), 0 6px 0 #131c30;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s var(--spring), filter 0.15s;
  }
  .calc-key:active {
    transform: translateY(4px);
    box-shadow: var(--hairline-shadow), 0 2px 0 #131c30;
  }
  .calc-key.fn { color: var(--acc); font-size: 1.25rem; }
  .calc-key.op {
    background: linear-gradient(180deg, #2b3d5c, #22314b);
    color: var(--acc);
    font-size: 1.7rem;
  }
  .calc-key.eq {
    background: linear-gradient(180deg, #34d399, #22b380);
    color: #04251f;
    font-size: 1.8rem;
    box-shadow: 0 6px 0 #0d5e44, 0 8px 26px -8px var(--acc-glow);
  }
</style>
