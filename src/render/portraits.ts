import type { SpeakerId } from '../sim/types'

type Face = {
  cloth: string
  dark: string
  skin: string
  hair: string
  accent: string
  mark: 'band' | 'shawl' | 'feather' | 'beads' | 'iron' | 'split' | 'bell'
}

const FACES: Record<SpeakerId, Face> = {
  asa: { cloth: '#243049', dark: '#141a28', skin: '#f0c7a4', hair: '#1a120e', accent: '#d94a38', mark: 'band' },
  aya: { cloth: '#4a342c', dark: '#241814', skin: '#e7c2a4', hair: '#6e645c', accent: '#e4b15a', mark: 'shawl' },
  soot: { cloth: '#3c3128', dark: '#1c1612', skin: '#c9b296', hair: '#2a2118', accent: '#8d9a6a', mark: 'feather' },
  hoshi: { cloth: '#2c2420', dark: '#14110f', skin: '#e4c7a8', hair: '#1a1614', accent: '#d94a38', mark: 'beads' },
  kurogane: { cloth: '#3a3438', dark: '#16141a', skin: '#c9b09a', hair: '#2a2428', accent: '#8a8175', mark: 'iron' },
  futae: { cloth: '#2a2830', dark: '#101014', skin: '#ecd4bc', hair: '#1a181c', accent: '#f4f0ea', mark: 'split' },
  seijin: { cloth: '#3a3430', dark: '#1a1614', skin: '#f3e2cc', hair: '#d8d2c8', accent: '#e4b15a', mark: 'bell' },
}

const cache = new Map<SpeakerId, HTMLCanvasElement>()

export function portrait(id: SpeakerId): HTMLCanvasElement {
  const found = cache.get(id)
  if (found) return found
  const el = document.createElement('canvas')
  el.width = 200
  el.height = 260
  const ctx = el.getContext('2d')
  if (!ctx) return el
  const face = FACES[id]
  ctx.fillStyle = '#1a1218'
  ctx.fillRect(0, 0, 200, 260)
  const wash = ctx.createLinearGradient(0, 0, 0, 260)
  wash.addColorStop(0, '#3a2a34')
  wash.addColorStop(1, '#120e14')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, 200, 260)
  ctx.fillStyle = face.dark
  ctx.beginPath()
  ctx.ellipse(100, 230, 78, 36, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = face.cloth
  rounded(ctx, 48, 168, 104, 92, 18)
  ctx.fillStyle = face.skin
  ctx.beginPath()
  ctx.arc(100, 118, 46, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = face.hair
  ctx.beginPath()
  ctx.arc(100, 104, 48, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(52, 96, 96, 22)
  mark(ctx, face)
  eye(ctx, 82, 118)
  eye(ctx, 118, 118)
  ctx.strokeStyle = '#8a4b3c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(100, 138, 10, 0.15, Math.PI - 0.15)
  ctx.stroke()
  cache.set(id, el)
  return el
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#1b1a22'
  ctx.beginPath()
  ctx.ellipse(x, y, 5, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 1, y - 2, 2, 2)
}

function mark(ctx: CanvasRenderingContext2D, face: Face): void {
  ctx.fillStyle = face.accent
  if (face.mark === 'band') {
    ctx.fillRect(62, 108, 76, 10)
    ctx.fillStyle = '#d7d2c8'
    ctx.fillRect(90, 104, 20, 16)
    ctx.fillStyle = face.accent
    ctx.fillRect(150, 176, 16, 28)
    return
  }
  if (face.mark === 'shawl') {
    ctx.beginPath()
    ctx.moveTo(42, 188)
    ctx.lineTo(158, 188)
    ctx.lineTo(142, 236)
    ctx.lineTo(58, 236)
    ctx.fill()
    ctx.fillStyle = '#efe6d6'
    ctx.beginPath()
    ctx.ellipse(74, 90, 12, 18, -0.5, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (face.mark === 'feather') {
    ctx.fillStyle = '#c6a15a'
    ctx.beginPath()
    ctx.ellipse(100, 78, 62, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = face.accent
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(138, 96)
    ctx.quadraticCurveTo(168, 70, 176, 40)
    ctx.stroke()
    return
  }
  if (face.mark === 'beads') {
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath()
      ctx.arc(70 + i * 12, 168, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = face.skin
    ctx.fillRect(78, 86, 44, 16)
    return
  }
  if (face.mark === 'iron') {
    ctx.fillStyle = face.accent
    ctx.fillRect(58, 104, 40, 36)
    ctx.fillStyle = '#d7d2c8'
    ctx.fillRect(64, 114, 10, 6)
    return
  }
  if (face.mark === 'split') {
    ctx.fillStyle = '#f7f4ee'
    ctx.fillRect(58, 100, 42, 40)
    ctx.fillStyle = '#16141c'
    ctx.fillRect(100, 100, 42, 40)
    ctx.fillStyle = '#d94a38'
    ctx.fillRect(96, 100, 8, 40)
    return
  }
  ctx.beginPath()
  ctx.arc(100, 72, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(97, 80, 6, 18)
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath()
    ctx.arc(74 + i * 13, 176, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
