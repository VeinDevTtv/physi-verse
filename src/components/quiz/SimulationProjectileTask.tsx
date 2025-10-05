"use client"

import * as React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimulationQuestion } from "@/lib/quizTypes"

type Props = {
  config: SimulationQuestion
  onResult: (landedX: number) => void
}

export default function ProjectileTask({ config, onResult }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const worldRef = React.useRef<CANNON.World | null>(null)
  const bodyRef = React.useRef<CANNON.Body | null>(null)
  const sceneRefs = React.useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(
    null
  )
  const clockRef = React.useRef<THREE.Clock | null>(null)
  const rafRef = React.useRef<number | null>(null)

  const [velocity, setVelocity] = React.useState<number>(Math.max(5, config.minVelocity ?? 1))
  const [angleDeg, setAngleDeg] = React.useState<number>(45)
  const [landedX, setLandedX] = React.useState<number | null>(null)
  const [playingBack, setPlayingBack] = React.useState(false)
  const recorded = React.useRef<{ x: number; y: number }[]>([])

  const resetAndLaunch = React.useCallback(() => {
    recorded.current = []
    setLandedX(null)
    const body = bodyRef.current
    const world = worldRef.current
    if (!body || !world) return
    body.position.set(0, 0.2, 0)
    body.velocity.set(0, 0, 0)
    body.angularVelocity.set(0, 0, 0)
    body.quaternion.set(0, 0, 0, 1)
    world.gravity.set(0, -(config.gravity ?? 9.81), 0)
    const angleRad = (angleDeg * Math.PI) / 180
    const vx = velocity * Math.cos(angleRad)
    const vy = velocity * Math.sin(angleRad)
    body.velocity.set(vx, vy, 0)
  }, [angleDeg, config.gravity, velocity])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(8, 5, 12)
    camera.lookAt(0, 1, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8)
    scene.add(hemiLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(10, 12, 8)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)
    const groundGeom = new THREE.PlaneGeometry(40, 40)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24 })
    const groundMesh = new THREE.Mesh(groundGeom, groundMat)
    groundMesh.receiveShadow = true
    groundMesh.rotation.x = -Math.PI / 2
    scene.add(groundMesh)
    // Target marker
    const targetGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 16)
    const targetMat = new THREE.MeshStandardMaterial({ color: 0x22c55e })
    const targetMesh = new THREE.Mesh(targetGeom, targetMat)
    targetMesh.position.set(config.targetX, 0.1, 0)
    scene.add(targetMesh)
    // Ball
    const sphereGeom = new THREE.SphereGeometry(0.2, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x4f79ff, metalness: 0.1, roughness: 0.4 })
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat)
    sphereMesh.castShadow = true
    sphereMesh.position.set(0, 0.2, 0)
    scene.add(sphereMesh)
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -(config.gravity ?? 9.81), 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)
    const sphereBody = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.2), position: new CANNON.Vec3(0, 0.2, 0) })
    world.addBody(sphereBody)
    worldRef.current = world
    bodyRef.current = sphereBody
    sceneRefs.current = { renderer, scene, camera }
    clockRef.current = new THREE.Clock()
    let raf = 0
    function onResize() {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", onResize)
    const animate = () => {
      const dt = Math.min(clockRef.current?.getDelta() ?? 0.016, 0.033)
      world.step(1 / 60, dt, 3)
      sphereMesh.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z)
      if (sphereBody.position.y >= 0) {
        recorded.current.push({ x: sphereBody.position.x, y: sphereBody.position.y })
      } else if (landedX === null) {
        const last = recorded.current[recorded.current.length - 1]
        const lx = last ? last.x : sphereBody.position.x
        setLandedX(lx)
        onResult(lx)
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()
    rafRef.current = raf
    resetAndLaunch()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      world.bodies.forEach((b) => world.removeBody(b))
    }
  }, [config.gravity, config.targetX, landedX, onResult, resetAndLaunch])

  function replay() {
    setPlayingBack(true)
    const { scene } = sceneRefs.current ?? {}
    if (!scene) return
    // No heavy playback visualization beyond keeping the object; for now, re-run launch
    resetAndLaunch()
    setTimeout(() => setPlayingBack(false), 800)
  }

  const within =
    landedX !== null && Math.abs(landedX - config.targetX) <= (config.tolerance ?? 0.25)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <Input
          type="number"
          step="0.1"
          placeholder="Velocity"
          value={velocity}
          onChange={(e) => setVelocity(Number(e.target.value))}
        />
        <Input
          type="number"
          step="1"
          placeholder="Angle (deg)"
          value={angleDeg}
          onChange={(e) => setAngleDeg(Number(e.target.value))}
        />
        <Button onClick={resetAndLaunch}>Launch</Button>
        <Button variant="secondary" onClick={replay} disabled={playingBack}>Replay</Button>
        {landedX !== null && (
          <span className={`text-sm ${within ? "text-green-600" : "text-amber-600"}`}>
            Landed x = {landedX.toFixed(2)} (target {config.targetX})
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 320 }} />
    </div>
  )
}


