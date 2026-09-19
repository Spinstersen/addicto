import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const appUrl = process.env.ADDICTO_URL || 'http://127.0.0.1:5173/'
const bravePath = process.env.BRAVE_PATH || 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
const port = 9333
const profile = await mkdtemp(join(tmpdir(), 'addicto-smoke-'))
const keepScreenshots = process.env.KEEP_QA_SCREENSHOTS === '1'
const screenshotPath = resolve('.qa-home.png')
const breathingScreenshotPath = resolve('.qa-breathing.png')
const calculatorScreenshotPath = resolve('.qa-calculator.png')
const quickScreenshotPath = resolve('.qa-quick.png')
const exerciseScreenshotPath = resolve('.qa-exercise.png')
const reportScreenshotPath = resolve('.qa-report.png')

const browser = spawn(bravePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  appUrl
], { windowsHide: true, stdio: 'ignore' })

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms))

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const pages = await response.json()
      const page = pages.find((item) => item.type === 'page' && item.url.startsWith(appUrl))
      if (page) return page
    } catch {}
    await delay(100)
  }
  throw new Error('Brave DevTools endpoint did not become ready')
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (!message.id || !this.pending.has(message.id)) return
      const { resolve: done, reject } = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else done(message.result)
    }
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return
    await new Promise((done, reject) => {
      this.socket.onopen = done
      this.socket.onerror = reject
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((done, reject) => {
      this.pending.set(id, { resolve: done, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }
}

let cdp

async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description
      || result.exceptionDetails.exception?.value
      || result.exceptionDetails.text
    throw new Error(String(description))
  }
  return result.result.value
}

async function waitForText(text, timeout = 8000) {
  const deadline = Date.now() + timeout
  let lastEvaluationError
  while (Date.now() < deadline) {
    try {
      if (await evaluate(`document.body?.innerText.toLocaleLowerCase().includes(${JSON.stringify(text.toLocaleLowerCase())}) ?? false`)) return
      lastEvaluationError = undefined
    } catch (error) {
      // Navigation can briefly invalidate the execution context. Retry until
      // the same deadline used for the element wait instead of failing early.
      lastEvaluationError = error
    }
    await delay(80)
  }
  let body = ''
  try {
    body = await evaluate('document.body?.innerText ?? ""')
  } catch {}
  const context = lastEvaluationError ? ` Last evaluation error: ${lastEvaluationError.message}` : ''
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}. Body starts: ${body.slice(0, 500)}${context}`)
}

async function waitForSelector(selector, timeout = 8000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      if (await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) return
    } catch {}
    await delay(80)
  }
  throw new Error(`Timed out waiting for selector ${selector}`)
}

async function clickText(text) {
  const clicked = await evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const node = [...document.querySelectorAll('button')].find((item) => item.innerText.trim().includes(wanted));
    if (!node) return false;
    node.click();
    return true;
  })()`)
  if (!clicked) throw new Error(`Button not found: ${text}`)
  await delay(80)
}

async function clickLabel(label) {
  const clicked = await evaluate(`(() => {
    const node = document.querySelector('[aria-label=${JSON.stringify(label)}]');
    if (!node) return false;
    node.click();
    return true;
  })()`)
  if (!clicked) throw new Error(`Label not found: ${label}`)
  await delay(80)
}

async function clickButtonLabel(label) {
  const clicked = await evaluate(`(() => {
    const node = document.querySelector('button[aria-label=${JSON.stringify(label)}]');
    if (!node) return false;
    node.click();
    return true;
  })()`)
  if (!clicked) throw new Error(`Button label not found: ${label}`)
  await delay(100)
}

async function setValue(selector, value, index = 0) {
  const changed = await evaluate(`(() => {
    const node = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!node) return false;
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value');
    descriptor.set.call(node, ${JSON.stringify(String(value))});
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  if (!changed) throw new Error(`Input not found: ${selector}[${index}]`)
  await delay(50)
}

try {
  const page = await waitForEndpoint()
  cdp = new Cdp(page.webSocketDebuggerUrl)
  await cdp.open()
  await cdp.send('Runtime.enable')
  await cdp.send('Page.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })

  await waitForText('Change the pattern')
  await clickText('Continue')
  await waitForText('meaningful change')
  await clickText('Regain choice and control')
  await clickText('Continue')
  await waitForText('Focus on control and impact')
  await clickText('Loss of control')
  await clickText('Real-life impact')
  await clickText('Persistent pattern')
  await clickText('Continue')
  await waitForText('What are you moving toward')
  await clickText('Health')
  await setValue('textarea', 'I want to be present and choose how I use my time.')
  await clickText('Continue')
  await waitForText('Write a small plan')
  await setValue('input.field', 'late at night, alone', 0)
  await setValue('input.field', 'leave the room, take a walk', 1)
  await setValue('input.field', 'trusted friend', 2)
  await clickText('Build my plan')
  await waitForText('Make the next choice easier')

  await clickText('Help me now')
  await waitForText('Immediate support')
  await waitForText('decision delayed')
  const quickBreathingStarted = await evaluate("document.querySelectorAll('.quick-stage-core .breath-instrument svg path').length >= 2")
  if (!quickBreathingStarted) throw new Error('One-tap emergency breathing did not start')
  if (keepScreenshots) {
    await delay(850)
    const quickShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(quickScreenshotPath, Buffer.from(quickShot.data, 'base64'))
  }
  await clickText('Stand up and leave this room')
  await waitForText('Location changed')
  await clickText('Check the urge')
  await waitForText('How strong is it now')
  await setValue('input[type="range"]', 4)
  await clickText('Save this session')
  await waitForText('You rode it out')
  await clickText("I'm okay now")

  await clickText('Open the full guided toolkit')
  await waitForText('How strong is the urge right now')
  await setValue('input[type="range"]', 8)
  await clickText('Choose a coping action')
  await waitForText('You are riding it out')
  await clickText('Guided breathing')
  await waitForText('Breathe in')
  const hasBreathingSvg = await evaluate("document.querySelectorAll('.breath-instrument svg path').length >= 2")
  if (!hasBreathingSvg) throw new Error('Animated breathing SVG did not render')
  await delay(650)
  const breathingShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  if (keepScreenshots) await writeFile(breathingScreenshotPath, Buffer.from(breathingShot.data, 'base64'))
  await clickText('back')
  await waitForText('You are riding it out')
  await clickText('Check the urge again')
  await waitForText('How strong is it now')
  await setValue('input[type="range"]', 3)
  await clickText('Save this session')
  await waitForText('You rode it out')
  await clickText("I'm okay now")

  await waitForText('Your coping signal')
  await clickText('Replacement menu')
  await waitForText('Guided actions')
  await clickText('Five-senses grounding')
  await waitForText('things you can see')
  const groundingAnimated = await evaluate("document.querySelectorAll('.sense-orbit > span').length === 5")
  if (!groundingAnimated) throw new Error('Five-senses grounding scene did not render')
  await clickText('I notice one')
  const groundingAdvanced = await evaluate("document.querySelector('.sense-center strong')?.innerText === '4'")
  if (!groundingAdvanced) throw new Error('Five-senses grounding interaction did not advance')
  if (keepScreenshots) {
    await delay(850)
    const exerciseShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(exerciseScreenshotPath, Buffer.from(exerciseShot.data, 'base64'))
  }
  await clickButtonLabel('Muscle release')
  await waitForText('Tap to tense gently')
  await clickText('Tap to tense gently')
  const muscleTensed = await evaluate("document.querySelector('.muscle-stage')?.classList.contains('tense')")
  if (!muscleTensed) throw new Error('Muscle-release animation did not enter its tense phase')
  await clickButtonLabel('Mindful observation')
  await waitForText('Notice its outline')
  await clickButtonLabel('Leave the room')
  await waitForText('Stand up in')
  const leaveStart = await evaluate("document.querySelector('.door-stage h2')?.innerText")
  await delay(1100)
  const leaveAfter = await evaluate("document.querySelector('.door-stage h2')?.innerText")
  if (leaveStart === leaveAfter) throw new Error('Leave-the-room countdown did not advance')
  await clickButtonLabel('Values decision')
  await waitForText('Choose a value')
  await clickText('Health')
  const valueFlipped = await evaluate("document.querySelector('.value-deck')?.classList.contains('flipped')")
  if (!valueFlipped) throw new Error('Values card did not flip')
  await clickButtonLabel('Change location')
  await waitForText('Where are you now')
  await clickText('Bed')
  await clickText('Another room')
  const locationMoved = await evaluate("document.querySelector('.location-stage')?.classList.contains('moving')")
  if (!locationMoved) throw new Error('Location-change confirmation did not animate')
  await clickButtonLabel('Delay the choice')
  await waitForText('How much space can you make')
  const delayStarted = await evaluate(`(() => {
    const node = [...document.querySelectorAll('.delay-options button')].find((button) => button.innerText.trim() === '2 min');
    if (!node) return false;
    node.click();
    return true;
  })()`)
  if (!delayStarted) throw new Error('Delayed-choice timer option was not available')
  await waitForText('2:00')
  const allExerciseScenesRendered = await evaluate("document.querySelectorAll('.exercise-switcher button').length === 7 && !!document.querySelector('.timer-orbit')")
  if (!allExerciseScenesRendered) throw new Error('Guided exercise switcher or delayed-choice scene did not render')
  await clickButtonLabel('Close guided exercise')
  await waitForText('Replacement menu')
  await clickLabel('back')
  await waitForText('Make the next choice easier')

  await clickLabel('Check-in')
  await waitForText('Name the urge')
  await setValue('input[type="range"]', 6)
  await clickText('Alone')
  await clickText('Save check-in')
  await waitForText('Logged')

  await clickLabel('Patterns')
  await waitForText('One pattern. One practical plan')
  await waitForText('What seems to help')
  await waitForText('Most logged contexts')
  await waitForText('alone')
  if (keepScreenshots) {
    await delay(850)
    const reportShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(reportScreenshotPath, Buffer.from(reportShot.data, 'base64'))
  }
  await clickLabel('Now')
  await waitForText('Make the next choice easier')

  await delay(800)
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  if (keepScreenshots) await writeFile(screenshotPath, Buffer.from(shot.data, 'base64'))

  await clickLabel('settings')
  await waitForText('Stealth mode')
  const toggled = await evaluate(`(() => {
    const card = [...document.querySelectorAll('.shell')].find((node) => node.innerText.toLocaleLowerCase().includes('stealth mode'));
    const checkbox = card?.querySelector('input[type="checkbox"]');
    if (!checkbox) return false;
    checkbox.click();
    return true;
  })()`)
  if (!toggled) throw new Error('Stealth mode toggle not found')
  await clickText('Lock now')
  await waitForSelector('.calc')
  await delay(500)
  const calculatorShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  if (keepScreenshots) await writeFile(calculatorScreenshotPath, Buffer.from(calculatorShot.data, 'base64'))
  for (const label of ['7', '+', '5', '=']) await clickLabel(label)
  const calculationWorked = await evaluate("document.querySelector('.calc-display')?.innerText === '12'")
  if (!calculationWorked) throw new Error('Calculator arithmetic failed')
  await clickLabel('C')
  for (const label of ['0', '÷', '0', '=']) await clickLabel(label)
  await waitForText('Your defenses')

  await cdp.send('Page.reload', { ignoreCache: true })
  await waitForSelector('.calc')
  for (const label of ['0', '÷', '0', '=']) await clickLabel(label)
  await waitForText('Make the next choice easier')

  console.log(`PASS: onboarding, one-tap emergency mode, personalized coping signals, seven animated exercises, weekly action plan, check-in, calculator arithmetic, and privacy lock.${keepScreenshots ? ` Screenshots: ${screenshotPath}, ${breathingScreenshotPath}, ${quickScreenshotPath}, ${exerciseScreenshotPath}, ${reportScreenshotPath}, ${calculatorScreenshotPath}` : ''}`)
  await cdp.send('Browser.close')
} finally {
  await delay(250)
  if (!browser.killed) browser.kill()
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
