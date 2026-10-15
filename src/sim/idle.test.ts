import { expect, it } from 'vitest'
import { playerOf } from './combat'
import { step } from './step'
import type { InputFrame } from './types'
import { blankInput, startRun } from './world'

it('keeps the porch safe until you walk into the court', () => {
  const world = startRun(0, 1)
  const input = blankInput()
  for (let i = 0; i < 360; i += 1) step(world, input, 1 / 60)
  const player = playerOf(world)
  if (!player) throw new Error('missing player')
  expect(player.hp).toBe(100)
  expect(world.phase.kind).toBe('play')
  const awake = world.actors.some((actor) => actor.kind !== 'player' && actor.awake)
  expect(awake).toBe(false)
})

it('can walk in and swing without dying', () => {
  const world = startRun(0, 9)
  world.intro = 0
  const player = playerOf(world)
  if (!player) throw new Error('missing player')
  const forward: InputFrame = { ...blankInput(), wishZ: 1 }
  for (let i = 0; i < 150; i += 1) step(world, forward, 1 / 60)
  const attack: InputFrame = { ...blankInput(), wishZ: 1, lightHeld: true }
  for (let i = 0; i < 180; i += 1) step(world, attack, 1 / 60)
  expect(world.phase.kind).toBe('play')
  expect(player.hp).toBeGreaterThan(40)
})

it('kills the floor 1 grunt by standing and swinging', () => {
  const world = startRun(0, 1)
  world.intro = 0
  const player = playerOf(world)
  if (!player) throw new Error('missing player')
  player.z = 2
  const attack: InputFrame = { ...blankInput(), lightHeld: true }
  for (let i = 0; i < 360; i += 1) step(world, attack, 1 / 60)
  const grunt = world.actors.find((actor) => actor.kind === 'foe')
  expect(world.phase.kind).toBe('play')
  expect(player.hp).toBeGreaterThan(70)
  expect(grunt == null || grunt.hp <= 0).toBe(true)
})

it('wakes the court when the player steps inside', () => {
  const world = startRun(0, 2)
  world.intro = 0
  const player = playerOf(world)
  if (!player) throw new Error('missing player')
  player.z = 1.2
  const forward: InputFrame = { ...blankInput(), wishZ: 0 }
  for (let i = 0; i < 20; i += 1) step(world, forward, 1 / 60)
  const awake = world.actors.some((actor) => actor.kind === 'foe' && actor.awake)
  expect(awake).toBe(true)
  expect(player.hp).toBeGreaterThan(80)
})
