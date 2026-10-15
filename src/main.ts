import './style.css'
import { createAudio } from './audio'
import { createInput } from './input'
import { createStage } from './render/stage'
import { clamp } from './sim/math'
import { STEP } from './sim/tune'
import { step } from './sim/step'
import type { Player, World } from './sim/types'
import { isPlayer } from './sim/types'
import { mountUi } from './ui'
import { chooseSeal, createShowcase, startRun } from './sim/world'

const canvas = document.querySelector('#view')
const overlay = document.querySelector('#overlay')
if (!(canvas instanceof HTMLCanvasElement) || !(overlay instanceof HTMLElement)) {
  throw new Error('missing game mount')
}

const stage = createStage(canvas)
const input = createInput(canvas)
const audio = createAudio()
const ui = mountUi(overlay)

function loadBest(): number {
  try {
    const raw = localStorage.getItem('kagero.best')
    if (!raw) return 0
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) return 0
    return Math.floor(value)
  } catch {
    return 0
  }
}

function saveBest(value: number): void {
  try {
    localStorage.setItem('kagero.best', String(value))
  } catch {
    return
  }
}

let best = loadBest()
let world: World = createShowcase(best)
let yaw = Math.PI
let dist = 9.4
let acc = 0
let last = performance.now()
let watchHp = 100
let watchCombo = 0
let watchAction = 'idle'

function player(): Player | null {
  const actor = world.actors.find(isPlayer)
  return actor ?? null
}

function rememberBest(): void {
  if (world.bestFloor > best) {
    best = world.bestFloor
    saveBest(best)
  }
}

function descend(): void {
  audio.resume()
  audio.ui()
  world = startRun(best)
  rememberBest()
  yaw = Math.PI
  dist = 9.4
  acc = 0
  watchHp = player()?.hp ?? 100
  watchCombo = 0
  watchAction = 'idle'
}

function backToTitle(): void {
  audio.ui()
  world = createShowcase(best)
  yaw = Math.PI
}

ui.bindPad(
  (code) => input.hold(code),
  (code) => input.release(code),
)

ui.setHandlers({
  descend,
  seal(index) {
    audio.ui()
    audio.fanfare()
    chooseSeal(world, index)
    rememberBest()
    watchHp = player()?.hp ?? watchHp
    watchAction = 'idle'
  },
  title: backToTitle,
  resume() {
    if (world.phase.kind === 'pause') world.phase = { kind: 'play' }
  },
  mute() {
    audio.toggleMute()
    audio.resume()
  },
})

function react(): void {
  const actor = player()
  if (!actor) return
  if (actor.hp < watchHp - 0.5) audio.hurt()
  else if (actor.hp > watchHp + 0.5 && world.phase.kind === 'play') audio.pickup()
  if (actor.combo > watchCombo) audio.hit()
  const action = actor.action.kind
  if (action === 'dash' && watchAction !== 'dash') audio.dash()
  if ((action === 'light' || action === 'heavy') && action !== watchAction) audio.slash()
  if ((action === 'cinder' || action === 'mirror' || action === 'palm') && action !== watchAction) audio.jutsu()
  watchHp = actor.hp
  watchCombo = actor.combo
  watchAction = action
}

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (input.turnLeft()) yaw -= dt * 1.7
  if (input.turnRight()) yaw += dt * 1.7
  yaw += input.pullDrag()
  dist = clamp(dist + input.pullWheel(), 6.8, 16)
  if (input.resetCam()) yaw = Math.PI

  const sample = input.frame(yaw)
  if (world.phase.kind === 'title') {
    yaw += dt * 0.15
    if (input.confirmEdge()) descend()
  } else if (world.phase.kind === 'play') {
    acc += dt
    let first = true
    while (acc >= STEP) {
      step(
        world,
        first
          ? sample
          : {
              ...sample,
              heavy: false,
              dash: false,
              jutsu: false,
              lock: false,
              cycle: false,
            },
        STEP,
      )
      react()
      acc -= STEP
      first = false
    }
    rememberBest()
  } else if (world.phase.kind === 'reward') {
    const slot = input.sealSlot()
    if (slot != null) {
      audio.ui()
      audio.fanfare()
      chooseSeal(world, slot)
      rememberBest()
    }
  } else if (world.phase.kind === 'downed') {
    if (input.confirmEdge()) backToTitle()
  }

  if (input.pauseEdge()) {
    if (world.phase.kind === 'play') world.phase = { kind: 'pause' }
    else if (world.phase.kind === 'pause') world.phase = { kind: 'play' }
  }

  audio.pump()
  stage.draw(world, { yaw, dist, shake: world.shake }, dt)
  ui.sync(
    world,
    world.popups.map((popup) => {
      const pos = stage.project(popup.x, 1.8, popup.z)
      return {
        x: pos.x,
        y: pos.y,
        visible: pos.visible,
        text: popup.text,
        style: popup.style,
        life: popup.life,
        max: popup.max,
      }
    }),
    audio.muted(),
  )
  input.endFrame()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', () => stage.resize())
stage.draw(world, { yaw, dist, shake: 0 }, 0.016)
ui.sync(world, [], audio.muted())
requestAnimationFrame(frame)
