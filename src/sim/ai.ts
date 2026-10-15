import { angleTo, hypot } from './math'
import { advanceIntent, beginMove, nearestTarget, summonAdds } from './combat'
import { BOSS_PATTERNS, BOSS_PATTERNS_LATE, MOVES } from './tune'
import type { Actor, Boss, Foe, MoveId, World } from './types'
import { isBoss, isFoe } from './types'

function decay(actor: Foe | Boss, dt: number): boolean {
  actor.hurt = Math.max(0, actor.hurt - dt)
  actor.iframe = Math.max(0, actor.iframe - dt)
  actor.stun = Math.max(0, actor.stun - dt)
  actor.cd = Math.max(0, actor.cd - dt)
  if (isFoe(actor) && actor.foe === 'clone') actor.life -= dt
  return actor.stun > 0
}

function chase(actor: Foe | Boss, target: Actor, dt: number, speed: number): void {
  const dist = hypot(target.x - actor.x, target.z - actor.z) || 1
  actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
  actor.vx = ((target.x - actor.x) / dist) * speed
  actor.vz = ((target.z - actor.z) / dist) * speed
  void dt
}

function flee(actor: Foe | Boss, target: Actor, speed: number): void {
  const dist = hypot(target.x - actor.x, target.z - actor.z) || 1
  actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
  actor.vx = (-(target.x - actor.x) / dist) * speed
  actor.vz = (-(target.z - actor.z) / dist) * speed
}

export function tickFoes(world: World, dt: number): void {
  for (const actor of world.actors) {
    if (!isFoe(actor) || actor.hp <= 0) continue
    actor.vx *= 0.82
    actor.vz *= 0.82
    if (!actor.awake) continue
    if (decay(actor, dt)) continue
    const preyTeam = actor.team === 'ally' ? 'enemy' : 'ally'
    const target = nearestTarget(world, actor, preyTeam, 16)
    if (!target) continue
    if (actor.intent.kind !== 'idle') {
      advanceIntent(world, actor, dt)
      continue
    }
    const dist = hypot(target.x - actor.x, target.z - actor.z)
    if (actor.foe === 'archer') {
      if (dist < 3.3) flee(actor, target, actor.speed)
      else if (dist > 6.6) chase(actor, target, dt, actor.speed)
      else if (actor.cd <= 0) {
        beginMove(world, actor, 'shot', target.x, target.z)
        actor.cd = 1.55
      } else {
        actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
      }
      continue
    }
    if (actor.foe === 'brute') {
      if (dist > 2.5 && dist < 7.5 && actor.cd <= 0) {
        beginMove(world, actor, 'lunge', target.x, target.z)
        actor.cd = 2.5
      } else if (dist > 1.7) chase(actor, target, dt, actor.speed)
      else if (actor.cd <= 0) {
        beginMove(world, actor, 'cleave', target.x, target.z)
        actor.cd = 1.55
      }
      continue
    }
    if (dist > 1.32) chase(actor, target, dt, actor.speed)
    else if (actor.cd <= 0) {
      beginMove(world, actor, 'slash', target.x, target.z)
      actor.cd = actor.foe === 'clone' ? 0.85 : 1.2
    } else {
      actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
    }
  }
}

function patternOf(boss: Boss): MoveId[] {
  const late = boss.hp < boss.maxHp * 0.5
  const list = late ? BOSS_PATTERNS_LATE[boss.boss] : BOSS_PATTERNS[boss.boss]
  return list
}

function maybeSummon(world: World, boss: Boss): void {
  if (boss.summoned) return
  if (boss.boss === 'futae' && boss.hp < boss.maxHp * 0.68) {
    boss.summoned = true
    summonAdds(world, boss.room, 1)
    return
  }
  if (boss.boss === 'seijin' && boss.hp < boss.maxHp * 0.6) {
    boss.summoned = true
    summonAdds(world, boss.room, 2)
  }
}

export function tickBosses(world: World, dt: number): void {
  for (const actor of world.actors) {
    if (!isBoss(actor) || actor.hp <= 0) continue
    actor.vx *= 0.8
    actor.vz *= 0.8
    if (!actor.awake) continue
    maybeSummon(world, actor)
    if (decay(actor, dt)) continue
    const target = nearestTarget(world, actor, 'ally', 20)
    if (!target) continue
    if (actor.intent.kind !== 'idle') {
      const move = actor.intent.move
      const tracked = MOVES[move].telegraph === 'none' && MOVES[move].shots > 0
      if (actor.intent.kind === 'windup' && tracked) {
        actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
      }
      advanceIntent(world, actor, dt)
      continue
    }
    const dist = hypot(target.x - actor.x, target.z - actor.z)
    const ranged = actor.boss === 'seijin'
    const tooClose = ranged && dist < 3.6
    const tooFar = dist > (ranged ? 6.8 : 1.85)
    if (tooClose) {
      flee(actor, target, actor.speed)
      continue
    }
    if (tooFar) {
      chase(actor, target, dt, actor.speed)
      continue
    }
    if (actor.cd > 0) {
      actor.facing = angleTo(actor.x, actor.z, target.x, target.z)
      continue
    }
    const patterns = patternOf(actor)
    const move = patterns[actor.pattern % patterns.length] ?? 'slash'
    actor.pattern += 1
    beginMove(world, actor, move, target.x, target.z)
    actor.cd = actor.hp < actor.maxHp * 0.5 ? 0.35 : 0.55
  }
}
