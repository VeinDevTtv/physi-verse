"use client"

import * as React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"

export type Vector3 = { x: number; y: number; z: number }

export type SandboxSelectionChange = (selectedIds: number[]) => void

export type SandboxHandle = {
  addBox: (size?: Vector3, options?: { mass?: number; color?: number; position?: Vector3 }) => number
  addSphere: (radius?: number, options?: { mass?: number; color?: number; position?: Vector3 }) => number
  clear: () => void
  setPlaying: (playing: boolean) => void
  setGravity: (g: number) => void
  applyImpulse: (ids: number[], impulse: Vector3) => void
  addDistanceConstraint: (idA: number, idB: number, distance?: number) => void
  removeSelected: () => void
  getSelected: () => number[]
  setSelected: (ids: number[]) => void
}

type Props = {
  className?: string
  onSelectionChange?: SandboxSelectionChange
}

type BodyKind = "box" | "sphere"

type BodyEntry = {
  id: number
  kind: BodyKind
  body: CANNON.Body
  mesh: THREE.Object3D
}

const DEFAULT_G = 9.82

export const SandboxCanvas = React.forwardRef<SandboxHandle, Props>(function SandboxCanvas({ className, onSelectionChange }, ref) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const worldRef = React.useRef<CANNON.World | null>(null)
  const sceneRef = React.useRef<THREE.Scene | null>(null)
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const clockRef = React.useRef<THREE.Clock | null>(null)
  const rafRef = React.useRef<number>(0)

  const idCounterRef = React.useRef<number>(1)
  const bodiesRef = React.useRef<Map<number, BodyEntry>>(new Map())
  const constraintsRef = React.useRef<CANNON.Constraint[]>([])
  const playingRef = React.useRef<boolean>(true)

  const selectedIdsRef = React.useRef<number[]>([])
  const raycasterRef = React.useRef<THREE.Raycaster | null>(null)
  const pointerRef = React.useRef<THREE.Vector2>(new THREE.Vector2())
  const dragPlaneRef = React.useRef<THREE.Plane | null>(null)
  const dragTargetRef = React.useRef<{
    entry: BodyEntry
    localPivot: CANNON.Vec3
    dragBody: CANNON.Body
    dragConstraint: CANNON.PointToPointConstraint
    offset: THREE.Vector3
  } | null>(null)

  const tempVec3 = React.useRef<THREE.Vector3>(new THREE.Vector3())

  const pickByPointer = React.useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    const camera = cameraRef.current
    const scene = sceneRef.current
    if (!container || !camera || !scene) return null
    const rect = container.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1
    pointerRef.current.set(x, y)
    const raycaster = raycasterRef.current!
    raycaster.setFromCamera(pointerRef.current, camera)
    const objects = Array.from(bodiesRef.current.values()).map((e) => e.mesh)
    const intersections = raycaster.intersectObjects(objects, false)
    if (intersections.length === 0) return null
    const hit = intersections[0]
    // Find body entry by mesh
    const entry = Array.from(bodiesRef.current.values()).find((e) => e.mesh === hit.object) || null
    return { hit, entry }
  }, [])

  const toThreeVec = (v: CANNON.Vec3) => new THREE.Vector3(v.x, v.y, v.z)

  const updateSelection = React.useCallback((ids: number[]) => {
    selectedIdsRef.current = ids
    onSelectionChange?.(ids)
    // Brief visual feedback: highlight selected meshes
    bodiesRef.current.forEach((entry) => {
      const isSelected = ids.includes(entry.id)
      if ((entry.mesh as any).material && "emissive" in (entry.mesh as any).material) {
        const mat = (entry.mesh as THREE.Mesh).material as any
        if (mat.emissive) {
          mat.emissive.setHex(isSelected ? 0x223366 : 0x000000)
        }
      }
    })
  }, [onSelectionChange])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Setup THREE
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(10, 8, 14)
    camera.lookAt(0, 1, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(12, 14, 10)
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    scene.add(dir)

    const groundGeom = new THREE.PlaneGeometry(60, 60)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24 })
    const ground = new THREE.Mesh(groundGeom, groundMat)
    ground.receiveShadow = true
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    const grid = new THREE.GridHelper(60, 60, 0x3a3f46, 0x2a2f36)
    ;(grid.material as THREE.Material).opacity = 0.25
    ;(grid.material as THREE.Material as any).transparent = true
    scene.add(grid)

    // Setup Cannon
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -DEFAULT_G, 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10

    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: new CANNON.Material({ friction: 0.4, restitution: 0.2 }) })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)

    worldRef.current = world
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    clockRef.current = new THREE.Clock()
    raycasterRef.current = new THREE.Raycaster()
    dragPlaneRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    function onResize() {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", onResize)

    const animate = () => {
      const dt = Math.min(clockRef.current?.getDelta() ?? 0.016, 0.033)
      if (playingRef.current) {
        world.step(1 / 60, dt, 3)
      }
      // Sync meshes
      bodiesRef.current.forEach((entry) => {
        entry.mesh.position.set(entry.body.position.x, entry.body.position.y, entry.body.position.z)
        entry.mesh.quaternion.set(entry.body.quaternion.x, entry.body.quaternion.y, entry.body.quaternion.z, entry.body.quaternion.w)
      })
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    const onPointerDown = (e: PointerEvent) => {
      const picked = pickByPointer(e.clientX, e.clientY)
      if (!picked || !picked.entry) {
        updateSelection([])
        return
      }
      const { entry, hit } = picked
      // Update selection: toggle if already selected, else replace
      const current = selectedIdsRef.current
      const already = current.includes(entry.id)
      const next = already ? current.filter((id) => id !== entry.id) : [...current, entry.id]
      updateSelection(next)

      // Prepare dragging for primary button only
      if (e.button !== 0) return
      const world = worldRef.current!
      const dragBody = new CANNON.Body({ mass: 0 })
      dragBody.position.copy(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z))
      world.addBody(dragBody)
      const localPivot = entry.body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z))
      const constraint = new CANNON.PointToPointConstraint(entry.body, localPivot, dragBody, new CANNON.Vec3(0, 0, 0))
      world.addConstraint(constraint)
      constraintsRef.current.push(constraint)
      dragTargetRef.current = {
        entry,
        localPivot,
        dragBody,
        dragConstraint: constraint,
        offset: new THREE.Vector3(0, 0, 0),
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const dragTarget = dragTargetRef.current
      if (!dragTarget) return
      const container = containerRef.current
      const camera = cameraRef.current
      if (!container || !camera) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      pointerRef.current.set(x, y)
      const raycaster = raycasterRef.current!
      raycaster.setFromCamera(pointerRef.current, camera)
      const plane = dragPlaneRef.current!
      const pos = tempVec3.current
      if (raycaster.ray.intersectPlane(plane, pos)) {
        dragTarget.dragBody.position.set(pos.x, pos.y, pos.z)
        dragTarget.dragBody.velocity.set(0, 0, 0)
      }
    }

    const endDrag = () => {
      const dragTarget = dragTargetRef.current
      if (!dragTarget) return
      const world = worldRef.current!
      world.removeConstraint(dragTarget.dragConstraint)
      const idx = constraintsRef.current.indexOf(dragTarget.dragConstraint)
      if (idx >= 0) constraintsRef.current.splice(idx, 1)
      world.removeBody(dragTarget.dragBody)
      dragTargetRef.current = null
    }

    const onPointerUp = () => endDrag()
    const onPointerLeave = () => endDrag()

    container.addEventListener("pointerdown", onPointerDown)
    container.addEventListener("pointermove", onPointerMove)
    container.addEventListener("pointerup", onPointerUp)
    container.addEventListener("pointerleave", onPointerLeave)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", onResize)
      container.removeEventListener("pointerdown", onPointerDown)
      container.removeEventListener("pointermove", onPointerMove)
      container.removeEventListener("pointerup", onPointerUp)
      container.removeEventListener("pointerleave", onPointerLeave)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      // Clean Cannon world
      constraintsRef.current.forEach((c) => world.removeConstraint(c))
      constraintsRef.current = []
      world.bodies.forEach((b) => world.removeBody(b))
      worldRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      clockRef.current = null
    }
  }, [pickByPointer, updateSelection])

  // Expose imperative API
  React.useImperativeHandle(ref, (): SandboxHandle => ({
    addBox: (size = { x: 1, y: 1, z: 1 }, options) => {
      const world = worldRef.current!
      const scene = sceneRef.current!
      const id = idCounterRef.current++
      const half = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
      const shape = new CANNON.Box(half)
      const body = new CANNON.Body({
        mass: options?.mass ?? 1,
        shape,
        position: new CANNON.Vec3(options?.position?.x ?? 0, options?.position?.y ?? 2, options?.position?.z ?? 0),
        material: new CANNON.Material({ friction: 0.4, restitution: 0.2 }),
      })
      world.addBody(body)
      const geom = new THREE.BoxGeometry(size.x, size.y, size.z)
      const mat = new THREE.MeshStandardMaterial({ color: options?.color ?? 0x4f79ff, metalness: 0.1, roughness: 0.6 })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.castShadow = true
      scene.add(mesh)
      const entry: BodyEntry = { id, kind: "box", body, mesh }
      bodiesRef.current.set(id, entry)
      return id
    },
    addSphere: (radius = 0.5, options) => {
      const world = worldRef.current!
      const scene = sceneRef.current!
      const id = idCounterRef.current++
      const shape = new CANNON.Sphere(radius)
      const body = new CANNON.Body({
        mass: options?.mass ?? 1,
        shape,
        position: new CANNON.Vec3(options?.position?.x ?? 0, options?.position?.y ?? 2, options?.position?.z ?? 0),
        material: new CANNON.Material({ friction: 0.4, restitution: 0.5 }),
      })
      world.addBody(body)
      const geom = new THREE.SphereGeometry(radius, 32, 32)
      const mat = new THREE.MeshStandardMaterial({ color: options?.color ?? 0xf0b429, metalness: 0.1, roughness: 0.5 })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.castShadow = true
      scene.add(mesh)
      const entry: BodyEntry = { id, kind: "sphere", body, mesh }
      bodiesRef.current.set(id, entry)
      return id
    },
    clear: () => {
      const world = worldRef.current!
      const scene = sceneRef.current!
      // Remove constraints
      constraintsRef.current.forEach((c) => world.removeConstraint(c))
      constraintsRef.current = []
      // Remove dynamic bodies only (keep ground)
      const toRemove = world.bodies.filter((b) => b.mass > 0)
      toRemove.forEach((b) => world.removeBody(b))
      bodiesRef.current.forEach((entry) => {
        scene.remove(entry.mesh)
        if ((entry.mesh as THREE.Mesh).geometry) (entry.mesh as THREE.Mesh).geometry.dispose()
        if ((entry.mesh as THREE.Mesh).material) {
          const mat = (entry.mesh as THREE.Mesh).material as THREE.Material
          mat.dispose()
        }
      })
      bodiesRef.current.clear()
      updateSelection([])
    },
    setPlaying: (playing: boolean) => {
      playingRef.current = playing
    },
    setGravity: (g: number) => {
      const world = worldRef.current
      if (!world) return
      world.gravity.set(0, -g, 0)
    },
    applyImpulse: (ids: number[], impulse: Vector3) => {
      const worldPoint = new CANNON.Vec3(0, 0, 0)
      ids.forEach((id) => {
        const entry = bodiesRef.current.get(id)
        if (!entry) return
        entry.body.applyImpulse(new CANNON.Vec3(impulse.x, impulse.y, impulse.z), worldPoint)
      })
    },
    addDistanceConstraint: (idA: number, idB: number, distance?: number) => {
      const world = worldRef.current!
      const a = bodiesRef.current.get(idA)
      const b = bodiesRef.current.get(idB)
      if (!a || !b) return
      const d = distance ?? toThreeVec(a.body.position).distanceTo(toThreeVec(b.body.position))
      const c = new CANNON.DistanceConstraint(a.body, b.body, d)
      world.addConstraint(c)
      constraintsRef.current.push(c)
    },
    removeSelected: () => {
      const world = worldRef.current!
      const scene = sceneRef.current!
      const ids = selectedIdsRef.current
      ids.forEach((id) => {
        const entry = bodiesRef.current.get(id)
        if (!entry) return
        world.removeBody(entry.body)
        scene.remove(entry.mesh)
        if ((entry.mesh as THREE.Mesh).geometry) (entry.mesh as THREE.Mesh).geometry.dispose()
        if ((entry.mesh as THREE.Mesh).material) ((entry.mesh as THREE.Mesh).material as THREE.Material).dispose()
        bodiesRef.current.delete(id)
      })
      updateSelection([])
    },
    getSelected: () => [...selectedIdsRef.current],
    setSelected: (ids: number[]) => updateSelection(ids),
  }))

  return <div ref={containerRef} className={className} style={{ width: "100%", height: 520 }} />
})


