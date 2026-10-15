import { portrait } from './render/portraits'
import { bossName } from './sim/names'
import { derive, jutsuName, sealCopy } from './sim/seals'
import { deathWords, speakerCard } from './sim/story'
import type { Boss, Seal, SpeakerId, World } from './sim/types'
import { isBoss, isPlayer } from './sim/types'

export type PopupDot = {
  x: number
  y: number
  visible: boolean
  text: string
  style: string
  life: number
  max: number
}

export type UiHandlers = {
  descend: () => void
  seal: (index: number) => void
  title: () => void
  resume: () => void
  mute: () => void
  advance: () => void
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

export type Ui = {
  sync: (world: World, dots: PopupDot[], muted: boolean) => void
  setHandlers: (handlers: UiHandlers) => void
  bindPad: (hold: (code: string) => void, release: (code: string) => void) => void
}

export function mountUi(root: HTMLElement): Ui {
  root.replaceChildren()
  const grain = el('div', 'grain')
  const title = el('section', 'screen')
  const titlePanel = el('div', 'panel')
  titlePanel.append(
    el('p', 'kana', '影路'),
    el('h1', undefined, 'KAGERO'),
    el('p', 'sub', 'You are Asa, last seal-bearer of the Hollow Seal. The road under the porch has three locks. Aya waits where a living name can still stand.'),
  )
  const titleKeys = el('div', 'keys')
  for (const [key, label] of [
    ['WASD', 'Run, camera-relative'],
    ['Shift / Space', 'Dash — brief invulnerability'],
    ['J or click', 'Three-hit blade combo'],
    ['K', 'Heavy cut'],
    ['L', 'Jutsu, spends chakra'],
    ['Tab', 'Cycle jutsu'],
    ['F', 'Lock the nearest foe'],
    ['Q / E, right-drag', 'Orbit the camera'],
    ['Wheel / R', 'Zoom, or reset the view'],
  ] as const) {
    titleKeys.append(el('b', undefined, key), el('span', undefined, label))
  }
  const descend = el('button', 'primary', 'Descend')
  const titleActions = el('div', 'actions')
  titleActions.append(descend)
  const best = el('p', 'sub')
  titlePanel.append(titleKeys, titleActions, best)
  title.append(titlePanel)

  const tale = el('section', 'screen tale hidden')
  const taleStage = el('div', 'tale-stage')
  const talePortrait = el('canvas', 'tale-portrait')
  talePortrait.width = 200
  talePortrait.height = 260
  const taleCopy = el('div', 'tale-copy')
  const taleAct = el('p', 'kana')
  const taleWho = el('h2')
  const taleRole = el('p', 'role')
  const taleLine = el('p', 'line')
  const taleQuest = el('p', 'objective')
  const taleNext = el('button', 'primary', 'Continue')
  taleCopy.append(taleAct, taleWho, taleRole, taleLine, taleQuest, taleNext)
  taleStage.append(talePortrait, taleCopy)
  tale.append(taleStage)

  const reward = el('section', 'screen hidden')
  const rewardPanel = el('div', 'panel')
  const rewardTitle = el('h1', undefined, 'A seal remains')
  const rewardSub = el('p', 'sub', 'Choose one. The pagoda will not offer it again until the next fall.')
  const cards = el('div', 'cards')
  rewardPanel.append(el('p', 'kana', '印'), rewardTitle, rewardSub, cards)
  reward.append(rewardPanel)

  const downed = el('section', 'screen hidden')
  const downPanel = el('div', 'panel')
  const downTitle = el('h1', undefined, 'Shadow kept')
  const downBody = el('p', 'sub')
  const again = el('button', 'primary', 'Return to the gate')
  const downActions = el('div', 'actions')
  downActions.append(again)
  downPanel.append(el('p', 'kana', '散'), downTitle, downBody, downActions)
  downed.append(downPanel)

  const paused = el('section', 'screen hidden')
  const pausePanel = el('div', 'panel')
  const resume = el('button', 'primary', 'Resume')
  const quit = el('button', undefined, 'Abandon run')
  const pauseActions = el('div', 'actions')
  pauseActions.append(resume, quit)
  pausePanel.append(el('p', 'kana', '休'), el('h1', undefined, 'Paused'), pauseActions)
  paused.append(pausePanel)

  const hud = el('div', 'hud')
  const vignette = el('div', 'vignette')
  const floorTag = el('div', 'floor-tag')
  const floorName = el('div')
  const floorSmall = el('small')
  floorTag.append(floorSmall, floorName)
  const mute = el('button', 'mute', 'Sound on')
  const bossbar = el('div', 'bossbar hidden')
  const bossNameEl = el('div', 'name')
  const bossTrack = el('div', 'track')
  const bossFill = el('div', 'fill boss')
  bossTrack.append(bossFill)
  bossbar.append(bossNameEl, bossTrack)
  const toast = el('div', 'toast')
  const map = el('canvas', 'minimap')
  map.width = 132
  map.height = 168
  const bars = el('div', 'bars')
  const hpLabel = el('div', 'bar-label')
  const hpName = el('span', undefined, 'VITAL')
  const hpNum = el('span')
  hpLabel.append(hpName, hpNum)
  const hpTrack = el('div', 'track')
  const hpFill = el('div', 'fill')
  hpTrack.append(hpFill)
  const ckLabel = el('div', 'bar-label')
  const ckName = el('span', undefined, 'CHAKRA')
  const ckNum = el('span')
  ckLabel.append(ckName, ckNum)
  const ckTrack = el('div', 'track')
  const ckFill = el('div', 'fill chakra')
  ckTrack.append(ckFill)
  const pips = el('div', 'dash-pips')
  const seals = el('div', 'seals')
  bars.append(hpLabel, hpTrack, ckLabel, ckTrack, pips, seals)
  const combo = el('div', 'combo')
  const jutsu = el('div', 'jutsu')
  const jutsuKana = el('span', undefined, 'JUTSU')
  const jutsuNameEl = el('b')
  jutsu.append(jutsuKana, jutsuNameEl)
  const quest = el('div', 'quest')
  const questAct = el('small')
  const questName = el('b')
  const questBody = el('span')
  quest.append(questAct, questName, questBody)
  const bark = el('div', 'bark hidden')
  const barkPortrait = el('canvas')
  barkPortrait.width = 200
  barkPortrait.height = 260
  const barkText = el('p')
  bark.append(barkPortrait, barkText)
  const hint = el('div', 'hint', 'WASD run · Shift dash · J combo · K heavy · L jutsu · Q/E camera')
  const pad = el('div', 'pad')
  const attackBtn = el('button', 'pad-btn', 'Attack')
  const dashBtn = el('button', 'pad-btn', 'Dash')
  const jutsuBtn = el('button', 'pad-btn', 'Jutsu')
  pad.append(attackBtn, dashBtn, jutsuBtn)
  const popups = el('div', 'popups')
  hud.append(vignette, floorTag, mute, bossbar, toast, map, bars, combo, jutsu, hint, quest, bark, pad, popups)

  root.append(grain, title, tale, reward, downed, paused, hud)

  let handlers: UiHandlers = {
    descend: () => undefined,
    seal: () => undefined,
    title: () => undefined,
    resume: () => undefined,
    mute: () => undefined,
    advance: () => undefined,
  }
  descend.addEventListener('click', () => handlers.descend())
  again.addEventListener('click', () => handlers.title())
  resume.addEventListener('click', () => handlers.resume())
  quit.addEventListener('click', () => handlers.title())
  mute.addEventListener('click', () => handlers.mute())
  taleNext.addEventListener('click', () => handlers.advance())

  let rewardKey = ''
  let taleKey = ''
  let barkKey = ''

  function paintFace(canvas: HTMLCanvasElement, id: SpeakerId): void {
    const face = portrait(id)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(face, 0, 0, canvas.width, canvas.height)
  }

  function show(node: HTMLElement, on: boolean): void {
    node.classList.toggle('hidden', !on)
  }

  function paintMap(world: World): void {
    const ctx = map.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, map.width, map.height)
    const rooms = world.plan.rooms
    if (rooms.length === 0) return
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const room of rooms) {
      minX = Math.min(minX, room.minX)
      maxX = Math.max(maxX, room.maxX)
      minZ = Math.min(minZ, room.minZ)
      maxZ = Math.max(maxZ, room.maxZ)
    }
    const spanX = Math.max(0.001, maxX - minX)
    const spanZ = Math.max(0.001, maxZ - minZ)
    const scale = Math.min((map.width - 16) / spanX, (map.height - 16) / spanZ)
    const ox = (map.width - spanX * scale) / 2
    const oy = (map.height - spanZ * scale) / 2
    const px = (x: number) => ox + (x - minX) * scale
    const pz = (z: number) => oy + (maxZ - z) * scale
    for (const room of rooms) {
      ctx.fillStyle = room.role === 'boss' ? '#3a2430' : room.cleared ? '#243028' : '#2a2433'
      ctx.strokeStyle = room.role === 'boss' ? '#e4b15a' : '#f3e6cf'
      ctx.lineWidth = 1
      const x = px(room.minX)
      const y = pz(room.maxZ)
      const w = (room.maxX - room.minX) * scale
      const h = (room.maxZ - room.minZ) * scale
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    }
    const player = world.actors.find(isPlayer)
    if (!player) return
    ctx.fillStyle = '#d94a38'
    ctx.beginPath()
    ctx.arc(px(player.x), pz(player.z), 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  function sync(world: World, dots: PopupDot[], muted: boolean): void {
    const playing = world.phase.kind === 'play' || world.phase.kind === 'pause'
    show(title, world.phase.kind === 'title')
    show(tale, world.phase.kind === 'tale')
    show(reward, world.phase.kind === 'reward')
    show(downed, world.phase.kind === 'downed')
    show(paused, world.phase.kind === 'pause')
    show(hud, world.phase.kind !== 'title' && world.phase.kind !== 'tale')
    mute.textContent = muted ? 'Sound off' : 'Sound on'
    best.textContent = world.bestFloor > 0 ? `Deepest floor reached: ${world.bestFloor}` : 'The gate has not been passed.'

    const stats = derive(world.seals)
    const player = world.actors.find(isPlayer)
    if (player) {
      const hpPct = Math.max(0, player.hp / stats.maxHp) * 100
      hpFill.style.width = `${hpPct}%`
      hpNum.textContent = `${Math.ceil(player.hp)} / ${stats.maxHp}`
      ckFill.style.width = `${Math.max(0, player.chakra / stats.maxChakra) * 100}%`
      ckNum.textContent = `${Math.ceil(player.chakra)} / ${stats.maxChakra}`
      pips.replaceChildren()
      for (let i = 0; i < stats.dashMax; i += 1) {
        pips.append(el('i', i < player.dashCharges ? 'on' : undefined))
      }
      combo.textContent = player.combo > 1 ? `${player.combo} HIT` : ''
      vignette.classList.toggle('on', player.hurt > 0 || player.hp < stats.maxHp * 0.28)
      const low = world.lowChakra > 0
      jutsuNameEl.textContent = low ? 'Not enough chakra' : jutsuName(world.jutsu, stats)
      jutsuNameEl.classList.toggle('warn', low)
    }
    seals.replaceChildren()
    for (const seal of world.seals) {
      seals.append(el('span', undefined, sealCopy(seal).kana))
    }
    floorSmall.textContent = `FLOOR ${world.floor}`
    floorName.textContent = world.plan.name
    questAct.textContent = world.quest.act
    questName.textContent = world.quest.name
    questBody.textContent = world.quest.objective
    const speaking = world.bark
    show(bark, playing && speaking != null)
    if (speaking) {
      const key = `${speaking.speaker}:${speaking.text}`
      if (key !== barkKey) {
        barkKey = key
        paintFace(barkPortrait, speaking.speaker)
        const card = speakerCard(speaking.speaker)
        barkText.textContent = `${card.name}: ${speaking.text}`
      }
    } else {
      barkKey = ''
    }
    hint.classList.toggle('hidden', world.floor > 1 || world.time > 10)
    toast.textContent = world.bannerT > 0 ? world.banner : ''

    const boss = world.actors.find((actor): actor is Boss => isBoss(actor) && actor.hp > 0 && actor.awake)
    show(bossbar, playing && boss != null)
    if (boss) {
      bossNameEl.textContent = bossName(boss.boss)
      bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`
    }

    if (world.phase.kind === 'tale') {
      const { tale: story, index, after } = world.phase
      const line = story.lines[index] ?? story.lines[0]
      const key = `${story.id}:${index}`
      if (line && key !== taleKey) {
        taleKey = key
        paintFace(talePortrait, line.speaker)
        const card = speakerCard(line.speaker)
        taleAct.textContent = story.act
        taleWho.textContent = card.name
        taleRole.textContent = card.role
        taleLine.textContent = line.text
        taleQuest.textContent = `${story.quest} — ${story.objective}`
        const last = index >= story.lines.length - 1
        taleNext.textContent = last ? (after === 'reward' ? 'Choose a name' : 'Walk in') : 'Continue'
      }
    } else {
      taleKey = ''
    }

    if (world.phase.kind === 'reward') {
      const key = world.phase.offers.map((seal) => seal.kind).join('|')
      if (key !== rewardKey) {
        rewardKey = key
        cards.replaceChildren()
        world.phase.offers.forEach((seal, index) => {
          cards.append(cardButton(seal, index, () => handlers.seal(index)))
        })
      }
    } else {
      rewardKey = ''
    }

    if (world.phase.kind === 'downed') {
      const names = world.seals.map((seal) => sealCopy(seal).name).join(', ')
      downBody.textContent = `${deathWords(world.floor)} Fell on floor ${world.floor} (${world.plan.name}). Cleared ${world.floorsCleared}. Foes scattered: ${world.kills}. Best floor ${world.bestFloor}. Seals: ${names || 'none'}.`
    }

    popups.replaceChildren()
    for (const dot of dots) {
      if (!dot.visible) continue
      const node = el('div', `popup ${dot.style}`, dot.text)
      node.style.left = `${dot.x}px`
      node.style.top = `${dot.y}px`
      node.style.opacity = String(Math.max(0, dot.life / dot.max))
      popups.append(node)
    }
    paintMap(world)
  }

  const holdBtn = (button: HTMLButtonElement, code: string, hold: (code: string) => void, release: (code: string) => void) => {
    button.type = 'button'
    const press = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      hold(code)
    }
    const lift = (event: Event) => {
      event.preventDefault()
      release(code)
    }
    button.addEventListener('pointerdown', press)
    button.addEventListener('mousedown', press)
    button.addEventListener('pointerup', lift)
    button.addEventListener('mouseup', lift)
    button.addEventListener('pointerleave', lift)
    button.addEventListener('pointercancel', lift)
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      hold(code)
      requestAnimationFrame(() => release(code))
    })
  }

  return {
    sync,
    setHandlers(next) {
      handlers = next
    },
    bindPad(hold, release) {
      holdBtn(attackBtn, 'KeyJ', hold, release)
      holdBtn(dashBtn, 'ShiftLeft', hold, release)
      holdBtn(jutsuBtn, 'KeyL', hold, release)
    },
  }
}

function cardButton(seal: Seal, index: number, onClick: () => void): HTMLButtonElement {
  const copy = sealCopy(seal)
  const button = el('button', 'card')
  button.append(
    el('div', 'kana', `${index + 1}  ·  ${copy.kana}`),
    el('strong', undefined, copy.name),
    el('p', undefined, copy.body),
  )
  button.addEventListener('click', onClick)
  return button
}
