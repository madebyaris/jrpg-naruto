export type Team = 'ally' | 'enemy'

export type BossKind = 'kurogane' | 'futae' | 'seijin'

export type FoeKind = 'grunt' | 'archer' | 'brute' | 'clone'

export type MoveId =
  | 'slash'
  | 'cleave'
  | 'lunge'
  | 'shot'
  | 'slam'
  | 'fan'
  | 'dashstrike'
  | 'lanes'
  | 'orbs'
  | 'pulse'

export type TelegraphKind = 'none' | 'circle' | 'lanes' | 'ring'

export type Intent =
  | { kind: 'idle' }
  | { kind: 'windup'; move: MoveId; t: number }
  | { kind: 'active'; move: MoveId; t: number; hit: number[] }
  | { kind: 'recover'; move: MoveId; t: number }

export type LightStep = 0 | 1 | 2

export type SwingPhase = 'startup' | 'active' | 'recover'

export type Action =
  | { kind: 'idle' }
  | { kind: 'light'; step: LightStep; phase: SwingPhase; t: number; hit: number[] }
  | { kind: 'heavy'; phase: SwingPhase; t: number; hit: number[] }
  | { kind: 'cinder'; t: number; fired: boolean }
  | { kind: 'palm'; t: number; fired: boolean }
  | { kind: 'mirror'; t: number; fired: boolean }
  | { kind: 'dash'; t: number; dx: number; dz: number }

export type Seal =
  | { kind: 'edge' }
  | { kind: 'scarf' }
  | { kind: 'lung' }
  | { kind: 'will' }
  | { kind: 'haste' }
  | { kind: 'cinder' }
  | { kind: 'mirror' }
  | { kind: 'palm' }
  | { kind: 'omamori' }
  | { kind: 'blood' }

export type SealKind = Seal['kind']

export type JutsuSlot = 0 | 1 | 2

export type ActorCommon = {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  facing: number
  hp: number
  radius: number
  iframe: number
  stun: number
  hurt: number
  team: Team
}

export type Player = ActorCommon & {
  kind: 'player'
  chakra: number
  dashCharges: number
  dashStore: number
  action: Action
  combo: number
  comboLeft: number
  lightStep: LightStep
  chainLeft: number
}

export type Foe = ActorCommon & {
  kind: 'foe'
  foe: FoeKind
  maxHp: number
  room: number
  awake: boolean
  cd: number
  intent: Intent
  life: number
  elite: boolean
  speed: number
  power: number
}

export type Boss = ActorCommon & {
  kind: 'boss'
  boss: BossKind
  maxHp: number
  room: number
  awake: boolean
  intent: Intent
  pattern: number
  cd: number
  summoned: boolean
  speed: number
  power: number
}

export type Actor = Player | Foe | Boss

export type ShotKind = 'kunai' | 'cinder' | 'orb'

export type Shot = {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  radius: number
  damage: number
  team: Team
  life: number
  kind: ShotKind
  hit: number[]
}

export type TelegraphShape =
  | { kind: 'circle'; x: number; z: number; radius: number }
  | { kind: 'lanes'; x: number; z: number; rotation: number; length: number; width: number }
  | { kind: 'ring'; x: number; z: number; radius: number; thickness: number }

export type Telegraph = {
  id: number
  shape: TelegraphShape
  t: number
  dur: number
  damage: number
  team: Team
  hit: number[]
}

export type Pot = {
  id: number
  room: number
  x: number
  z: number
  alive: boolean
}

export type Drop = {
  id: number
  x: number
  z: number
  kind: 'hp' | 'chakra'
  amount: number
  life: number
}

export type PopupStyle = 'hurt' | 'heal' | 'chakra' | 'miss'

export type Popup = {
  id: number
  x: number
  z: number
  text: string
  life: number
  max: number
  style: PopupStyle
}

export type SlashFx = {
  id: number
  x: number
  z: number
  facing: number
  life: number
  max: number
  heavy: boolean
}

export type Aabb = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type Gate = Aabb & { opensWhenRoomCleared: number }

export type RoomRole = 'skirmish' | 'boss'

export type Room = {
  index: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  role: RoomRole
  cleared: boolean
}

export type FloorPlan = {
  floor: number
  name: string
  rooms: Room[]
  walls: Aabb[]
  gates: Gate[]
  pots: Pot[]
  boss: BossKind
  apron: number
}

export type Phase =
  | { kind: 'title' }
  | { kind: 'play' }
  | { kind: 'pause' }
  | { kind: 'reward'; offers: [Seal, Seal, Seal] }
  | { kind: 'downed' }

export type World = {
  phase: Phase
  floor: number
  rng: number
  bestFloor: number
  seals: Seal[]
  plan: FloorPlan
  actors: Actor[]
  shots: Shot[]
  telegraphs: Telegraph[]
  drops: Drop[]
  popups: Popup[]
  slashes: SlashFx[]
  nextId: number
  hitstop: number
  shake: number
  intro: number
  bossFall: number
  banner: string
  bannerT: number
  lockId: number | null
  jutsu: JutsuSlot
  time: number
  kills: number
  floorsCleared: number
  lowChakra: number
}

export type InputFrame = {
  wishX: number
  wishZ: number
  lightHeld: boolean
  heavy: boolean
  dash: boolean
  jutsu: boolean
  lock: boolean
  cycle: boolean
}

export type Stats = {
  maxHp: number
  maxChakra: number
  chakraRegen: number
  damageMul: number
  dashMax: number
  dashRate: number
  attackRate: number
  lifesteal: number
  luck: number
  cinder: number
  mirror: number
  palm: number
}

export function isPlayer(actor: Actor): actor is Player {
  return actor.kind === 'player'
}

export function isFoe(actor: Actor): actor is Foe {
  return actor.kind === 'foe'
}

export function isBoss(actor: Actor): actor is Boss {
  return actor.kind === 'boss'
}
