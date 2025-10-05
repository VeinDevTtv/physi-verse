"use client"

import * as React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

export default function InclinedPlaneLab() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const worldRef = React.useRef<CANNON.World | null>(null)
  const blockRef = React.useRef<CANNON.Body | null>(null)
  const planeRef = React.useRef<CANNON.Body | null>(null)
  const sceneRefs = React.useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(
    null
  )
  const clockRef = React.useRef<THREE.Clock | null>(null)

  const [angleDeg, setAngleDeg] = React.useState<number>(25)
  const [mass, setMass] = React.useState<number>(1)
  const [mu, setMu] = React.useState<number>(0.2)
  const [gravity, setGravity] = React.useState<number>(9.81)

  const reset = React.useCallback(() => {
    const world = worldRef.current
    const block = blockRef.current
    const plane = planeRef.current
    if (!world || !block || !plane) return

    world.gravity.set(0, -gravity, 0)

    block.mass = Math.max(0.0001, mass)
    block.updateMassProperties()
    block.position.set(0, 0.6, 0)
    block.velocity.set(0, 0, 0)
    block.angularVelocity.set(0, 0, 0)

    const theta = (angleDeg * Math.PI) / 180
    plane.quaternion.setFromEuler(-theta, 0, 0)
  }, [angleDeg, gravity, mass])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // THREE
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(6, 4, 8)
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8)
    scene.add(hemiLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(8, 10, 6)
    scene.add(dirLight)

    const planeGeom = new THREE.PlaneGeometry(10, 6)
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x1f2530 })
    const planeMesh = new THREE.Mesh(planeGeom, planeMat)
    planeMesh.receiveShadow = true
    scene.add(planeMesh)

    const boxGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xff7f50 })
    const boxMesh = new THREE.Mesh(boxGeom, boxMat)
    boxMesh.castShadow = true
    scene.add(boxMesh)

    // CANNON
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -gravity, 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 12

    const groundMat = new CANNON.Material("ground")
    const blockMat = new CANNON.Material("block")
    const contact = new CANNON.ContactMaterial(groundMat, blockMat, {
      friction: Math.max(0, Math.min(1, mu)),
      restitution: 0,
    })
    world.addContactMaterial(contact)

    const planeBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: groundMat })
    const blockBody = new CANNON.Body({
      mass: Math.max(0.0001, mass),
      shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)),
      position: new CANNON.Vec3(0, 0.6, 0),
      material: blockMat,
      linearDamping: 0.01,
      angularDamping: 0.02,
    })
    world.addBody(planeBody)
    world.addBody(blockBody)

    // initial angle
    const theta = (angleDeg * Math.PI) / 180
    planeBody.quaternion.setFromEuler(-theta, 0, 0)

    worldRef.current = world
    planeRef.current = planeBody
    blockRef.current = blockBody
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

      // sync three
      planeMesh.quaternion.set(planeBody.quaternion.x, planeBody.quaternion.y, planeBody.quaternion.z, planeBody.quaternion.w)
      boxMesh.position.set(blockBody.position.x, blockBody.position.y, blockBody.position.z)
      boxMesh.quaternion.set(blockBody.quaternion.x, blockBody.quaternion.y, blockBody.quaternion.z, blockBody.quaternion.w)

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      world.bodies.forEach((b) => world.removeBody(b))
      worldRef.current = null
      blockRef.current = null
      planeRef.current = null
      sceneRefs.current = null
      clockRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // update materials and gravity and plane angle
    const world = worldRef.current
    const block = blockRef.current
    const plane = planeRef.current
    if (!world || !block || !plane) return
    world.gravity.set(0, -gravity, 0)
    block.mass = Math.max(0.0001, mass)
    block.updateMassProperties()

    // Update friction by replacing contact material (simpler than diffing)
    const groundMat = (plane.material as CANNON.Material) || new CANNON.Material("ground")
    const blockMat = (block.material as CANNON.Material) || new CANNON.Material("block")
    const friction = Math.max(0, Math.min(1, mu))
    const newContact = new CANNON.ContactMaterial(groundMat, blockMat, { friction, restitution: 0 })
    world.addContactMaterial(newContact)

    const theta = (angleDeg * Math.PI) / 180
    plane.quaternion.setFromEuler(-theta, 0, 0)
  }, [angleDeg, gravity, mass, mu])

  const theta = (angleDeg * Math.PI) / 180
  const componentDownSlope = gravity * Math.sin(theta)
  const normal = gravity * Math.cos(theta)
  const frictionMax = mu * normal
  const netAccel = Math.max(0, componentDownSlope - frictionMax)

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Inclined Plane</CardTitle>
          <CardDescription>Block on a slope with kinetic friction μ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Angle (deg)</label>
              <div className="w-24">
                <Input type="number" min={0} max={60} step={1} value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={angleDeg} min={0} max={60} step={1} onChange={setAngleDeg} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Mass m (kg)</label>
              <div className="w-24">
                <Input type="number" min={0.1} step={0.1} value={mass} onChange={(e) => setMass(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={mass} min={0.1} max={10} step={0.1} onChange={setMass} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Friction μ</label>
              <div className="w-24">
                <Input type="number" min={0} max={1} step={0.01} value={mu} onChange={(e) => setMu(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={mu} min={0} max={1} step={0.01} onChange={setMu} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Gravity g (m/s²)</label>
              <div className="w-24">
                <Input type="number" min={0.5} max={20} step={0.01} value={gravity} onChange={(e) => setGravity(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={gravity} min={0.5} max={20} step={0.01} onChange={setGravity} />

            <div className="rounded-md border p-2 text-xs opacity-70">
              Acceleration down the slope a = g sin(θ) − μ g cos(θ). If μ g cos(θ) ≥ g sin(θ), the block sticks.
              Current a ≈ {netAccel.toFixed(2)} m/s².
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


