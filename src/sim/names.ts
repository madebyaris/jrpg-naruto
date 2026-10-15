import type { BossKind } from './types'

const ORDER = ['kurogane', 'futae', 'seijin'] as const

export function bossFor(floor: number): BossKind {
  const index = ((floor - 1) % ORDER.length + ORDER.length) % ORDER.length
  const kind = ORDER[index]
  if (kind === 'kurogane' || kind === 'futae' || kind === 'seijin') return kind
  return 'kurogane'
}

const TITLES: Record<BossKind, readonly string[]> = {
  kurogane: ['Gate Court', 'Iron Latch', 'Warden Walk'],
  futae: ['Mask Gallery', 'Twin Hollow', 'White-Black Step'],
  seijin: ['Saint Steps', 'Ink Bell', 'Prayer Eave'],
}

export function floorTitle(floor: number, boss: BossKind): string {
  const cycle = Math.floor((floor - 1) / 3)
  const titles = TITLES[boss]
  return titles[cycle % titles.length] ?? titles[0] ?? 'Hollow Court'
}

export function bossName(kind: BossKind): string {
  switch (kind) {
    case 'kurogane':
      return 'Kurogane, Gate Warden'
    case 'futae':
      return 'Futae of the Twin Mask'
    case 'seijin':
      return 'Seijin of the Pagoda'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function foeName(kind: 'grunt' | 'archer' | 'brute' | 'clone', elite: boolean): string {
  const base =
    kind === 'grunt' ? 'Ash Puppet' : kind === 'archer' ? 'Crow Archer' : kind === 'brute' ? 'Seal Brute' : 'Mirror Shade'
  return elite ? `Elite ${base}` : base
}
