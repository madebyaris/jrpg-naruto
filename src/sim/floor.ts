import { rand } from './rng'
import { bossFor, floorTitle } from './names'
import {
  BOSS_BASE,
  FOE_BASE,
  APRON,
  GATE,
  INNER_D,
  INNER_W,
  WALL,
  hpScale,
  powerScale,
} from './tune'
import type { Aabb, Boss, BossKind, Foe, FoeKind, FloorPlan, Gate, Pot, Room, World } from './types'

export function nid(world: World): number {
  world.nextId += 1
  return world.nextId
}

function pillar(x: number, z: number, size = 0.5): Aabb {
  return { minX: x - size, maxX: x + size, minZ: z - size, maxZ: z + size }
}

export function buildFloor(world: World, floor: number): FloorPlan {
  const skirmish = floor <= 1 ? 1 : floor === 2 ? 2 : 3
  const roomCount = skirmish + 1
  const rooms: Room[] = []
  for (let index = 0; index < roomCount; index += 1) {
    const z0 = index * (INNER_D + WALL)
    const role = index === roomCount - 1 ? 'boss' : 'skirmish'
    rooms.push({
      index,
      minX: -INNER_W / 2,
      maxX: INNER_W / 2,
      minZ: z0,
      maxZ: z0 + INNER_D,
      role,
      cleared: false,
    })
  }
  const first = rooms[0]
  const last = rooms[roomCount - 1]
  if (!first || !last) {
    throw new Error('floor needs rooms')
  }
  const totalMinZ = -APRON - WALL
  const totalMaxZ = last.maxZ + WALL
  const minX = -INNER_W / 2
  const maxX = INNER_W / 2
  const walls: Aabb[] = [
    { minX: minX - WALL, maxX: minX, minZ: totalMinZ, maxZ: totalMaxZ },
    { minX: maxX, maxX: maxX + WALL, minZ: totalMinZ, maxZ: totalMaxZ },
    { minX: minX - WALL, maxX: maxX + WALL, minZ: totalMinZ, maxZ: -APRON },
    { minX: minX - WALL, maxX: maxX + WALL, minZ: last.maxZ, maxZ: totalMaxZ },
  ]
  const gates: Gate[] = []
  for (let index = 0; index < roomCount - 1; index += 1) {
    const room = rooms[index]
    if (!room) continue
    const z0 = room.maxZ
    const z1 = z0 + WALL
    walls.push({ minX: minX - WALL, maxX: -GATE / 2, minZ: z0, maxZ: z1 })
    walls.push({ minX: GATE / 2, maxX: maxX + WALL, minZ: z0, maxZ: z1 })
    gates.push({
      minX: -GATE / 2,
      maxX: GATE / 2,
      minZ: z0,
      maxZ: z1,
      opensWhenRoomCleared: index,
    })
  }
  const pots: Pot[] = []
  for (const room of rooms) {
    const inset = 2.4
    walls.push(pillar(room.minX + inset, room.minZ + 3.1))
    walls.push(pillar(room.maxX - inset, room.minZ + 3.1))
    walls.push(pillar(room.minX + inset, room.maxZ - 2.6))
    walls.push(pillar(room.maxX - inset, room.maxZ - 2.6))
    const potSpots = [
      { x: room.minX + 1.6, z: room.minZ + 1.8 },
      { x: room.maxX - 1.6, z: room.minZ + 1.8 },
    ]
    for (const spot of potSpots) {
      pots.push({ id: nid(world), room: room.index, x: spot.x, z: spot.z, alive: true })
    }
  }
  const boss = bossFor(floor)
  return {
    floor,
    name: floorTitle(floor, boss),
    rooms,
    walls,
    gates,
    pots,
    boss,
    apron: APRON,
  }
}

export function roomInside(plan: FloorPlan, x: number, z: number): Room | null {
  for (const room of plan.rooms) {
    if (x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ) return room
  }
  return null
}

export function roomAt(plan: FloorPlan, x: number, z: number): Room | null {
  for (const room of plan.rooms) {
    if (x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ) return room
  }
  let nearest: Room | null = null
  let best = Infinity
  for (const room of plan.rooms) {
    const cx = Math.min(Math.max(x, room.minX), room.maxX)
    const cz = Math.min(Math.max(z, room.minZ), room.maxZ)
    const dist = (x - cx) * (x - cx) + (z - cz) * (z - cz)
    if (dist < best) {
      best = dist
      nearest = room
    }
  }
  return nearest
}

function foeCount(floor: number, roomIndex: number): number {
  if (floor <= 1) return 1
  const extra = Math.min(2, Math.floor((floor - 1) / 2))
  return Math.min(5, 2 + extra + (roomIndex > 0 ? 1 : 0))
}

function foeKindAt(floor: number, roomIndex: number, slot: number): FoeKind {
  if (floor <= 1) return 'grunt'
  const table: FoeKind[] =
    (floor + roomIndex) % 4 === 0
      ? ['grunt', 'grunt', 'archer', 'brute', 'archer']
      : (floor + roomIndex) % 4 === 1
        ? ['grunt', 'archer', 'grunt', 'brute', 'grunt']
        : (floor + roomIndex) % 4 === 2
          ? ['archer', 'grunt', 'brute', 'archer', 'grunt']
          : ['brute', 'grunt', 'archer', 'grunt', 'archer']
  return table[slot % table.length] ?? 'grunt'
}

export function makeFoe(world: World, kind: FoeKind, room: number, x: number, z: number, elite: boolean): Foe {
  const base = FOE_BASE[kind]
  const floor = world.floor
  const hpMul = hpScale(floor) * (elite ? 1.45 : 1)
  const powerMul = powerScale(floor) * (elite ? 1.2 : 1)
  const maxHp = world.floor <= 1 && kind === 'grunt' ? 28 : Math.round(base.hp * hpMul)
  return {
    kind: 'foe',
    foe: kind,
    id: nid(world),
    x,
    z,
    vx: 0,
    vz: 0,
    facing: Math.PI,
    hp: maxHp,
    maxHp,
    radius: base.radius * (elite ? 1.08 : 1),
    iframe: 0,
    stun: 0,
    hurt: 0,
    team: kind === 'clone' ? 'ally' : 'enemy',
    room,
    awake: false,
    cd: 0.95 + rand(world) * 0.45,
    intent: { kind: 'idle' },
    life: kind === 'clone' ? 6.5 : 9999,
    elite,
    speed: base.speed * (elite ? 1.08 : 1),
    power: world.floor <= 1 && kind === 'grunt' ? 6 : base.power * powerMul,
  }
}

export function spawnSkirmish(world: World): void {
  for (const room of world.plan.rooms) {
    if (room.role !== 'skirmish') continue
    const count = foeCount(world.floor, room.index)
    for (let slot = 0; slot < count; slot += 1) {
      const cols = 3
      const col = slot % cols
      const row = Math.floor(slot / cols)
      const x = -2.4 + col * 2.4 + (rand(world) - 0.5) * 0.3
      const z = room.minZ + 7.2 + row * 1.7 + (rand(world) - 0.5) * 0.25
      const elite = world.floor >= 3 && slot === 0
      const foe = makeFoe(world, foeKindAt(world.floor, room.index, slot), room.index, x, z, elite)
      world.actors.push(foe)
    }
  }
}

export function makeBoss(world: World, kind: BossKind, room: Room): Boss {
  const base = BOSS_BASE[kind]
  const maxHp = Math.round(base.hp * hpScale(world.floor))
  return {
    kind: 'boss',
    boss: kind,
    id: nid(world),
    x: 0,
    z: (room.minZ + room.maxZ) / 2 + 1.2,
    vx: 0,
    vz: 0,
    facing: Math.PI,
    hp: maxHp,
    maxHp,
    radius: base.radius,
    iframe: 0,
    stun: 0,
    hurt: 0,
    team: 'enemy',
    room: room.index,
    awake: false,
    intent: { kind: 'idle' },
    pattern: 0,
    cd: 0.8,
    summoned: false,
    speed: base.speed,
    power: base.power * powerScale(world.floor),
  }
}

export function spawnBoss(world: World): void {
  const room = world.plan.rooms.find((entry) => entry.role === 'boss')
  if (!room) return
  world.actors.push(makeBoss(world, world.plan.boss, room))
}

export function solids(world: World): Aabb[] {
  const boxes = [...world.plan.walls]
  for (const gate of world.plan.gates) {
    const room = world.plan.rooms[gate.opensWhenRoomCleared]
    if (!room || !room.cleared) boxes.push(gate)
  }
  return boxes
}
