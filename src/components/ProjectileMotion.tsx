"use client"

import * as React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

type TrajectoryPoint = { x: number; y: number }

export default function ProjectileMotion() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const worldRef = React.useRef<CANNON.World | null>(null)
  const bodyRef = React.useRef<CANNON.Body | null>(null)
  const sceneRefs = React.useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(
    null
  )
  const animationRef = React.useRef<number | null>(null)
  const clockRef = React.useRef<THREE.Clock | null>(null)

  const [initialVelocity, setInitialVelocity] = React.useState<number>(20)
  const [angleDeg, setAngleDeg] = React.useState<number>(45)
  const [gravity, setGravity] = React.useState<number>(9.81)
  const [trajectory, setTrajectory] = React.useState<TrajectoryPoint[]>([])

  const positionsBufferRef = React.useRef<TrajectoryPoint[]>([])
  const frameCounterRef = React.useRef<number>(0)

  const resetAndLaunch = React.useCallback(() => {
    // Reset chart buffer
    positionsBufferRef.current = []
    setTrajectory([])

    const body = bodyRef.current
    const world = worldRef.current
    if (!body || !world) return

    // Reset body
    body.position.set(0, 0.2, 0)
    body.velocity.set(0, 0, 0)
    body.angularVelocity.set(0, 0, 0)
    body.quaternion.set(0, 0, 0, 1)

    // Set gravity
    world.gravity.set(0, -gravity, 0)

    // Compute velocity components (launch in the X-Y plane)
    const angleRad = (angleDeg * Math.PI) / 180
    const vx = initialVelocity * Math.cos(angleRad)
    const vy = initialVelocity * Math.sin(angleRad)
    body.velocity.set(vx, vy, 0)
  }, [angleDeg, gravity, initialVelocity])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // THREE setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(8, 5, 12)
    camera.lookAt(0, 1, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8)
    scene.add(hemiLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(10, 12, 8)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)

    // Ground
    const groundGeom = new THREE.PlaneGeometry(40, 40)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24 })
    const groundMesh = new THREE.Mesh(groundGeom, groundMat)
    groundMesh.receiveShadow = true
    groundMesh.rotation.x = -Math.PI / 2
    scene.add(groundMesh)

    // Axes helper (subtle)
    const axes = new THREE.AxesHelper(5)
    ;(axes.material as THREE.LineBasicMaterial).transparent = true
    ;(axes.material as THREE.LineBasicMaterial).opacity = 0.35
    scene.add(axes)

    // Ball
    const sphereGeom = new THREE.SphereGeometry(0.2, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x4f79ff, metalness: 0.1, roughness: 0.4 })
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat)
    sphereMesh.castShadow = true
    sphereMesh.position.set(0, 0.2, 0)
    scene.add(sphereMesh)

    // CANNON world
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -gravity, 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.2 }),
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)

    const sphereBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.2),
      position: new CANNON.Vec3(0, 0.2, 0),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.2 }),
      linearDamping: 0,
      angularDamping: 0,
    })
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

      // Sync mesh
      sphereMesh.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z)

      // Collect live trajectory while y>=0
      frameCounterRef.current = (frameCounterRef.current + 1) % 2 // throttle updates ~30fps
      if (frameCounterRef.current === 0 && sphereBody.position.y >= 0) {
        positionsBufferRef.current.push({ x: sphereBody.position.x, y: sphereBody.position.y })
        // Push shallow copy to trigger Recharts update
        setTrajectory([...positionsBufferRef.current])
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()
    animationRef.current = raf

    // Initial launch
    resetAndLaunch()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      world.bodies.forEach((b) => world.removeBody(b))
      worldRef.current = null
      bodyRef.current = null
      sceneRefs.current = null
      clockRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Relaunch whenever parameters change
  React.useEffect(() => {
    resetAndLaunch()
  }, [resetAndLaunch])

  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <Card className="h-max">
          <CardHeader>
            <CardTitle>Projectile Motion</CardTitle>
            <CardDescription>Adjust parameters and watch the trajectory.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Initial velocity (m/s)</label>
                <div className="w-24">
                  <Input
                    type="number"
                    value={initialVelocity}
                    onChange={(e) => setInitialVelocity(Number(e.target.value))}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>
              <Slider value={initialVelocity} min={0} max={100} step={0.1} onChange={setInitialVelocity} />

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Angle (deg)</label>
                <div className="w-24">
                  <Input
                    type="number"
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    min={0}
                    max={90}
                    step={0.1}
                  />
                </div>
              </div>
              <Slider value={angleDeg} min={0} max={90} step={0.1} onChange={setAngleDeg} />

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Gravity (m/s²)</label>
                <div className="w-24">
                  <Input
                    type="number"
                    value={gravity}
                    onChange={(e) => setGravity(Number(e.target.value))}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <Slider value={gravity} min={0} max={25} step={0.01} onChange={setGravity} />

              <div className="pt-1">
                <Button type="button" onClick={resetAndLaunch} className="w-full">
                  Launch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative w-full overflow-hidden rounded-lg border bg-background/20">
          <div ref={containerRef} className="h-[480px] w-full" />

          <div className="pointer-events-none absolute right-2 top-2 z-10 w-[360px] rounded-md bg-background/80 p-2 shadow backdrop-blur">
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectory} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23262d" />
                  <XAxis dataKey="x" type="number" tick={{ fontSize: 11 }} stroke="#8b8e98" domain={["auto", "auto"]} />
                  <YAxis dataKey="y" type="number" tick={{ fontSize: 11 }} stroke="#8b8e98" domain={[0, "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="y" stroke="#4f79ff" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


