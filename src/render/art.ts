export const FRAMES = 8
export const FRAME_W = 160
export const FRAME_H = 200

export type SheetKey =
  | 'player'
  | 'grunt'
  | 'grunt-elite'
  | 'archer'
  | 'archer-elite'
  | 'brute'
  | 'brute-elite'
  | 'clone'
  | 'kurogane'
  | 'futae'
  | 'seijin'

type Look = {
  cloth: string
  dark: string
  skin: string
  hair: string
  accent: string
  metal: string
  blade: string
  eye: string
  bulk: number
  hat: 'none' | 'hood' | 'helm' | 'wide' | 'straw'
  mark: 'band' | 'stitch' | 'mask' | 'beads' | 'none'
}

const LOOKS: Record<SheetKey, Look> = {
  player: {
    cloth: '#243049',
    dark: '#141a28',
    skin: '#f0c7a4',
    hair: '#1a120e',
    accent: '#d94a38',
    metal: '#d7d2c8',
    blade: '#e8eef2',
    eye: '#1b1a22',
    bulk: 1,
    hat: 'none',
    mark: 'band',
  },
  grunt: {
    cloth: '#6d5a48',
    dark: '#3c3128',
    skin: '#c9b296',
    hair: '#2a2118',
    accent: '#8d9a6a',
    metal: '#8a8175',
    blade: '#6b6258',
    eye: '#2a211c',
    bulk: 1,
    hat: 'straw',
    mark: 'stitch',
  },
  'grunt-elite': {
    cloth: '#5c4636',
    dark: '#2c2118',
    skin: '#c9b296',
    hair: '#1a140f',
    accent: '#e4b15a',
    metal: '#e4b15a',
    blade: '#d7c4a4',
    eye: '#3a120e',
    bulk: 1.05,
    hat: 'straw',
    mark: 'stitch',
  },
  archer: {
    cloth: '#3d4a3a',
    dark: '#22281f',
    skin: '#e7c2a2',
    hair: '#241810',
    accent: '#d7d2c8',
    metal: '#b9c0b0',
    blade: '#c5ccd4',
    eye: '#1b1a22',
    bulk: 0.96,
    hat: 'hood',
    mark: 'none',
  },
  'archer-elite': {
    cloth: '#31402e',
    dark: '#1a2218',
    skin: '#e7c2a2',
    hair: '#140e0c',
    accent: '#e4b15a',
    metal: '#e4b15a',
    blade: '#e8eef2',
    eye: '#1b1a22',
    bulk: 1,
    hat: 'hood',
    mark: 'none',
  },
  brute: {
    cloth: '#4a3b46',
    dark: '#241820',
    skin: '#d7b394',
    hair: '#120e0e',
    accent: '#8e3a3a',
    metal: '#8d939c',
    blade: '#d5dde4',
    eye: '#1b1a22',
    bulk: 1.28,
    hat: 'helm',
    mark: 'none',
  },
  'brute-elite': {
    cloth: '#3e2e38',
    dark: '#1a1016',
    skin: '#d7b394',
    hair: '#120e0e',
    accent: '#e4b15a',
    metal: '#e4b15a',
    blade: '#e8eef2',
    eye: '#3a120e',
    bulk: 1.34,
    hat: 'helm',
    mark: 'none',
  },
  clone: {
    cloth: '#3a4e6a',
    dark: '#1c2838',
    skin: '#d5e4f2',
    hair: '#102033',
    accent: '#8fd0ff',
    metal: '#d5e6f5',
    blade: '#f4fbff',
    eye: '#143044',
    bulk: 1,
    hat: 'none',
    mark: 'band',
  },
  kurogane: {
    cloth: '#2a2428',
    dark: '#120e12',
    skin: '#c9a88a',
    hair: '#0c0a0c',
    accent: '#a61f1f',
    metal: '#9aa3ad',
    blade: '#f2f6f8',
    eye: '#e8d7a4',
    bulk: 1.35,
    hat: 'helm',
    mark: 'none',
  },
  futae: {
    cloth: '#f4f1ea',
    dark: '#1a1c22',
    skin: '#f0c7a4',
    hair: '#111114',
    accent: '#d94a38',
    metal: '#1c1e24',
    blade: '#f7f7f5',
    eye: '#1b1a22',
    bulk: 1.05,
    hat: 'none',
    mark: 'mask',
  },
  seijin: {
    cloth: '#efe6d4',
    dark: '#8d3b32',
    skin: '#f2d2b4',
    hair: '#f7f1e6',
    accent: '#d4a24a',
    metal: '#e4b15a',
    blade: '#f4ead7',
    eye: '#3a2418',
    bulk: 1.12,
    hat: 'wide',
    mark: 'beads',
  },
}

const cache = new Map<string, HTMLCanvasElement>()

function canvas(width: number, height: number): HTMLCanvasElement {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return el
}

export function sheet(key: SheetKey): HTMLCanvasElement {
  const found = cache.get(key)
  if (found) return found
  const el = canvas(FRAME_W * FRAMES, FRAME_H)
  const ctx = el.getContext('2d')
  if (!ctx) return el
  const look = LOOKS[key]
  for (let frame = 0; frame < FRAMES; frame += 1) {
    paintActor(ctx, frame * FRAME_W, 0, frame, look, key === 'clone')
  }
  cache.set(key, el)
  return el
}

function paintActor(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  frame: number,
  look: Look,
  ghost: boolean,
): void {
  ctx.save()
  ctx.translate(ox, oy)
  if (ghost) ctx.globalAlpha = 0.82
  const bob = frame === 1 ? -3 : frame === 2 ? 2 : frame === 7 ? -8 : 0
  const lean = frame === 3 ? 6 : frame === 4 ? 10 : frame === 5 ? -6 : 0
  const leg = frame === 1 ? 7 : frame === 2 ? -7 : 0
  const bulk = look.bulk
  ctx.translate(80 + lean, 168 + bob)
  ctx.scale(bulk, bulk)
  ctx.translate(-80, -168)

  rounded(ctx, 68, 132, 12, 28, 6, look.dark)
  rounded(ctx, 92, 132, 12, 28, 6, look.dark)
  if (frame === 1 || frame === 2) {
    ctx.fillStyle = look.dark
    ctx.fillRect(64, 132, 14, 28 + leg)
    ctx.fillRect(90, 132, 14, 28 - leg)
  }
  ctx.fillStyle = '#1a120e'
  ctx.beginPath()
  ctx.ellipse(74, 162, 8, 4, 0, 0, Math.PI * 2)
  ctx.ellipse(98, 162, 8, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  scarf(ctx, frame, look.accent)
  rounded(ctx, 58, 78, 44, 58, 12, look.cloth)
  ctx.fillStyle = look.dark
  ctx.fillRect(76, 84, 8, 40)

  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.arc(80, 62, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.hair
  ctx.beginPath()
  ctx.arc(80, 56, 22, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(58, 50, 44, 12)

  if (look.hat === 'hood') {
    ctx.fillStyle = look.dark
    ctx.beginPath()
    ctx.arc(80, 58, 26, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(54, 52, 52, 16)
  } else if (look.hat === 'helm') {
    ctx.fillStyle = look.metal
    ctx.beginPath()
    ctx.arc(80, 54, 24, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(56, 50, 48, 14)
    ctx.fillStyle = look.accent
    ctx.fillRect(74, 40, 12, 10)
  } else if (look.hat === 'wide') {
    ctx.fillStyle = look.dark
    ctx.beginPath()
    ctx.ellipse(80, 46, 46, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = look.cloth
    ctx.fillRect(66, 28, 28, 16)
  } else if (look.hat === 'straw') {
    ctx.fillStyle = '#c6a15a'
    ctx.beginPath()
    ctx.ellipse(80, 48, 34, 8, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  if (look.mark === 'band') {
    ctx.fillStyle = look.accent
    ctx.fillRect(58, 58, 44, 7)
    ctx.fillStyle = look.metal
    ctx.fillRect(72, 55, 16, 12)
  } else if (look.mark === 'stitch') {
    ctx.strokeStyle = '#3a2418'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(68, 70)
    ctx.lineTo(92, 70)
    ctx.stroke()
  } else if (look.mark === 'mask') {
    ctx.fillStyle = look.dark
    ctx.fillRect(60, 58, 18, 16)
    ctx.fillStyle = look.cloth
    ctx.fillRect(82, 58, 18, 16)
  } else if (look.mark === 'beads') {
    ctx.fillStyle = look.accent
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      ctx.arc(68 + i * 6, 96, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  eye(ctx, 70, 64, look.eye)
  eye(ctx, 90, 64, look.eye)

  if (frame === 3 || frame === 4 || frame === 7) blade(ctx, frame, look)
  if (frame === 6) mudra(ctx, look)
  if (look.hat === 'none' || look.mark === 'band') {
    ctx.fillStyle = look.accent
    ctx.fillRect(96, 86, 10, 16)
  }
  ctx.restore()
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, 3.2, 3.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 0.5, y - 2, 1.4, 1.4)
}

function scarf(ctx: CanvasRenderingContext2D, frame: number, color: string): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const wave = frame === 1 ? 8 : frame === 2 ? -6 : frame === 7 ? 18 : 4
  ctx.beginPath()
  ctx.moveTo(92, 78)
  ctx.quadraticCurveTo(112, 90 + wave, 124, 74 + wave)
  ctx.stroke()
}

function blade(ctx: CanvasRenderingContext2D, frame: number, look: Look): void {
  ctx.save()
  ctx.translate(108, 96)
  ctx.rotate(frame === 4 ? -0.9 : frame === 7 ? 0.4 : -0.4)
  ctx.fillStyle = look.metal
  ctx.fillRect(-3, -6, 6, 10)
  ctx.fillStyle = look.blade
  ctx.fillRect(-2, -48, 4, 44)
  ctx.fillStyle = look.accent
  if (frame === 3 || frame === 4) {
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.arc(0, -10, frame === 4 ? 34 : 26, Math.PI * 1.15, Math.PI * 1.85)
    ctx.lineWidth = 6
    ctx.strokeStyle = look.accent
    ctx.stroke()
  }
  ctx.restore()
}

function mudra(ctx: CanvasRenderingContext2D, look: Look): void {
  ctx.fillStyle = look.skin
  ctx.beginPath()
  ctx.arc(64, 108, 7, 0, Math.PI * 2)
  ctx.arc(96, 108, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = look.accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(80, 100, 18, 0.2, Math.PI - 0.2)
  ctx.stroke()
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

export function groundCanvas(bossRoom: boolean): HTMLCanvasElement {
  const key = bossRoom ? 'ground-boss' : 'ground-court'
  const found = cache.get(key)
  if (found) return found
  const el = canvas(256, 256)
  const ctx = el.getContext('2d')
  if (!ctx) return el
  ctx.fillStyle = bossRoom ? '#2a211c' : '#4a382c'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = bossRoom ? '#3a2c24' : '#5c4636'
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath()
    ctx.moveTo(0, i * 32)
    ctx.lineTo(256, i * 32)
    ctx.stroke()
    ctx.strokeStyle = i % 2 === 0 ? '#6a5344' : '#3d2e24'
    ctx.beginPath()
    ctx.moveTo(i * 32, 0)
    ctx.lineTo(i * 32, 256)
    ctx.stroke()
  }
  if (bossRoom) {
    ctx.strokeStyle = '#e4b15a'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(128, 128, 78, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#d94a38'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(128, 128, 64, 0, Math.PI * 2)
    ctx.stroke()
  }
  cache.set(key, el)
  return el
}

export function slashCanvas(): HTMLCanvasElement {
  const found = cache.get('slash')
  if (found) return found
  const el = canvas(128, 128)
  const ctx = el.getContext('2d')
  if (!ctx) return el
  ctx.strokeStyle = '#fff6ea'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(64, 70, 40, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()
  ctx.strokeStyle = '#d94a38'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(64, 70, 40, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  cache.set('slash', el)
  return el
}

export function shadowCanvas(): HTMLCanvasElement {
  const found = cache.get('shadow')
  if (found) return found
  const el = canvas(64, 64)
  const ctx = el.getContext('2d')
  if (!ctx) return el
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30)
  g.addColorStop(0, 'rgba(0,0,0,0.45)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  cache.set('shadow', el)
  return el
}

export function keyFor(kind: string, elite: boolean): SheetKey {
  if (kind === 'player') return 'player'
  if (kind === 'grunt') return elite ? 'grunt-elite' : 'grunt'
  if (kind === 'archer') return elite ? 'archer-elite' : 'archer'
  if (kind === 'brute') return elite ? 'brute-elite' : 'brute'
  if (kind === 'clone') return 'clone'
  if (kind === 'kurogane' || kind === 'futae' || kind === 'seijin') return kind
  return 'grunt'
}
