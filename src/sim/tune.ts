import type { BossKind, FoeKind, LightStep, MoveId, TelegraphKind } from './types'

export const STEP = 1 / 60

export const MOVE_SPEED = 7.15
export const DASH_SPEED = 18.5
export const DASH_TIME = 0.18
export const DASH_IFRAME = 0.13
export const PLAYER_RADIUS = 0.36
export const HURT_IFRAME = 0.32
export const HITSTOP_LIGHT = 0.035
export const HITSTOP_HEAVY = 0.06
export const COMBO_WINDOW = 1.45

export type SwingDef = {
  startup: number
  active: number
  recover: number
  range: number
  arc: number
  damage: number
  lunge: number
  knock: number
}

export const LIGHT: Record<LightStep, SwingDef> = {
  0: { startup: 0.05, active: 0.07, recover: 0.1, range: 2.35, arc: 1.5, damage: 9, lunge: 4.4, knock: 1.6 },
  1: { startup: 0.045, active: 0.07, recover: 0.1, range: 2.5, arc: 1.7, damage: 11, lunge: 4.8, knock: 2 },
  2: { startup: 0.06, active: 0.09, recover: 0.16, range: 2.8, arc: 2.1, damage: 16, lunge: 7.2, knock: 4.2 },
}

export const HEAVY: SwingDef = {
  startup: 0.16,
  active: 0.1,
  recover: 0.22,
  range: 1.9,
  arc: 2.15,
  damage: 22,
  lunge: 2.4,
  knock: 7,
}

export const JUTSU_COST = { cinder: 30, mirror: 42, palm: 36 }
export const JUTSU_TIME = { cinder: 0.32, mirror: 0.28, palm: 0.36 }

export type MoveDef = {
  windup: number
  active: number
  recover: number
  range: number
  arc: number
  mul: number
  knock: number
  lunge: number
  telegraph: TelegraphKind
  radius: number
  thickness: number
  shots: number
  shotSpeed: number
  shotLife: number
  shotRadius: number
}

export const MOVES: Record<MoveId, MoveDef> = {
  slash: {
    windup: 0.55,
    active: 0.11,
    recover: 0.36,
    range: 1.72,
    arc: 1.45,
    mul: 1,
    knock: 2.4,
    lunge: 2.4,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  cleave: {
    windup: 0.5,
    active: 0.14,
    recover: 0.42,
    range: 2.1,
    arc: 2.2,
    mul: 1.3,
    knock: 4.5,
    lunge: 1.2,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  lunge: {
    windup: 0.46,
    active: 0.28,
    recover: 0.48,
    range: 1.4,
    arc: 1.15,
    mul: 1.15,
    knock: 5,
    lunge: 10.5,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  shot: {
    windup: 0.38,
    active: 0.02,
    recover: 0.42,
    range: 0,
    arc: 0,
    mul: 0.85,
    knock: 1,
    lunge: 0,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 1,
    shotSpeed: 9.5,
    shotLife: 1.7,
    shotRadius: 0.2,
  },
  slam: {
    windup: 0.74,
    active: 0.02,
    recover: 0.5,
    range: 0,
    arc: 0,
    mul: 1.45,
    knock: 6,
    lunge: 0,
    telegraph: 'circle',
    radius: 2.55,
    thickness: 0,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  fan: {
    windup: 0.48,
    active: 0.02,
    recover: 0.4,
    range: 0,
    arc: 0.9,
    mul: 0.62,
    knock: 1,
    lunge: 0,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 5,
    shotSpeed: 10,
    shotLife: 1.5,
    shotRadius: 0.18,
  },
  dashstrike: {
    windup: 0.3,
    active: 0.22,
    recover: 0.4,
    range: 1.45,
    arc: 1.3,
    mul: 1.2,
    knock: 5.5,
    lunge: 13,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  lanes: {
    windup: 0.82,
    active: 0.02,
    recover: 0.48,
    range: 0,
    arc: 0,
    mul: 1.25,
    knock: 3,
    lunge: 0,
    telegraph: 'lanes',
    radius: 0,
    thickness: 1.15,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
  orbs: {
    windup: 0.56,
    active: 0.02,
    recover: 0.4,
    range: 0,
    arc: 0.55,
    mul: 0.7,
    knock: 1.2,
    lunge: 0,
    telegraph: 'none',
    radius: 0,
    thickness: 0,
    shots: 3,
    shotSpeed: 6.4,
    shotLife: 2.2,
    shotRadius: 0.34,
  },
  pulse: {
    windup: 0.8,
    active: 0.02,
    recover: 0.5,
    range: 0,
    arc: 0,
    mul: 1.35,
    knock: 4,
    lunge: 0,
    telegraph: 'ring',
    radius: 3.5,
    thickness: 0.72,
    shots: 0,
    shotSpeed: 0,
    shotLife: 0,
    shotRadius: 0,
  },
}

export const FOE_BASE: Record<FoeKind, { hp: number; power: number; speed: number; radius: number }> = {
  grunt: { hp: 40, power: 8, speed: 2.7, radius: 0.38 },
  archer: { hp: 30, power: 8, speed: 2.7, radius: 0.36 },
  brute: { hp: 86, power: 14, speed: 2.15, radius: 0.58 },
  clone: { hp: 36, power: 7, speed: 6.2, radius: 0.34 },
}

export const BOSS_BASE: Record<BossKind, { hp: number; power: number; speed: number; radius: number }> = {
  kurogane: { hp: 760, power: 16, speed: 2.35, radius: 0.72 },
  futae: { hp: 640, power: 13, speed: 3.55, radius: 0.58 },
  seijin: { hp: 700, power: 14, speed: 2.15, radius: 0.64 },
}

export function hpScale(floor: number): number {
  return 1 + (floor - 1) * 0.3
}

export function powerScale(floor: number): number {
  return 1 + (floor - 1) * 0.12
}

export const BOSS_PATTERNS: Record<BossKind, MoveId[]> = {
  kurogane: ['slash', 'slash', 'slam', 'lunge'],
  futae: ['dashstrike', 'slash', 'fan', 'dashstrike'],
  seijin: ['orbs', 'lanes', 'pulse', 'orbs'],
}

export const BOSS_PATTERNS_LATE: Record<BossKind, MoveId[]> = {
  kurogane: ['slash', 'slam', 'fan', 'lunge'],
  futae: ['dashstrike', 'fan', 'slash', 'pulse'],
  seijin: ['lanes', 'orbs', 'orbs', 'pulse'],
}

export const INNER_W = 14
export const INNER_D = 11
export const WALL = 0.8
export const GATE = 2.7
export const APRON = 6
