import type { JutsuSlot, Seal, SealKind, Stats, World } from './types'
import { rand } from './rng'

const CATALOG: readonly SealKind[] = [
  'edge',
  'edge',
  'scarf',
  'lung',
  'will',
  'haste',
  'blood',
  'omamori',
  'cinder',
  'mirror',
  'palm',
]

export function derive(seals: readonly Seal[]): Stats {
  const stats: Stats = {
    maxHp: 100,
    maxChakra: 100,
    chakraRegen: 9,
    damageMul: 1,
    dashMax: 2,
    dashRate: 0.52,
    attackRate: 1,
    lifesteal: 0,
    luck: 0,
    cinder: 1,
    mirror: 0,
    palm: 0,
  }
  for (const seal of seals) {
    switch (seal.kind) {
      case 'edge':
        stats.damageMul += 0.15
        break
      case 'scarf':
        stats.dashMax = Math.min(4, stats.dashMax + 1)
        stats.dashRate += 0.14
        break
      case 'lung':
        stats.maxChakra += 25
        stats.chakraRegen += 3
        break
      case 'will':
        stats.maxHp += 22
        break
      case 'haste':
        stats.attackRate += 0.14
        break
      case 'blood':
        stats.lifesteal += 0.08
        break
      case 'omamori':
        stats.luck += 1
        break
      case 'cinder':
        stats.cinder += 1
        break
      case 'mirror':
        stats.mirror += 1
        break
      case 'palm':
        stats.palm += 1
        break
      default: {
        const _exhaustive: never = seal
        return _exhaustive
      }
    }
  }
  return stats
}

export function sealOf(kind: SealKind): Seal {
  switch (kind) {
    case 'edge':
      return { kind: 'edge' }
    case 'scarf':
      return { kind: 'scarf' }
    case 'lung':
      return { kind: 'lung' }
    case 'will':
      return { kind: 'will' }
    case 'haste':
      return { kind: 'haste' }
    case 'blood':
      return { kind: 'blood' }
    case 'omamori':
      return { kind: 'omamori' }
    case 'cinder':
      return { kind: 'cinder' }
    case 'mirror':
      return { kind: 'mirror' }
    case 'palm':
      return { kind: 'palm' }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function pickKind(world: World, used: ReadonlySet<SealKind>): SealKind {
  const luck = derive(world.seals).luck
  let choice: SealKind = 'edge'
  const rolls = 1 + luck
  let bestScore = -1
  for (let roll = 0; roll < rolls; roll += 1) {
    const index = Math.floor(rand(world) * CATALOG.length)
    const kind = CATALOG[index] ?? 'edge'
    if (used.has(kind)) continue
    const owned = world.seals.filter((seal) => seal.kind === kind).length
    const jutsu = kind === 'cinder' || kind === 'mirror' || kind === 'palm'
    const score = (jutsu && owned === 0 ? 3 : 0) + rand(world)
    if (score > bestScore) {
      bestScore = score
      choice = kind
    }
  }
  if (used.has(choice)) {
    for (const kind of CATALOG) {
      if (!used.has(kind)) return kind
    }
  }
  return choice
}

export function draftSeals(world: World): [Seal, Seal, Seal] {
  const used = new Set<SealKind>()
  const picked: Seal[] = []
  let guard = 0
  while (picked.length < 3 && guard < 24) {
    guard += 1
    const kind = pickKind(world, used)
    if (used.has(kind)) continue
    used.add(kind)
    picked.push(sealOf(kind))
  }
  const first = picked[0] ?? sealOf('edge')
  const second = picked[1] ?? sealOf('will')
  const third = picked[2] ?? sealOf('lung')
  return [first, second, third]
}

export type SealCopy = {
  name: string
  kana: string
  body: string
}

export function sealCopy(seal: Seal): SealCopy {
  switch (seal.kind) {
    case 'edge':
      return { name: 'Vermillion Edge', kana: '朱刃', body: 'Blade techniques cut deeper. Damage +15%.' }
    case 'scarf':
      return { name: 'Wind Scarf', kana: '風巻', body: 'Another dash charge, and they return faster.' }
    case 'lung':
      return { name: 'Hollow Lung', kana: '虚息', body: '+25 max chakra and a deeper regen.' }
    case 'will':
      return { name: 'Iron Will', kana: '鉄心', body: '+22 max health. You mend a little now.' }
    case 'haste':
      return { name: 'Third Seal', kana: '三印', body: 'Hand seals finish sooner. Attack speed up.' }
    case 'cinder':
      return { name: 'Cinder Fan', kana: '烬扇', body: 'Unlock or sharpen the fan of burning kunai.' }
    case 'mirror':
      return { name: 'Mirror Rite', kana: '鏡式', body: 'Unlock or strengthen a shadow that fights beside you.' }
    case 'palm':
      return { name: 'Void Palm', kana: '虚掌', body: 'Unlock or widen the shockwave around your feet.' }
    case 'omamori':
      return { name: 'Lucky Omamori', kana: '御守', body: 'The next seals offered lean toward what you lack.' }
    case 'blood':
      return { name: 'Blood Seal', kana: '血印', body: 'A share of the damage you deal returns as health.' }
    default: {
      const _exhaustive: never = seal
      return _exhaustive
    }
  }
}

export function unlockedJutsu(stats: Stats): JutsuSlot[] {
  const slots: JutsuSlot[] = []
  if (stats.cinder > 0) slots.push(0)
  if (stats.mirror > 0) slots.push(1)
  if (stats.palm > 0) slots.push(2)
  if (slots.length === 0) slots.push(0)
  return slots
}

export function jutsuName(slot: JutsuSlot, stats: Stats): string {
  switch (slot) {
    case 0:
      return `Cinder Fan  Lv ${stats.cinder}`
    case 1:
      return `Mirror Rite  Lv ${stats.mirror}`
    case 2:
      return `Void Palm  Lv ${stats.palm}`
    default: {
      const _exhaustive: never = slot
      return _exhaustive
    }
  }
}

export function nextJutsu(current: JutsuSlot, stats: Stats): JutsuSlot {
  const slots = unlockedJutsu(stats)
  const index = slots.indexOf(current)
  const following = slots[index + 1] ?? slots[0] ?? 0
  return following
}
