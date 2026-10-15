import * as THREE from 'three'
import { FRAME_H, FRAME_W, FRAMES, groundCanvas, keyFor, shadowCanvas, sheet, slashCanvas } from './art'
import type { SheetKey } from './art'
import type { Actor, FloorPlan } from '../sim/types'
import { isBoss, isFoe, isPlayer } from '../sim/types'
import type { World } from '../sim/types'

export type CameraRig = {
  yaw: number
  dist: number
  shake: number
}

export type Stage = {
  draw: (world: World, rig: CameraRig, dt: number) => void
  project: (x: number, y: number, z: number) => { x: number; y: number; visible: boolean }
  resize: () => void
}

type ActorView = {
  mesh: THREE.Mesh
  shadow: THREE.Mesh
  material: THREE.MeshBasicMaterial
  texture: THREE.CanvasTexture
  key: SheetKey
}

function frameOf(actor: Actor, time: number): number {
  if (actor.hp <= 0) return 5
  if (actor.hurt > 0.08) return 5
  if (isPlayer(actor)) {
    if (actor.action.kind === 'dash') return Math.floor(time * 16) % 2 === 0 ? 1 : 2
    if (actor.action.kind === 'cinder' || actor.action.kind === 'mirror' || actor.action.kind === 'palm') return 6
    if (actor.action.kind === 'heavy') return 4
    if (actor.action.kind === 'light') return 3
    return Math.hypot(actor.vx, actor.vz) > 1.3 ? (Math.floor(time * 10) % 2 === 0 ? 1 : 2) : 0
  }
  if (actor.intent.kind === 'windup') return 4
  if (actor.intent.kind === 'active' || actor.intent.kind === 'recover') return 3
  return Math.hypot(actor.vx, actor.vz) > 0.7 ? (Math.floor(time * 8) % 2 === 0 ? 1 : 2) : 0
}

function scaleOf(actor: Actor): number {
  if (isBoss(actor)) {
    if (actor.boss === 'kurogane') return 1.72
    if (actor.boss === 'seijin') return 1.58
    return 1.46
  }
  if (isFoe(actor) && actor.foe === 'brute') return 1.26
  if (isFoe(actor) && actor.elite) return 1.08
  return 1
}

function sheetKey(actor: Actor): SheetKey {
  if (isPlayer(actor)) return 'player'
  if (isBoss(actor)) return keyFor(actor.boss, false)
  return keyFor(actor.foe, actor.elite)
}

function makeMap(source: HTMLCanvasElement, repeatX: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(source)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(repeatX, 1)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export function createStage(canvas: HTMLCanvasElement): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x16121c, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x16121c, 16, 46)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80)

  scene.add(new THREE.AmbientLight(0xb7b0c8, 0.72))
  const sun = new THREE.DirectionalLight(0xffe2c4, 1.25)
  sun.position.set(8, 14, 6)
  scene.add(sun)
  const rim = new THREE.DirectionalLight(0x8aa0c8, 0.35)
  rim.position.set(-6, 8, -4)
  scene.add(rim)

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xf3e6c8 }),
  )
  moon.position.set(10, 16, 28)
  scene.add(moon)

  const layout = new THREE.Group()
  scene.add(layout)
  const actorGroup = new THREE.Group()
  scene.add(actorGroup)
  const fxGroup = new THREE.Group()
  scene.add(fxGroup)

  const plane = new THREE.PlaneGeometry(1, 1)
  const shadowTex = makeMap(shadowCanvas(), 1)
  const shadowGeo = new THREE.PlaneGeometry(1, 1)
  const slashTex = makeMap(slashCanvas(), 1)
  const views = new Map<number, ActorView>()
  let planSeen: FloorPlan | null = null
  let lookX = 0
  let lookZ = 2
  let clock = 0


  const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3344 })
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x4e4250 })
  const gateMat = new THREE.MeshLambertMaterial({ color: 0xc4493a })
  const potMat = new THREE.MeshLambertMaterial({ color: 0x6a4632 })
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffb15a })

  const gateMeshes: { mesh: THREE.Object3D; room: number }[] = []
  const potMeshes: { mesh: THREE.Object3D; id: number }[] = []

  function clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0]
      if (!child) break
      group.remove(child)
    }
  }

  function discardFx(): void {
    for (const child of [...fxGroup.children]) {
      fxGroup.remove(child)
      if (!(child instanceof THREE.Mesh)) continue
      if (child.geometry !== plane) child.geometry.dispose()
      const material = child.material
      if (material instanceof THREE.Material) material.dispose()
    }
  }

  function buildLayout(plan: FloorPlan): void {
    clearGroup(layout)
    gateMeshes.length = 0
    potMeshes.length = 0
    const courtTex = makeMap(groundCanvas(false), 1)
    courtTex.wrapS = THREE.RepeatWrapping
    courtTex.wrapT = THREE.RepeatWrapping
    courtTex.repeat.set(3, 2)
    const bossTex = makeMap(groundCanvas(true), 1)
    bossTex.wrapS = THREE.RepeatWrapping
    bossTex.wrapT = THREE.RepeatWrapping
    bossTex.repeat.set(2, 2)

    const porch = plan.rooms[0]
    if (porch && plan.apron > 0) {
      const porchMat = new THREE.MeshLambertMaterial({ map: courtTex })
      const porchMesh = new THREE.Mesh(new THREE.PlaneGeometry(porch.maxX - porch.minX, plan.apron), porchMat)
      porchMesh.rotation.x = -Math.PI / 2
      porchMesh.position.set((porch.minX + porch.maxX) / 2, 0, -plan.apron / 2)
      layout.add(porchMesh)
    }

    for (const room of plan.rooms) {
      const w = room.maxX - room.minX
      const d = room.maxZ - room.minZ
      const mat = new THREE.MeshLambertMaterial({
        map: room.role === 'boss' ? bossTex : courtTex,
      })
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
      floor.rotation.x = -Math.PI / 2
      floor.position.set((room.minX + room.maxX) / 2, 0, (room.minZ + room.maxZ) / 2)
      layout.add(floor)
    }

    for (const box of plan.walls) {
      const w = Math.max(0.05, box.maxX - box.minX)
      const d = Math.max(0.05, box.maxZ - box.minZ)
      const squat = w < 1.4 && d < 1.4
      const h = squat ? 1.7 : 1.15
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), squat ? pillarMat : wallMat)
      mesh.position.set((box.minX + box.maxX) / 2, h / 2, (box.minZ + box.maxZ) / 2)
      layout.add(mesh)
      if (squat) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), lanternMat)
        lamp.position.set(mesh.position.x, h + 0.18, mesh.position.z)
        layout.add(lamp)
      }
    }

    for (const gate of plan.gates) {
      const group = new THREE.Group()
      const z = (gate.minZ + gate.maxZ) / 2
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 0.22), gateMat)
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 0.22), gateMat)
      postL.position.set(gate.minX + 0.2, 1.05, z)
      postR.position.set(gate.maxX - 0.2, 1.05, z)
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(gate.maxX - gate.minX, 0.22, 0.28), gateMat)
      lintel.position.set(0, 2.05, z)
      const bar = new THREE.Mesh(new THREE.BoxGeometry(gate.maxX - gate.minX - 0.2, 0.18, 0.12), gateMat)
      bar.position.set(0, 1.15, z)
      group.add(postL, postR, lintel, bar)
      layout.add(group)
      gateMeshes.push({ mesh: group, room: gate.opensWhenRoomCleared })
    }

    for (const pot of plan.pots) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.42, 8), potMat)
      mesh.position.set(pot.x, 0.21, pot.z)
      layout.add(mesh)
      potMeshes.push({ mesh, id: pot.id })
    }
  }

  function ensureView(actor: Actor): ActorView {
    const key = sheetKey(actor)
    const existing = views.get(actor.id)
    if (existing && existing.key === key) return existing
    if (existing) {
      actorGroup.remove(existing.mesh)
      actorGroup.remove(existing.shadow)
      existing.texture.dispose()
      existing.material.dispose()
      const shadowMaterial = existing.shadow.material
      if (shadowMaterial instanceof THREE.Material) shadowMaterial.dispose()
      views.delete(actor.id)
    }
    const texture = makeMap(sheet(key), 1 / FRAMES)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(plane, material)
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    actorGroup.add(shadow)
    actorGroup.add(mesh)
    const view: ActorView = { mesh, shadow, material, texture, key }
    views.set(actor.id, view)
    return view
  }

  function resize(): void {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
  }

  function project(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    const vector = new THREE.Vector3(x, y, z)
    vector.project(camera)
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    return {
      x: (vector.x * 0.5 + 0.5) * width,
      y: (-vector.y * 0.5 + 0.5) * height,
      visible: vector.z > -1 && vector.z < 1,
    }
  }

  function draw(world: World, rig: CameraRig, dt: number): void {
    clock += dt
    if (planSeen !== world.plan) {
      planSeen = world.plan
      buildLayout(world.plan)
    }
    for (const gate of gateMeshes) {
      const room = world.plan.rooms[gate.room]
      gate.mesh.visible = !room || !room.cleared
    }
    for (const pot of potMeshes) {
      const state = world.plan.pots.find((entry) => entry.id === pot.id)
      pot.mesh.visible = state?.alive ?? false
    }

    const seen = new Set<number>()
    let focusX = lookX
    let focusZ = lookZ
    for (const actor of world.actors) {
      seen.add(actor.id)
      const view = ensureView(actor)
      const scale = scaleOf(actor)
      const height = (FRAME_H / FRAME_W) * 1.35 * scale
      const width = 1.35 * scale
      const bob = isBoss(actor) && actor.boss === 'seijin' ? 0.28 + Math.sin(clock * 2) * 0.06 : 0
      view.mesh.scale.set(width, height, 1)
      view.mesh.position.set(actor.x, height / 2 + bob, actor.z)
      const dx = camera.position.x - actor.x
      const dz = camera.position.z - actor.z
      view.mesh.rotation.set(0, Math.atan2(dx, dz), 0)
      const frame = frameOf(actor, world.time + clock)
      view.texture.offset.x = frame / FRAMES
      view.shadow.position.set(actor.x, 0.03, actor.z)
      view.shadow.scale.set(0.9 * scale, 0.55 * scale, 1)
      view.mesh.visible = true
      if (isPlayer(actor)) {
        focusX = actor.x
        focusZ = actor.z
      }
    }
    for (const [id, view] of views) {
      if (seen.has(id)) continue
      actorGroup.remove(view.mesh)
      actorGroup.remove(view.shadow)
      view.texture.dispose()
      view.material.dispose()
      const shadowMaterial = view.shadow.material
      if (shadowMaterial instanceof THREE.Material) shadowMaterial.dispose()
      views.delete(id)
    }

    discardFx()
    for (const actor of world.actors) {
      if (isPlayer(actor) || actor.hp <= 0) continue
      if (actor.intent.kind !== 'windup') continue
      const tell = new THREE.Mesh(
        new THREE.CircleGeometry(0.48, 20),
        new THREE.MeshBasicMaterial({ color: 0xd94a38, transparent: true, opacity: 0.55, depthWrite: false }),
      )
      tell.rotation.x = -Math.PI / 2
      tell.position.set(
        actor.x + Math.sin(actor.facing) * 0.85,
        0.07,
        actor.z + Math.cos(actor.facing) * 0.85,
      )
      fxGroup.add(tell)
    }
    for (const slash of world.slashes) {
      const mat = new THREE.MeshBasicMaterial({
        map: slashTex,
        transparent: true,
        opacity: Math.max(0, slash.life / slash.max),
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(plane, mat)
      const s = slash.heavy ? 2.6 : 2.15
      mesh.scale.set(s, s * 0.7, 1)
      mesh.position.set(slash.x, 0.9, slash.z)
      mesh.rotation.y = slash.facing
      fxGroup.add(mesh)
    }
    for (const zone of world.telegraphs) {
      const k = Math.min(1, zone.t / Math.max(0.05, zone.dur))
      const mat = new THREE.MeshBasicMaterial({
        color: zone.team === 'ally' ? 0x7ec8ff : 0xd94a38,
        transparent: true,
        opacity: 0.18 + k * 0.28,
        depthWrite: false,
      })
      if (zone.shape.kind === 'circle' || zone.shape.kind === 'ring') {
        const radius = zone.shape.kind === 'circle' ? zone.shape.radius * (0.35 + k * 0.65) : zone.shape.radius * k
        const geo =
          zone.shape.kind === 'ring'
            ? new THREE.RingGeometry(Math.max(0.1, radius - zone.shape.thickness), radius, 40)
            : new THREE.CircleGeometry(radius, 40)
        const mesh = new THREE.Mesh(geo, mat)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(zone.shape.x, 0.06, zone.shape.z)
        fxGroup.add(mesh)
      } else {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(zone.shape.width, zone.shape.length), mat)
        mesh.rotation.x = -Math.PI / 2
        mesh.rotation.z = -zone.shape.rotation
        mesh.position.set(zone.shape.x, 0.06, zone.shape.z)
        fxGroup.add(mesh)
      }
    }
    for (const shot of world.shots) {
      const color = shot.kind === 'cinder' ? 0xff7a3c : shot.kind === 'orb' ? 0xc9a6ff : 0xe8eef2
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(shot.radius, 8, 6),
        new THREE.MeshBasicMaterial({ color }),
      )
      mesh.position.set(shot.x, 0.7, shot.z)
      fxGroup.add(mesh)
    }
    for (const drop of world.drops) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 8),
        new THREE.MeshBasicMaterial({ color: drop.kind === 'hp' ? 0x7dcea0 : 0x7eb6ff }),
      )
      mesh.position.set(drop.x, 0.35 + Math.sin(clock * 4 + drop.id) * 0.06, drop.z)
      fxGroup.add(mesh)
    }

    const glide = 1 - Math.exp(-5 * Math.max(0.001, dt))
    lookX += (focusX - lookX) * glide
    lookZ += (focusZ - lookZ) * glide
    const pitch = 0.96
    const horiz = rig.dist * Math.cos(pitch)
    const y = rig.dist * Math.sin(pitch)
    const jx = Math.sin(clock * 42) * rig.shake * 0.28
    const jy = Math.cos(clock * 37) * rig.shake * 0.18
    camera.position.set(lookX + Math.sin(rig.yaw) * horiz + jx, y + jy, lookZ + Math.cos(rig.yaw) * horiz)
    camera.lookAt(lookX, 0.7, lookZ)
    renderer.render(scene, camera)
  }

  resize()
  return { draw, project, resize }
}
