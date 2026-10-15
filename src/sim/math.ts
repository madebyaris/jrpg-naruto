import type { Aabb } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function hypot(x: number, z: number): number {
  return Math.hypot(x, z)
}

export function wrapAngle(rad: number): number {
  let a = rad
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export function angleTo(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(tx - x, tz - z)
}

export function approach(current: number, target: number, dt: number, accel: number): number {
  const k = 1 - Math.exp(-accel * dt)
  return current + (target - current) * k
}

export type CameraBasis = {
  forwardX: number
  forwardZ: number
  rightX: number
  rightZ: number
}

export function cameraBasis(yaw: number): CameraBasis {
  const forwardX = -Math.sin(yaw)
  const forwardZ = -Math.cos(yaw)
  return {
    forwardX,
    forwardZ,
    rightX: forwardZ,
    rightZ: -forwardX,
  }
}

export function wishFromStick(yaw: number, stickX: number, stickY: number): { x: number; z: number } {
  const basis = cameraBasis(yaw)
  return {
    x: basis.rightX * stickX + basis.forwardX * stickY,
    z: basis.rightZ * stickX + basis.forwardZ * stickY,
  }
}

export function inArc(
  originX: number,
  originZ: number,
  facing: number,
  targetX: number,
  targetZ: number,
  targetRadius: number,
  range: number,
  arc: number,
): boolean {
  const dx = targetX - originX
  const dz = targetZ - originZ
  const dist = Math.hypot(dx, dz)
  if (dist > range + targetRadius) return false
  if (dist < 0.001) return true
  const delta = Math.abs(wrapAngle(Math.atan2(dx, dz) - facing))
  return delta <= arc / 2
}

export function pushCircleOut(
  x: number,
  z: number,
  radius: number,
  box: Aabb,
): { x: number; z: number } | null {
  const closestX = clamp(x, box.minX, box.maxX)
  const closestZ = clamp(z, box.minZ, box.maxZ)
  const dx = x - closestX
  const dz = z - closestZ
  const distSq = dx * dx + dz * dz
  if (distSq >= radius * radius) return null
  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq)
    const push = radius - dist
    return { x: x + (dx / dist) * push, z: z + (dz / dist) * push }
  }
  const left = x - box.minX
  const right = box.maxX - x
  const south = z - box.minZ
  const north = box.maxZ - z
  const min = Math.min(left, right, south, north)
  if (min === left) return { x: box.minX - radius, z }
  if (min === right) return { x: box.maxX + radius, z }
  if (min === south) return { x, z: box.minZ - radius }
  return { x, z: box.maxZ + radius }
}

export function inCircle(x: number, z: number, cx: number, cz: number, radius: number, padding: number): boolean {
  return Math.hypot(x - cx, z - cz) <= radius + padding
}

export function inRotatedRect(
  x: number,
  z: number,
  cx: number,
  cz: number,
  length: number,
  width: number,
  rotation: number,
  padding: number,
): boolean {
  const dx = x - cx
  const dz = z - cz
  const cos = Math.cos(-rotation)
  const sin = Math.sin(-rotation)
  const localX = dx * cos - dz * sin
  const localZ = dx * sin + dz * cos
  return Math.abs(localX) <= width / 2 + padding && Math.abs(localZ) <= length / 2 + padding
}
