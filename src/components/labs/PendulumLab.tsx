"use client"

import * as React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

type PendulumParams = {
  length: number
  mass: number
  gravity: number
  damping: number
}

export default function PendulumLab() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const worldRef = React.useRef<CANNON.World | null>(null)
  const bobRef = React.useRef<CANNON.Body | null>(null)
  const pivotRef = React.useRef<CANNON.Body | null>(null)
  const constraintRef = React.useRef<CANNON.PointToPointConstraint | null>(null)
  const sceneRefs = React.useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(
    null
  )
  const clockRef = React.useRef<THREE.Clock | null>(null)
  const rafRef = React.useRef<number | null>(null)

  const [length, setLength] = React.useState<number>(2)
  const [mass, setMass] = React.useState<number>(1)
  const [gravity, setGravity] = React.useState<number>(9.81)
  const [damping, setDamping] = React.useState<number>(0.01)
  const [angleDeg, setAngleDeg] = React.useState<number>(20)

  const resetSimulation = React.useCallback(() => {
    const world = worldRef.current
    const bob = bobRef.current
    const pivot = pivotRef.current
    if (!world || !bob || !pivot) return

    world.gravity.set(0, -gravity, 0)

    bob.mass = Math.max(0.0001, mass)
    bob.updateMassProperties()
    bob.linearDamping = Math.min(0.99, Math.max(0, damping))
    bob.angularDamping = Math.min(0.99, Math.max(0, damping))

    // Position pivot at origin, bob at angle
    pivot.position.set(0, 0, 0)
    const theta = (angleDeg * Math.PI) / 180
    const x = length * Math.sin(theta)
    const y = -length * Math.cos(theta)
    bob.position.set(x, y, 0)
    bob.velocity.set(0, 0, 0)
    bob.angularVelocity.set(0, 0, 0)
  }, [angleDeg, damping, gravity, length, mass])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // THREE setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 0.5, 6)
    camera.lookAt(0, -1, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.9)
    scene.add(hemiLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight.position.set(4, 6, 4)
    scene.add(dirLight)

    // Simple beam to visualize pivot
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x2a2f39 })
    )
    beam.position.set(0, 0, 0)
    scene.add(beam)

    const lineMat = new THREE.LineBasicMaterial({ color: 0x6e7fff })
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -length, 0),
    ])
    const stringLine = new THREE.Line(lineGeom, lineMat)
    scene.add(stringLine)

    const bobGeom = new THREE.SphereGeometry(0.15, 32, 32)
    const bobMat = new THREE.MeshStandardMaterial({ color: 0x4f79ff, roughness: 0.3 })
    const bobMesh = new THREE.Mesh(bobGeom, bobMat)
    scene.add(bobMesh)

    // Physics world
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -gravity, 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10

    const pivotBody = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, 0, 0) })
    const bobBody = new CANNON.Body({
      mass: Math.max(0.0001, mass),
      position: new CANNON.Vec3(0, -length, 0),
      shape: new CANNON.Sphere(0.15),
      linearDamping: damping,
      angularDamping: damping,
    })
    world.addBody(pivotBody)
    world.addBody(bobBody)

    // Constraint to keep rod length fixed
    const constraint = new CANNON.PointToPointConstraint(
      bobBody,
      new CANNON.Vec3(0, 0, 0),
      pivotBody,
      new CANNON.Vec3(0, 0, 0)
    )
    world.addConstraint(constraint)

    worldRef.current = world
    bobRef.current = bobBody
    pivotRef.current = pivotBody
    constraintRef.current = constraint
    sceneRefs.current = { renderer, scene, camera }
    clockRef.current = new THREE.Clock()

    // Initial offset
    resetSimulation()

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

      // Update visuals
      if (bobBody) {
        bobMesh.position.set(bobBody.position.x, bobBody.position.y, bobBody.position.z)
        const p = pivotBody.position
        const b = bobBody.position
        const positions = (stringLine.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute
        positions.setXYZ(0, p.x, p.y, p.z)
        positions.setXYZ(1, b.x, b.y, b.z)
        positions.needsUpdate = true
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()
    rafRef.current = raf

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      world.bodies.forEach((b) => world.removeBody(b))
      world.constraints.forEach((c) => world.removeConstraint(c))
      worldRef.current = null
      bobRef.current = null
      pivotRef.current = null
      constraintRef.current = null
      sceneRefs.current = null
      clockRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // Update line length when changing length
    const sr = sceneRefs.current
    if (sr) {
      const line = sr.scene.children.find((c) => c instanceof THREE.Line) as THREE.Line | undefined
      if (line) {
        const pos = (line.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute
        pos.setXYZ(0, 0, 0, 0)
        pos.setXYZ(1, 0, -length, 0)
        pos.needsUpdate = true
      }
    }
    resetSimulation()
  }, [length, resetSimulation])

  React.useEffect(() => {
    resetSimulation()
  }, [mass, gravity, damping, angleDeg, resetSimulation])

  const periodApprox = 2 * Math.PI * Math.sqrt(length / gravity)

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Pendulum</CardTitle>
          <CardDescription>
            Small-angle period ≈ 2π√(L/g). Damping models air resistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Length L (m)</label>
              <div className="w-24">
                <Input type="number" min={0.2} step={0.01} value={length} onChange={(e) => setLength(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={length} min={0.2} max={5} step={0.01} onChange={setLength} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Mass m (kg)</label>
              <div className="w-24">
                <Input type="number" min={0.1} step={0.1} value={mass} onChange={(e) => setMass(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={mass} min={0.1} max={10} step={0.1} onChange={setMass} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Gravity g (m/s²)</label>
              <div className="w-24">
                <Input type="number" min={0.1} step={0.01} value={gravity} onChange={(e) => setGravity(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={gravity} min={0.5} max={20} step={0.01} onChange={setGravity} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Damping</label>
              <div className="w-24">
                <Input type="number" min={0} max={0.2} step={0.001} value={damping} onChange={(e) => setDamping(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={damping} min={0} max={0.2} step={0.001} onChange={setDamping} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Initial angle (deg)</label>
              <div className="w-24">
                <Input type="number" min={-60} max={60} step={1} value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={angleDeg} min={-60} max={60} step={1} onChange={setAngleDeg} />

            <div className="rounded-md border p-2 text-xs opacity-70">
              The equation for small angles is θ¨ + (g/L)θ + c θ˙ = 0. Here we emulate a rigid
              rod with a constraint and use damping to approximate air resistance. Period ≈ {periodApprox.toFixed(2)} s.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative w-full overflow-hidden rounded-lg border bg-background/20">
        <div ref={containerRef} className="h-[480px] w-full" />
      </div>
    </div>
  )
}


