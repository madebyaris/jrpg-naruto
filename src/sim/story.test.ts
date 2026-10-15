import { expect, it } from 'vitest'
import { arrivalTale, bossBark, fallTale } from './story'
import { advanceTale, openReward, presentArrival, startRun } from './world'

it('opens act one on the latch', () => {
  const tale = arrivalTale(1)
  expect(tale.act).toContain('Act I')
  expect(tale.quest).toBe('Open the Latch')
  expect(tale.lines.some((line) => line.speaker === 'aya' && line.text.includes('uncle'))).toBe(true)
  expect(tale.lines.some((line) => line.speaker === 'asa')).toBe(true)
})

it('moves from the record to the bell, then copies the latch', () => {
  expect(arrivalTale(2).quest).toBe('Unmask the Record')
  expect(arrivalTale(3).objective).toContain('Seijin')
  expect(arrivalTale(4).act).toContain('copied')
  expect(arrivalTale(4).lines[0]?.text).toContain('copied')
})

it('walks a camp conversation into play', () => {
  const world = startRun(0, 3)
  presentArrival(world)
  expect(world.phase.kind).toBe('tale')
  if (world.phase.kind !== 'tale') return
  const steps = world.phase.tale.lines.length
  for (let i = 0; i < steps; i += 1) advanceTale(world)
  expect(world.phase.kind).toBe('play')
  expect(world.quest.name).toBe('Open the Latch')
})

it('lets a fallen warden offer three names', () => {
  const world = startRun(0, 8)
  openReward(world)
  const opened = world.phase
  if (opened.kind !== 'tale') throw new Error('expected the warden to speak')
  expect(opened.tale.lines[0]?.speaker).toBe('kurogane')
  const steps = opened.tale.lines.length
  for (let i = 0; i < steps; i += 1) advanceTale(world)
  const reward = world.phase
  if (reward.kind !== 'reward') throw new Error('expected a choice of names')
  expect(reward.offers).toHaveLength(3)
  expect(fallTale(3, 'seijin').lines.some((line) => line.speaker === 'aya')).toBe(true)
  expect(bossBark('futae').text.length).toBeGreaterThan(0)
})
