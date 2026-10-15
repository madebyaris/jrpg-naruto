import { nid, roomAt, roomInside, solids } from './floor'
import { angleTo, hypot, inArc, inCircle, inRotatedRect, pushCircleOut } from './math'
import { bossBark } from './story'
import { FOE_BASE, MOVES, powerScale } from './tune'
import type {
  Actor,
  Boss,
  Foe,
  MoveId,
  Player,
  PopupStyle,
  Shot,
  ShotKind,
  Team,
  Telegraph,
  TelegraphShape,
  World,
} from './types'
import { isBoss, isFoe, isPlayer } from './types'

export function playerOf(world: World): Player | null {
  for (const actor of world.actors) {
    if (isPlayer(actor)) return actor
  }
  return null
}

export function bossOf(world: World): Boss | null {
  for (const actor of world.actors) {
    if (isBoss(actor)) return actor
  }
  return null
}

export function living(actor: Actor): boolean {
  return actor.hp > 0
}

export function opposition(a: Team, b: Team): boolean {
  return a !== b
}

export function popup(world: World, x: number, z: number, text: string, style: PopupStyle): void {
  world.popups.push({
    id: nid(world),
    x,
    z,
    text,
    life: 0.7,
    max: 0.7,
    style,
  })
}

export function slashFx(world: World, x: number, z: number, facing: number, heavy: boolean): void {
  world.slashes.push({
    id: nid(world),
    x: x + Math.sin(facing) * 0.7,
    z: z + Math.cos(facing) * 0.7,
    facing,
    life: heavy ? 0.42 : 0.36,
    max: heavy ? 0.42 : 0.36,
    heavy,
  })
}

export type HurtResult = { landed: boolean; amount: number }

export function tryHurt(
  world: World,
  target: Actor,
  amount: number,
  fromX: number,
  fromZ: number,
  knock: number,
  style: PopupStyle,
): HurtResult {
  if (target.hp <= 0 || target.iframe > 0) return { landed: false, amount: 0 }
  const dealt = Math.max(1, Math.round(amount))
  target.hp -= dealt
  target.hurt = 0.16
  const swinging =
    isPlayer(target) &&
    (target.action.kind === 'light' || target.action.kind === 'heavy' || target.action.kind === 'dash')
  target.stun = target.team === 'ally' ? (swinging ? 0.05 : 0.1) : 0.16
  target.iframe = target.team === 'ally' ? 0.48 : 0.06
  const dx = target.x - fromX
  const dz = target.z - fromZ
  const dist = hypot(dx, dz) || 1
  target.vx += (dx / dist) * knock
  target.vz += (dz / dist) * knock
  if (isPlayer(target) && !swinging) target.action = { kind: 'idle' }
  popup(world, target.x, target.z, `${dealt}`, style)
  if (target.hp < 0) target.hp = 0
  return { landed: true, amount: dealt }
}

export function collide(world: World, actor: Actor): void {
  const boxes = solids(world)
  for (let pass = 0; pass < 3; pass += 1) {
    for (const box of boxes) {
      const next = pushCircleOut(actor.x, actor.z, actor.radius, box)
      if (!next) continue
      const nx = next.x - actor.x
      const nz = next.z - actor.z
      const lenSq = nx * nx + nz * nz
      actor.x = next.x
      actor.z = next.z
      if (lenSq < 1e-8) continue
      const into = actor.vx * nx + actor.vz * nz
      if (into < 0) {
        actor.vx -= (nx * into) / lenSq
        actor.vz -= (nz * into) / lenSq
      }
    }
  }
  const room = roomAt(world.plan, actor.x, actor.z)
  if (room && (isFoe(actor) || isBoss(actor))) {
    const pad = actor.radius
    actor.x = Math.min(room.maxX - pad, Math.max(room.minX + pad, actor.x))
    actor.z = Math.min(room.maxZ - pad, Math.max(room.minZ + pad, actor.z))
  }
}

export function separateFromPlayer(world: World): void {
  const player = playerOf(world)
  if (!player || player.hp <= 0) return
  for (const actor of world.actors) {
    if (actor.id === player.id || actor.hp <= 0) continue
    let dx = actor.x - player.x
    let dz = actor.z - player.z
    let dist = hypot(dx, dz)
    const need = player.radius + actor.radius + 0.12
    if (dist >= need) continue
    if (dist < 0.0001) {
      dx = 1
      dz = 0
      dist = 1
    }
    const push = need - dist
    actor.x += (dx / dist) * push
    actor.z += (dz / dist) * push
  }
}

export function separateFoes(world: World): void {
  const bodies = world.actors.filter((actor) => actor.hp > 0 && !isPlayer(actor))
  for (let i = 0; i < bodies.length; i += 1) {
    const a = bodies[i]
    if (!a) continue
    for (let j = i + 1; j < bodies.length; j += 1) {
      const b = bodies[j]
      if (!b) continue
      const dx = b.x - a.x
      const dz = b.z - a.z
      const dist = hypot(dx, dz)
      const need = a.radius + b.radius
      if (dist >= need || dist < 0.0001) continue
      const push = (need - dist) / 2
      const ux = dx / dist
      const uz = dz / dist
      a.x -= ux * push
      a.z -= uz * push
      b.x += ux * push
      b.z += uz * push
    }
  }
}

export function nearestTarget(world: World, from: Actor, team: Team, maxDist: number): Actor | null {
  let best: Actor | null = null
  let bestDist = maxDist
  for (const actor of world.actors) {
    if (actor.id === from.id || actor.hp <= 0 || actor.team !== team) continue
    const dist = hypot(actor.x - from.x, actor.z - from.z)
    if (dist < bestDist) {
      bestDist = dist
      best = actor
    }
  }
  return best
}

export function lockTarget(world: World): Actor | null {
  if (world.lockId == null) return null
  for (const actor of world.actors) {
    if (actor.id === world.lockId && actor.hp > 0 && actor.team === 'enemy') return actor
  }
  world.lockId = null
  return null
}

export function meleeHits(world: World, attacker: Actor, range: number, arc: number, damage: number, knock: number, hit: number[]): void {
  for (const target of world.actors) {
    if (!opposition(attacker.team, target.team) || target.hp <= 0 || hit.includes(target.id)) continue
    if (!inArc(attacker.x, attacker.z, attacker.facing, target.x, target.z, target.radius, range, arc)) continue
    const result = tryHurt(world, target, damage, attacker.x, attacker.z, knock, attacker.team === 'ally' ? 'hurt' : 'hurt')
    if (!result.landed) continue
    hit.push(target.id)
    if (attacker.team === 'ally') world.hitstop = Math.max(world.hitstop, damage >= 18 ? 0.055 : 0.032)
    if (isPlayer(attacker)) onPlayerDealt(world, attacker, result.amount)
    if (target.team === 'ally') world.shake = Math.max(world.shake, 0.18)
  }
  for (const pot of world.plan.pots) {
    if (!pot.alive || attacker.team !== 'ally') continue
    if (!inArc(attacker.x, attacker.z, attacker.facing, pot.x, pot.z, 0.35, range, arc)) continue
    breakPot(world, pot.id)
  }
}

export function onPlayerDealt(world: World, player: Player, amount: number): void {
  player.combo += 1
  player.comboLeft = 1.45
  const statsSteal = amount * stealOf(world)
  if (statsSteal > 0) {
    const stats = maxHpOf(world)
    player.hp = Math.min(stats, player.hp + statsSteal)
  }
}

function stealOf(world: World): number {
  let steal = 0
  for (const seal of world.seals) if (seal.kind === 'blood') steal += 0.08
  return steal
}

function maxHpOf(world: World): number {
  let hp = 100
  for (const seal of world.seals) if (seal.kind === 'will') hp += 22
  return hp
}

export function breakPot(world: World, id: number): void {
  const pot = world.plan.pots.find((entry) => entry.id === id)
  if (!pot || !pot.alive) return
  pot.alive = false
  const heal = randKind(world)
  world.drops.push({
    id: nid(world),
    x: pot.x,
    z: pot.z,
    kind: heal ? 'hp' : 'chakra',
    amount: heal ? 16 : 22,
    life: 12,
  })
}

function randKind(world: World): boolean {
  world.rng = (Math.imul(world.rng, 1664525) + 1013904223) >>> 0
  return world.rng / 4294967296 > 0.45
}

export function spawnShot(
  world: World,
  kind: ShotKind,
  team: Team,
  x: number,
  z: number,
  vx: number,
  vz: number,
  damage: number,
  radius: number,
  life: number,
): void {
  const shot: Shot = {
    id: nid(world),
    x,
    z,
    vx,
    vz,
    radius,
    damage,
    team,
    life,
    kind,
    hit: [],
  }
  world.shots.push(shot)
}

export function spawnSpread(
  world: World,
  kind: ShotKind,
  team: Team,
  x: number,
  z: number,
  facing: number,
  count: number,
  spread: number,
  speed: number,
  damage: number,
  radius: number,
  life: number,
): void {
  const start = count === 1 ? 0 : -spread / 2
  const step = count === 1 ? 0 : spread / (count - 1)
  for (let index = 0; index < count; index += 1) {
    const ang = facing + start + step * index
    spawnShot(world, kind, team, x, z, Math.sin(ang) * speed, Math.cos(ang) * speed, damage, radius, life)
  }
}

export function spawnTelegraph(world: World, shape: TelegraphShape, dur: number, damage: number, team: Team): void {
  const telegraph: Telegraph = {
    id: nid(world),
    shape,
    t: 0,
    dur,
    damage,
    team,
    hit: [],
  }
  world.telegraphs.push(telegraph)
}

export function beginMove(world: World, actor: Foe | Boss, move: MoveId, aimX: number, aimZ: number): void {
  const def = MOVES[move]
  actor.intent = { kind: 'windup', move, t: 0 }
  actor.facing = angleTo(actor.x, actor.z, aimX, aimZ)
  const damage = actor.power * def.mul
  if (def.telegraph === 'circle') {
    spawnTelegraph(
      world,
      { kind: 'circle', x: aimX, z: aimZ, radius: def.radius },
      def.windup,
      damage,
      actor.team,
    )
  } else if (def.telegraph === 'ring') {
    spawnTelegraph(
      world,
      { kind: 'ring', x: actor.x, z: actor.z, radius: def.radius, thickness: def.thickness },
      def.windup,
      damage,
      actor.team,
    )
  } else if (def.telegraph === 'lanes') {
    const facing = actor.facing
    const originX = (actor.x + aimX) / 2
    const originZ = (actor.z + aimZ) / 2
    for (const offset of [-2.2, 0, 2.2]) {
      const ox = originX + Math.cos(facing) * offset
      const oz = originZ - Math.sin(facing) * offset
      spawnTelegraph(
        world,
        { kind: 'lanes', x: ox, z: oz, rotation: facing, length: 13, width: def.thickness },
        def.windup,
        damage,
        actor.team,
      )
    }
  }
}

export function advanceIntent(world: World, actor: Foe | Boss, dt: number): void {
  const intent = actor.intent
  if (intent.kind === 'idle') return
  intent.t += dt
  const def = MOVES[intent.move]
  if (intent.kind === 'windup' && intent.t >= def.windup) {
    if (def.shots > 0) {
      const shotKind: ShotKind = intent.move === 'orbs' ? 'orb' : 'kunai'
      spawnSpread(
        world,
        shotKind,
        actor.team,
        actor.x + Math.sin(actor.facing) * 0.5,
        actor.z + Math.cos(actor.facing) * 0.5,
        actor.facing,
        def.shots,
        intent.move === 'shot' ? 0 : def.arc,
        def.shotSpeed,
        actor.power * def.mul,
        def.shotRadius,
        def.shotLife,
      )
    }
    if (def.telegraph !== 'none' || def.shots > 0) {
      actor.intent = { kind: 'recover', move: intent.move, t: 0 }
      return
    }
    actor.intent = { kind: 'active', move: intent.move, t: 0, hit: [] }
    return
  }
  if (intent.kind === 'active') {
    if (def.lunge > 0) {
      actor.vx = Math.sin(actor.facing) * def.lunge
      actor.vz = Math.cos(actor.facing) * def.lunge
    }
    meleeHits(world, actor, def.range, def.arc, actor.power * def.mul, def.knock, intent.hit)
    if (intent.t >= def.active) actor.intent = { kind: 'recover', move: intent.move, t: 0 }
    return
  }
  if (intent.kind === 'recover' && intent.t >= def.recover) {
    actor.intent = { kind: 'idle' }
  }
}

export function tickShots(world: World, dt: number): void {
  for (const shot of world.shots) {
    shot.life -= dt
    shot.x += shot.vx * dt
    shot.z += shot.vz * dt
    if (shotHitsSolid(world, shot)) shot.life = 0
    for (const actor of world.actors) {
      if (actor.hp <= 0 || !opposition(shot.team, actor.team) || shot.hit.includes(actor.id)) continue
      if (hypot(actor.x - shot.x, actor.z - shot.z) > actor.radius + shot.radius) continue
      const result = tryHurt(world, actor, shot.damage, shot.x, shot.z, 2.2, 'hurt')
      if (result.landed) {
        shot.hit.push(actor.id)
        shot.life = 0
        if (shot.team === 'ally') {
          const player = playerOf(world)
          if (player) onPlayerDealt(world, player, result.amount)
          world.hitstop = Math.max(world.hitstop, 0.02)
        } else {
          world.shake = Math.max(world.shake, 0.12)
        }
      }
    }
    for (const pot of world.plan.pots) {
      if (!pot.alive) continue
      if (hypot(pot.x - shot.x, pot.z - shot.z) < 0.45 + shot.radius) {
        if (shot.team === 'ally') breakPot(world, pot.id)
        shot.life = 0
      }
    }
  }
  world.shots = world.shots.filter((shot) => shot.life > 0)
}

function shotHitsSolid(world: World, shot: Shot): boolean {
  for (const box of solids(world)) {
    if (shot.x > box.minX && shot.x < box.maxX && shot.z > box.minZ && shot.z < box.maxZ) return true
  }
  return false
}

export function tickTelegraphs(world: World, dt: number): void {
  for (const zone of world.telegraphs) {
    const before = zone.t
    zone.t += dt
    if (!(before < zone.dur && zone.t >= zone.dur)) continue
    for (const actor of world.actors) {
      if (actor.hp <= 0 || !opposition(zone.team, actor.team) || zone.hit.includes(actor.id)) continue
      if (!insideShape(actor, zone.shape)) continue
      const result = tryHurt(world, actor, zone.damage, shapeX(zone.shape), shapeZ(zone.shape), 5, 'hurt')
      if (result.landed) {
        zone.hit.push(actor.id)
        world.shake = Math.max(world.shake, 0.28)
        world.hitstop = Math.max(world.hitstop, 0.04)
        if (zone.team === 'ally') {
          const player = playerOf(world)
          if (player) onPlayerDealt(world, player, result.amount)
        }
      }
    }
  }
  world.telegraphs = world.telegraphs.filter((zone) => zone.t < zone.dur + 0.05)
}

function shapeX(shape: TelegraphShape): number {
  return shape.x
}

function shapeZ(shape: TelegraphShape): number {
  return shape.z
}

function insideShape(actor: Actor, shape: TelegraphShape): boolean {
  if (shape.kind === 'circle') return inCircle(actor.x, actor.z, shape.x, shape.z, shape.radius, actor.radius * 0.4)
  if (shape.kind === 'lanes') {
    return inRotatedRect(actor.x, actor.z, shape.x, shape.z, shape.length, shape.width, shape.rotation, actor.radius * 0.35)
  }
  if (shape.kind === 'ring') {
    const dist = hypot(actor.x - shape.x, actor.z - shape.z)
    return Math.abs(dist - shape.radius) <= shape.thickness + actor.radius * 0.45
  }
  const _exhaustive: never = shape
  return _exhaustive
}

export function tickDrops(world: World, dt: number): void {
  const player = playerOf(world)
  for (const drop of world.drops) {
    drop.life -= dt
    if (!player || player.hp <= 0) continue
    if (hypot(player.x - drop.x, player.z - drop.z) > 0.72) continue
    if (drop.kind === 'hp') {
      const maxHp = maxHpOf(world)
      player.hp = Math.min(maxHp, player.hp + drop.amount)
      popup(world, drop.x, drop.z, `+${drop.amount}`, 'heal')
    } else {
      let maxChakra = 100
      for (const seal of world.seals) if (seal.kind === 'lung') maxChakra += 25
      player.chakra = Math.min(maxChakra, player.chakra + drop.amount)
      popup(world, drop.x, drop.z, `+${drop.amount}`, 'chakra')
    }
    drop.life = 0
  }
  world.drops = world.drops.filter((drop) => drop.life > 0)
  for (const pop of world.popups) pop.life -= dt
  world.popups = world.popups.filter((pop) => pop.life > 0)
  for (const slash of world.slashes) slash.life -= dt
  world.slashes = world.slashes.filter((slash) => slash.life > 0)
}

export function wakeRooms(world: World): void {
  const player = playerOf(world)
  if (!player) return
  const room = roomInside(world.plan, player.x, player.z)
  if (!room) return
  for (const actor of world.actors) {
    if (isFoe(actor) && actor.room === room.index) actor.awake = true
    if (isBoss(actor) && actor.room === room.index) {
      if (!actor.awake && !world.spoke) {
        const line = bossBark(actor.boss)
        world.bark = { speaker: line.speaker, text: line.text, life: 4.2 }
        world.spoke = true
      }
      actor.awake = true
    }
  }
}

export function refreshRooms(world: World): void {
  for (const room of world.plan.rooms) {
    if (room.role === 'boss') {
      const boss = bossOf(world)
      room.cleared = boss != null && boss.hp <= 0
      continue
    }
    const alive = world.actors.some(
      (actor) => isFoe(actor) && actor.team === 'enemy' && actor.room === room.index && actor.hp > 0,
    )
    room.cleared = !alive
  }
}

export function cull(world: World): void {
  let kills = 0
  world.actors = world.actors.filter((actor) => {
    if (isPlayer(actor)) return true
    if (isBoss(actor)) return true
    if (isFoe(actor)) {
      if (actor.foe === 'clone' && actor.life <= 0) return false
      if (actor.hp <= 0) {
        if (actor.team === 'enemy') kills += 1
        return false
      }
      return true
    }
    const _exhaustive: never = actor
    return _exhaustive
  })
  world.kills += kills
}

export function spawnClone(world: World, x: number, z: number, level: number): void {
  const base = FOE_BASE.clone
  const maxHp = Math.round(base.hp * (1 + (level - 1) * 0.4))
  const clone: Foe = {
    kind: 'foe',
    foe: 'clone',
    id: nid(world),
    x,
    z,
    vx: 0,
    vz: 0,
    facing: 0,
    hp: maxHp,
    maxHp,
    radius: base.radius,
    iframe: 0.2,
    stun: 0,
    hurt: 0,
    team: 'ally',
    room: roomAt(world.plan, x, z)?.index ?? 0,
    awake: true,
    cd: 0.2,
    intent: { kind: 'idle' },
    life: 6.5 + level,
    elite: false,
    speed: base.speed,
    power: base.power * level * powerScale(world.floor),
  }
  world.actors.push(clone)
}

export function summonAdds(world: World, roomIndex: number, count: number): void {
  const room = world.plan.rooms[roomIndex]
  if (!room) return
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -2.4 : 2.4
    const foe = {
      ...makeSummon(world, room.index, side, room.minZ + 3.4),
    }
    world.actors.push(foe)
  }
}

function makeSummon(world: World, room: number, x: number, z: number): Foe {
  const base = FOE_BASE.grunt
  const maxHp = Math.round(base.hp * hpScaleSafe(world.floor))
  return {
    kind: 'foe',
    foe: 'grunt',
    id: nid(world),
    x,
    z,
    vx: 0,
    vz: 0,
    facing: Math.PI,
    hp: maxHp,
    maxHp,
    radius: base.radius,
    iframe: 0.3,
    stun: 0,
    hurt: 0,
    team: 'enemy',
    room,
    awake: true,
    cd: 0.5,
    intent: { kind: 'idle' },
    life: 9999,
    elite: false,
    speed: base.speed,
    power: base.power * powerScale(world.floor),
  }
}

function hpScaleSafe(floor: number): number {
  return 1 + (floor - 1) * 0.3
}
