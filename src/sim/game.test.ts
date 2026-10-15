import { describe, expect, it } from 'vitest'
import { playerOf, tryHurt } from './combat'
import { bossFor } from './names'
import { cameraBasis, inArc, pushCircleOut, wishFromStick } from './math'
import { draftSeals } from './seals'
import { step } from './step'
import { blankInput, startRun } from './world'

describe('camera', () => {
  it('treats yaw pi as looking north so W walks +Z', () => {
    const basis = cameraBasis(Math.PI)
    expect(basis.forwardX).toBeCloseTo(0, 5)
    expect(basis.forwardZ).toBeCloseTo(1, 5)
    expect(basis.rightX).toBeCloseTo(1, 5)
    const wish = wishFromStick(Math.PI, 0, 1)
    expect(wish.x).toBeCloseTo(0, 5)
    expect(wish.z).toBeCloseTo(1, 5)
  })
})

describe('combat', () => {
  it('hits a target in the front arc and misses behind', () => {
    expect(inArc(0, 0, 0, 0, 1.2, 0.3, 1.6, 1.2)).toBe(true)
    expect(inArc(0, 0, 0, 0, -1.2, 0.3, 1.6, 1.2)).toBe(false)
  })

  it('respects iframes', () => {
    const world = startRun(0, 4)
    const player = playerOf(world)
    if (!player) throw new Error('missing player')
    player.iframe = 0.2
    const result = tryHurt(world, player, 30, 0, 0, 1, 'hurt')
    expect(result.landed).toBe(false)
    expect(player.hp).toBe(100)
  })

  it('lands a light combo on a puppet standing in front', () => {
    const world = startRun(0, 5)
    world.intro = 0
    const player = playerOf(world)
    if (!player) throw new Error('missing player')
    for (const actor of world.actors) {
      if (actor.kind !== 'foe') continue
      actor.x = player.x
      actor.z = player.z + 1.15
      actor.speed = 0
      actor.cd = 30
      actor.hp = 400
      actor.maxHp = 400
    }
    const foe = world.actors.find((actor) => actor.kind === 'foe')
    if (!foe || foe.kind !== 'foe') throw new Error('missing foe')
    const before = foe.hp
    const input = blankInput()
    input.lightHeld = true
    for (let i = 0; i < 100; i += 1) step(world, input, 1 / 60)
    const still = world.actors.find((actor) => actor.id === foe.id)
    const hp = still && still.kind === 'foe' ? still.hp : 0
    expect(hp).toBeLessThan(before)
  })
})

describe('pagoda', () => {
  it('opens the gate once the room is clear', () => {
    const world = startRun(0, 6)
    world.intro = 0
    for (const actor of world.actors) {
      if (actor.kind === 'foe') actor.hp = 0
    }
    step(world, blankInput(), 1 / 60)
    expect(world.plan.rooms[0]?.cleared).toBe(true)
    expect(world.plan.rooms[0]?.role).toBe('skirmish')
    expect(world.plan.boss).toBe('kurogane')
  })

  it('rotates bosses per floor and offers three different seals', () => {
    expect(bossFor(1)).toBe('kurogane')
    expect(bossFor(2)).toBe('futae')
    expect(bossFor(3)).toBe('seijin')
    expect(bossFor(4)).toBe('kurogane')
    const world = startRun(0, 8)
    const offers = draftSeals(world)
    expect(offers).toHaveLength(3)
    expect(new Set(offers.map((seal) => seal.kind)).size).toBe(3)
  })

  it('pushes a circle out of a wall', () => {
    const next = pushCircleOut(0.2, 0, 0.5, { minX: -1, maxX: 1, minZ: -1, maxZ: 1 })
    expect(next).not.toBeNull()
    if (!next) return
    expect(Math.hypot(next.x, next.z)).toBeGreaterThan(0.2)
  })
})
