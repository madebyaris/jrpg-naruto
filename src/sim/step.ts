import { tickBosses, tickFoes } from './ai'
import {
  bossOf,
  collide,
  cull,
  lockTarget,
  meleeHits,
  playerOf,
  refreshRooms,
  separateFoes,
  separateFromPlayer,
  slashFx,
  tickDrops,
  tickShots,
  tickTelegraphs,
  wakeRooms,
} from './combat'
import { approach, hypot } from './math'
import { derive, nextJutsu } from './seals'
import { DASH_IFRAME, DASH_TIME, MOVE_SPEED } from './tune'
import type { InputFrame, LightStep, Player, Stats, World } from './types'
import { isPlayer } from './types'
import {
  dashSpeed,
  dashVector,
  downPlayer,
  facingFromWish,
  fireJutsu,
  heavyDef,
  hitstopFor,
  jutsuDuration,
  nextPhase,
  openReward,
  phaseSeconds,
  rate,
  startHeavy,
  startLight,
  swingDef,
  tryJutsu,
} from './world'

function integrate(world: World, dt: number): void {
  for (const actor of world.actors) {
    if (actor.hp <= 0 && !isPlayer(actor)) continue
    actor.x += actor.vx * dt
    actor.z += actor.vz * dt
    collide(world, actor)
  }
  separateFoes(world)
  separateFromPlayer(world)
}

function playerDamage(base: number, stats: Stats, combo: number): number {
  const bonus = 1 + Math.min(combo, 12) * 0.035
  return base * stats.damageMul * bonus
}

function followingLight(step: LightStep): LightStep {
  if (step === 0) return 1
  if (step === 1) return 2
  return 0
}

function advanceSwing(
  world: World,
  player: Player,
  stats: Stats,
  dt: number,
  startup: number,
  active: number,
  recover: number,
  range: number,
  arc: number,
  damage: number,
  lunge: number,
  knock: number,
  heavy: boolean,
): void {
  const action = player.action
  if (action.kind !== 'light' && action.kind !== 'heavy') return
  if (action.phase !== 'active') {
    player.vx = approach(player.vx, 0, dt, 16)
    player.vz = approach(player.vz, 0, dt, 16)
  }
  const scaled = dt * stats.attackRate
  action.t += scaled
  const limit = phaseSeconds(action.phase, startup, active, recover)
  if (action.phase === 'active') {
    player.vx = Math.sin(player.facing) * lunge
    player.vz = Math.cos(player.facing) * lunge
    const before = action.hit.length
    meleeHits(world, player, range, arc, playerDamage(damage, stats, player.combo), knock, action.hit)
    if (action.hit.length > before) world.hitstop = Math.max(world.hitstop, hitstopFor(heavy))
  }
  if (action.t < limit) return
  const following = nextPhase(action.phase)
  if (following === 'done') {
    if (player.action.kind === 'light') {
      const doneStep = player.action.step
      if (doneStep === 2) {
        player.lightStep = 0
        player.chainLeft = 0
      } else {
        player.lightStep = followingLight(doneStep)
        player.chainLeft = 0.42
      }
    } else {
      player.chainLeft = 0
    }
    player.action = { kind: 'idle' }
    return
  }
  action.phase = following
  action.t = 0
  if (following === 'active') {
    action.hit = []
    slashFx(world, player.x, player.z, player.facing, heavy)
  }
}

function attackAim(
  world: World,
  player: Player,
  input: InputFrame,
  lockX: number | null,
  lockZ: number | null,
): { x: number | null; z: number | null } {
  if (lockX != null && lockZ != null) return { x: lockX, z: lockZ }
  if (hypot(input.wishX, input.wishZ) > 0.2) return { x: null, z: null }
  let bestX: number | null = null
  let bestZ: number | null = null
  let bestDist = 7.5
  for (const actor of world.actors) {
    if (actor.team !== 'enemy' || actor.hp <= 0) continue
    const dist = hypot(actor.x - player.x, actor.z - player.z)
    if (dist < bestDist) {
      bestDist = dist
      bestX = actor.x
      bestZ = actor.z
    }
  }
  return { x: bestX, z: bestZ }
}

function tickPlayer(world: World, input: InputFrame, dt: number, stats: Stats): void {
  const player = playerOf(world)
  if (!player) return
  player.hurt = Math.max(0, player.hurt - dt)
  player.iframe = Math.max(0, player.iframe - dt)
  player.stun = Math.max(0, player.stun - dt)
  player.comboLeft = Math.max(0, player.comboLeft - dt)
  player.chainLeft = Math.max(0, player.chainLeft - dt)
  if (player.comboLeft <= 0) player.combo = 0
  if (player.chainLeft <= 0 && player.action.kind === 'idle') player.lightStep = 0
  world.lowChakra = Math.max(0, world.lowChakra - dt)

  player.chakra = Math.min(stats.maxChakra, player.chakra + stats.chakraRegen * dt)
  if (player.dashCharges < stats.dashMax) {
    player.dashStore += stats.dashRate * dt
    if (player.dashStore >= 1) {
      player.dashStore -= 1
      player.dashCharges += 1
    }
  }

  if (input.lock) {
    if (world.lockId != null) world.lockId = null
    else {
      let best: number | null = null
      let bestDist = 13
      for (const actor of world.actors) {
        if (actor.team !== 'enemy' || actor.hp <= 0) continue
        const dist = hypot(actor.x - player.x, actor.z - player.z)
        if (dist < bestDist) {
          bestDist = dist
          best = actor.id
        }
      }
      world.lockId = best
    }
  }
  if (input.cycle) world.jutsu = nextJutsu(world.jutsu, stats)

  const locked = lockTarget(world)
  const lockX = locked ? locked.x : null
  const lockZ = locked ? locked.z : null
  const aim = attackAim(world, player, input, lockX, lockZ)

  if (player.hp <= 0) {
    player.vx = 0
    player.vz = 0
    downPlayer(world)
    return
  }

  if (player.stun > 0) {
    player.action = { kind: 'idle' }
    player.vx = approach(player.vx, 0, dt, 8)
    player.vz = approach(player.vz, 0, dt, 8)
    return
  }

  if (input.dash && player.dashCharges > 0 && player.action.kind !== 'dash') {
    const dir = dashVector(player, input)
    player.dashCharges -= 1
    player.action = { kind: 'dash', t: 0, dx: dir.x, dz: dir.z }
    player.iframe = Math.max(player.iframe, DASH_IFRAME)
    player.facing = Math.atan2(dir.x, dir.z)
  }

  const action = player.action
  if (action.kind === 'dash') {
    action.t += dt
    player.vx = action.dx * dashSpeed()
    player.vz = action.dz * dashSpeed()
    if (action.t >= DASH_TIME) player.action = { kind: 'idle' }
    return
  }

  if (action.kind === 'light') {
    const def = swingDef(action.step)
    const startup = rate(stats, def.startup)
    const active = rate(stats, def.active)
    const recover = rate(stats, def.recover)
    if (action.phase === 'recover' && input.lightHeld) {
      facingFromWish(player, input, aim.x, aim.z)
      startLight(player, followingLight(action.step))
    } else if (action.phase === 'recover' && input.heavy) {
      facingFromWish(player, input, aim.x, aim.z)
      startHeavy(player)
    } else {
      advanceSwing(
        world,
        player,
        stats,
        dt,
        startup,
        active,
        recover,
        def.range,
        def.arc,
        def.damage,
        def.lunge,
        def.knock,
        action.step === 2,
      )
    }
    return
  }

  if (action.kind === 'heavy') {
    const def = heavyDef()
    advanceSwing(
      world,
      player,
      stats,
      dt,
      rate(stats, def.startup),
      rate(stats, def.active),
      rate(stats, def.recover),
      def.range,
      def.arc,
      def.damage,
      def.lunge,
      def.knock,
      true,
    )
    return
  }

  if (action.kind === 'cinder' || action.kind === 'mirror' || action.kind === 'palm') {
    action.t += dt
    fireJutsu(world, player, stats)
    const limit = jutsuDuration(action.kind)
    player.vx = approach(player.vx, 0, dt, 10)
    player.vz = approach(player.vz, 0, dt, 10)
    if (action.t >= limit) player.action = { kind: 'idle' }
    return
  }

  if (input.jutsu) {
    facingFromWish(player, input, aim.x, aim.z)
    if (tryJutsu(world, player, stats, world.jutsu)) return
  }
  if (input.heavy) {
    facingFromWish(player, input, aim.x, aim.z)
    startHeavy(player)
    slashFx(world, player.x, player.z, player.facing, true)
    return
  }
  if (input.lightHeld) {
    facingFromWish(player, input, aim.x, aim.z)
    const step = player.chainLeft > 0 ? player.lightStep : 0
    startLight(player, step)
    slashFx(world, player.x, player.z, player.facing, false)
    return
  }

  const mag = hypot(input.wishX, input.wishZ)
  const nx = mag > 1 ? input.wishX / mag : input.wishX
  const nz = mag > 1 ? input.wishZ / mag : input.wishZ
  player.vx = approach(player.vx, nx * MOVE_SPEED, dt, 26)
  player.vz = approach(player.vz, nz * MOVE_SPEED, dt, 26)
  if (locked) player.facing = Math.atan2(locked.x - player.x, locked.z - player.z)
  else if (mag > 0.15) player.facing = Math.atan2(nx, nz)
}

function tickBossFall(world: World, dt: number): void {
  const boss = bossOf(world)
  if (!boss || boss.hp > 0) return
  if (world.bossFall < 0) world.bossFall = 1.15
  world.bossFall -= dt
  boss.vx = 0
  boss.vz = 0
  if (world.bossFall <= 0) openReward(world)
}

export function step(world: World, input: InputFrame, dt: number): void {
  if (world.phase.kind !== 'play') return
  world.time += dt
  world.bannerT = Math.max(0, world.bannerT - dt)
  if (world.bark) {
    world.bark.life -= dt
    if (world.bark.life <= 0) world.bark = null
  }
  world.shake = Math.max(0, world.shake - dt * 1.6)
  if (world.intro > 0) {
    world.intro -= dt
    return
  }
  if (world.hitstop > 0) {
    world.hitstop = Math.max(0, world.hitstop - dt)
    return
  }
  const stats = derive(world.seals)
  const player = playerOf(world)
  if (player && player.hp > stats.maxHp) player.hp = stats.maxHp
  tickPlayer(world, input, dt, stats)
  if (world.phase.kind !== 'play') return
  wakeRooms(world)
  tickFoes(world, dt)
  tickBosses(world, dt)
  integrate(world, dt)
  tickShots(world, dt)
  tickTelegraphs(world, dt)
  tickDrops(world, dt)
  const after = playerOf(world)
  if (after && after.hp <= 0) downPlayer(world)
  if (world.phase.kind !== 'play') return
  cull(world)
  refreshRooms(world)
  tickBossFall(world, dt)
}
