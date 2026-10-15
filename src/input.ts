import { wishFromStick } from './sim/math'
import type { InputFrame } from './sim/types'

export type Input = {
  frame: (yaw: number) => InputFrame
  turnLeft: () => boolean
  turnRight: () => boolean
  resetCam: () => boolean
  pullDrag: () => number
  pullWheel: () => number
  pauseEdge: () => boolean
  confirmEdge: () => boolean
  sealSlot: () => number | null
  endFrame: () => void
  hold: (code: string) => void
  release: (code: string) => void
}

export function createInput(canvas: HTMLCanvasElement): Input {
  const down = new Set<string>()
  const pressed = new Set<string>()
  let drag = 0
  let wheel = 0
  let dragging = false
  let mouseLight = false

  const onKeyDown = (event: KeyboardEvent) => {
    const code = controlCode(event)
    if (code === 'Tab' || code === 'Space' || code.startsWith('Arrow')) event.preventDefault()
    if (!event.repeat) pressed.add(code)
    down.add(code)
  }
  const onKeyUp = (event: KeyboardEvent) => {
    down.delete(controlCode(event))
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 2) {
      dragging = true
      canvas.setPointerCapture(event.pointerId)
    }
    if (event.button === 0) mouseLight = true
  }
  const onPointerUp = (event: PointerEvent) => {
    if (event.button === 2) dragging = false
    if (event.button === 0) mouseLight = false
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    drag += event.movementX * 0.005
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    wheel += Math.sign(event.deltaY) * 0.55
  }
  const onContext = (event: Event) => {
    event.preventDefault()
  }
  const onBlur = () => {
    down.clear()
    dragging = false
    mouseLight = false
  }

  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContext)
  window.addEventListener('blur', onBlur)

  const held = (code: string) => down.has(code)
  const consume = (code: string) => {
    const hit = pressed.has(code)
    if (hit) pressed.delete(code)
    return hit
  }

  return {
    frame(yaw: number): InputFrame {
      let stickX = 0
      let stickY = 0
      if (held('KeyA') || held('ArrowLeft')) stickX -= 1
      if (held('KeyD') || held('ArrowRight')) stickX += 1
      if (held('KeyW') || held('ArrowUp')) stickY += 1
      if (held('KeyS') || held('ArrowDown')) stickY -= 1
      const wish = wishFromStick(yaw, stickX, stickY)
      const lightEdge = consume('KeyJ')
      return {
        wishX: wish.x,
        wishZ: wish.z,
        lightHeld: mouseLight || held('KeyJ') || lightEdge,
        heavy: consume('KeyK'),
        dash: consume('ShiftLeft') || consume('ShiftRight') || consume('Space'),
        jutsu: consume('KeyL'),
        lock: consume('KeyF'),
        cycle: consume('Tab'),
      }
    },
    turnLeft: () => held('KeyQ'),
    turnRight: () => held('KeyE'),
    resetCam: () => consume('KeyR'),
    pullDrag: () => {
      const value = drag
      drag = 0
      return value
    },
    pullWheel: () => {
      const value = wheel
      wheel = 0
      return value
    },
    pauseEdge: () => consume('Escape'),
    confirmEdge: () => consume('Enter'),
    sealSlot: () => {
      if (consume('Digit1') || consume('Numpad1')) return 0
      if (consume('Digit2') || consume('Numpad2')) return 1
      if (consume('Digit3') || consume('Numpad3')) return 2
      return null
    },
    hold(code: string) {
      down.add(code)
      pressed.add(code)
    },
    release(code: string) {
      down.delete(code)
    },
    endFrame: () => undefined,
  }
}

function controlCode(event: KeyboardEvent): string {
  const code = event.code
  if (code && code !== 'Unidentified' && code.length > 1) return code
  const key = event.key.toLowerCase()
  const named: Record<string, string> = {
    w: 'KeyW',
    a: 'KeyA',
    s: 'KeyS',
    d: 'KeyD',
    j: 'KeyJ',
    k: 'KeyK',
    l: 'KeyL',
    q: 'KeyQ',
    e: 'KeyE',
    r: 'KeyR',
    f: 'KeyF',
    ' ': 'Space',
    escape: 'Escape',
    enter: 'Enter',
    tab: 'Tab',
    shift: 'ShiftLeft',
    '1': 'Digit1',
    '2': 'Digit2',
    '3': 'Digit3',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
  }
  return named[key] ?? event.code
}
