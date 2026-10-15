import { bossOf, playerOf, slashFx, spawnClone, spawnSpread } from './combat'
import { buildFloor, nid, spawnBoss, spawnSkirmish } from './floor'
import { bossName } from './names'
import { freshSeed } from './rng'
import { derive, draftSeals, unlockedJutsu } from './seals'
import { arrivalTale, emptyQuest, fallTale, questOf } from './story'
import { DASH_SPEED, HEAVY, HITSTOP_HEAVY, HITSTOP_LIGHT, JUTSU_COST, JUTSU_TIME, LIGHT } from './tune'
import type { InputFrame, JutsuSlot, LightStep, Player, Stats, SwingPhase, World } from './types'

const BLANK: InputFrame = {
  wishX: 0,
  wishZ: 0,
  lightHeld: false,
  heavy: false,
  dash: false,
  jutsu: false,
  lock: false,
  cycle: false,
}

export function blankInput(): InputFrame {
  return { ...BLANK }
}

function baseWorld(floor: number, bestFloor: number, seed: number): World {
  const world: World = {
    phase: { kind: 'title' },
    floor,
    rng: seed >>> 0 || 1,
    bestFloor,
    seals: [],
    plan: {
      floor,
      name: '',
      rooms: [],
      walls: [],
      gates: [],
      pots: [],
      boss: 'kurogane',
      apron: 6,
    },
    actors: [],
    shots: [],
    telegraphs: [],
    drops: [],
    popups: [],
    slashes: [],
    nextId: 0,
    hitstop: 0,
    shake: 0,
    intro: 0,
    bossFall: -1,
    banner: '',
    bannerT: 0,
    lockId: null,
    jutsu: 0,
    time: 0,
    kills: 0,
    floorsCleared: 0,
    lowChakra: 0,
    quest: emptyQuest(),
    bark: null,
    spoke: false,
  }
  world.plan = buildFloor(world, floor)
  return world
}

function makePlayer(world: World, stats: Stats): Player {
  return {
    kind: 'player',
    id: nid(world),
    x: 0,
    z: -2.6,
    vx: 0,
    vz: 0,
    facing: 0,
    hp: stats.maxHp,
    radius: 0.36,
    iframe: 0,
    stun: 0,
    hurt: 0,
    team: 'ally',
    chakra: stats.maxChakra,
    dashCharges: stats.dashMax,
    dashStore: 0,
    action: { kind: 'idle' },
    combo: 0,
    comboLeft: 0,
    lightStep: 0,
    chainLeft: 0,
  }
}

export function createShowcase(bestFloor: number): World {
  const world = baseWorld(1, bestFloor, 7)
  const stats = derive(world.seals)
  world.actors.push(makePlayer(world, stats))
  spawnBoss(world)
  world.phase = { kind: 'title' }
  world.banner = 'KAGERO'
  world.bannerT = 0
  return world
}

export function startRun(bestFloor: number, seed = freshSeed()): World {
  const world = baseWorld(1, bestFloor, seed)
  const stats = derive([])
  world.actors.push(makePlayer(world, stats))
  spawnSkirmish(world)
  spawnBoss(world)
  world.phase = { kind: 'play' }
  world.intro = 1.05
  world.bossFall = -1
  world.quest = questOf(arrivalTale(1))
  world.bark = null
  world.spoke = false
  world.banner = `Floor 1  —  ${world.plan.name}. Walk in.`
  world.bannerT = 2.5
  world.bestFloor = Math.max(bestFloor, 1)
  return world
}

export function presentArrival(world: World): void {
  const tale = arrivalTale(world.floor)
  world.quest = questOf(tale)
  world.bark = null
  world.spoke = false
  world.phase = { kind: 'tale', tale, index: 0, after: 'play', offers: null }
}

function placePlayer(world: World, player: Player, stats: Stats): void {
  player.x = 0
  player.z = -2.6
  player.vx = 0
  player.vz = 0
  player.facing = 0
  player.action = { kind: 'idle' }
  player.stun = 0
  player.hurt = 0
  player.hp = Math.min(stats.maxHp, player.hp + Math.round(stats.maxHp * 0.22))
  player.chakra = stats.maxChakra
  player.dashCharges = stats.dashMax
  player.dashStore = 0
  player.combo = 0
  player.comboLeft = 0
}

export function chooseSeal(world: World, index: number): void {
  if (world.phase.kind !== 'reward') return
  const seal = world.phase.offers[index]
  if (!seal) return
  world.seals = [...world.seals, seal]
  const stats = derive(world.seals)
  const player = playerOf(world)
  if (!player) return
  if (seal.kind === 'will') player.hp = Math.min(stats.maxHp, player.hp + 28)
  world.floor += 1
  world.plan = buildFloor(world, world.floor)
  placePlayer(world, player, stats)
  world.actors = [player]
  world.shots = []
  world.telegraphs = []
  world.drops = []
  world.slashes = []
  world.popups = []
  world.lockId = null
  world.bossFall = -1
  world.intro = 1.05
  world.banner = `Floor ${world.floor}  —  ${world.plan.name}`
  world.bannerT = 2.6
  world.bestFloor = Math.max(world.bestFloor, world.floor)
  const slots = unlockedJutsu(stats)
  if (!slots.includes(world.jutsu)) world.jutsu = slots[0] ?? 0
  spawnSkirmish(world)
  spawnBoss(world)
  presentArrival(world)
}

export function advanceTale(world: World): void {
  if (world.phase.kind !== 'tale') return
  const { tale, index, after, offers } = world.phase
  if (index + 1 < tale.lines.length) {
    world.phase = { kind: 'tale', tale, index: index + 1, after, offers }
    return
  }
  world.quest = questOf(tale)
  if (after === 'reward' && offers) {
    world.phase = { kind: 'reward', offers }
    return
  }
  world.phase = { kind: 'play' }
}

export function openReward(world: World): void {
  const boss = bossOf(world)
  world.floorsCleared += 1
  const tale = fallTale(world.floor, boss?.boss ?? world.plan.boss)
  world.phase = { kind: 'tale', tale, index: 0, after: 'reward', offers: draftSeals(world) }
  world.banner = boss ? `${bossName(boss.boss)} falls` : 'The gate opens'
  world.bannerT = 3
  world.bestFloor = Math.max(world.bestFloor, world.floor)
}

export function downPlayer(world: World): void {
  world.phase = { kind: 'downed' }
  world.bark = null
  world.banner = 'The pagoda keeps your shadow'
  world.bannerT = 6
}

export function rate(stats: Stats, seconds: number): number {
  return seconds / stats.attackRate
}

export function startLight(player: Player, step: LightStep): void {
  player.action = { kind: 'light', step, phase: 'startup', t: 0, hit: [] }
  player.lightStep = step
  player.chainLeft = 0.48
}

export function startHeavy(player: Player): void {
  player.action = { kind: 'heavy', phase: 'startup', t: 0, hit: [] }
  player.chainLeft = 0
}

export function facingFromWish(player: Player, input: InputFrame, lockX: number | null, lockZ: number | null): void {
  if (lockX != null && lockZ != null) {
    player.facing = Math.atan2(lockX - player.x, lockZ - player.z)
    return
  }
  const mag = Math.hypot(input.wishX, input.wishZ)
  if (mag > 0.2) player.facing = Math.atan2(input.wishX, input.wishZ)
}

export function tryJutsu(world: World, player: Player, stats: Stats, slot: JutsuSlot): boolean {
  if (slot === 0 && stats.cinder <= 0) return false
  if (slot === 1 && stats.mirror <= 0) return false
  if (slot === 2 && stats.palm <= 0) return false
  const cost = slot === 0 ? JUTSU_COST.cinder : slot === 1 ? JUTSU_COST.mirror : JUTSU_COST.palm
  if (player.chakra < cost) {
    world.lowChakra = 0.45
    return false
  }
  player.chakra -= cost
  if (slot === 0) player.action = { kind: 'cinder', t: 0, fired: false }
  else if (slot === 1) player.action = { kind: 'mirror', t: 0, fired: false }
  else player.action = { kind: 'palm', t: 0, fired: false }
  return true
}

export function fireJutsu(world: World, player: Player, stats: Stats): void {
  const action = player.action
  if (action.kind === 'cinder' && !action.fired && action.t >= 0.12) {
    action.fired = true
    const level = stats.cinder
    const count = 4 + level
    spawnSpread(
      world,
      'cinder',
      'ally',
      player.x + Math.sin(player.facing) * 0.45,
      player.z + Math.cos(player.facing) * 0.45,
      player.facing,
      count,
      0.7 + level * 0.05,
      15,
      (7 + level * 3) * stats.damageMul,
      0.2,
      0.72,
    )
    slashFx(world, player.x, player.z, player.facing, true)
  }
  if (action.kind === 'mirror' && !action.fired && action.t >= 0.1) {
    action.fired = true
    const side = player.facing + Math.PI / 2
    spawnClone(world, player.x + Math.sin(side) * 0.9, player.z + Math.cos(side) * 0.9, stats.mirror)
  }
  if (action.kind === 'palm' && !action.fired && action.t >= 0.16) {
    action.fired = true
    const radius = 2.7 + stats.palm * 0.35
    world.telegraphs.push({
      id: nid(world),
      shape: { kind: 'circle', x: player.x, z: player.z, radius },
      t: 0,
      dur: 0.05,
      damage: (18 + stats.palm * 6) * stats.damageMul,
      team: 'ally',
      hit: [],
    })
    world.shake = Math.max(world.shake, 0.22)
    slashFx(world, player.x, player.z, player.facing, true)
  }
}

export function swingDef(step: LightStep) {
  return LIGHT[step]
}

export function heavyDef() {
  return HEAVY
}

export function phaseSeconds(phase: SwingPhase, startup: number, active: number, recover: number): number {
  if (phase === 'startup') return startup
  if (phase === 'active') return active
  return recover
}

export function nextPhase(phase: SwingPhase): SwingPhase | 'done' {
  if (phase === 'startup') return 'active'
  if (phase === 'active') return 'recover'
  return 'done'
}

export function dashVector(player: Player, input: InputFrame): { x: number; z: number } {
  const mag = Math.hypot(input.wishX, input.wishZ)
  if (mag > 0.2) return { x: input.wishX / mag, z: input.wishZ / mag }
  const x = Math.sin(player.facing)
  const z = Math.cos(player.facing)
  const length = Math.hypot(x, z) || 1
  return { x: x / length, z: z / length }
}

export function dashSpeed(): number {
  return DASH_SPEED
}

export function jutsuDuration(kind: 'cinder' | 'mirror' | 'palm'): number {
  return JUTSU_TIME[kind]
}

export function hitstopFor(heavy: boolean): number {
  return heavy ? HITSTOP_HEAVY : HITSTOP_LIGHT
}
