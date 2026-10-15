import type { World } from './types'

export function rand(world: World): number {
  world.rng = (Math.imul(world.rng, 1664525) + 1013904223) >>> 0
  return world.rng / 4294967296
}

export function freshSeed(): number {
  const n = Math.floor(Math.random() * 0xffffffff)
  return n === 0 ? 1 : n
}
