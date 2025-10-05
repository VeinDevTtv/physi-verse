"use client"

import React from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"

type PhysicsSceneProps = {
  enabled: boolean
  // Mass of the cube in kilograms
  mass?: number
  // Constant force applied along X axis in newtons
  force?: number
  // Gravity along Y axis (m/s^2), negative values pull down
  gravity?: number
  // Called every frame with basic kinematics for plotting
  onSample?: (sample: { t: number; x: number; v: number; a: number }) => void
  className?: string
}

export function PhysicsScene({ enabled, className, mass = 1, force = 0, gravity = -9.82, onSample }: PhysicsSceneProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const cleanupRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0b0b)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(5, 5, 8)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(10, 15, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)

    // Three.js materials/meshes
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x20262e })
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    groundMesh.receiveShadow = true
    groundMesh.rotation.x = -Math.PI / 2
    scene.add(groundMesh)

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x4f79ff })
    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
    cubeMesh.castShadow = true
    cubeMesh.position.set(0, 5, 0)
    scene.add(cubeMesh)

    // Cannon.js physics world
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, gravity, 0) })
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      // Low friction for clearer F = m a demonstration
      material: new CANNON.Material({ friction: 0.0, restitution: 0.0 }),
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)

    const cubeBody = new CANNON.Body({
      mass: enabled ? Math.max(0.0001, mass) : 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      // Rest on the plane by default
      position: new CANNON.Vec3(0, 0.51, 0),
      material: new CANNON.Material({ friction: 0.02, restitution: 0.0 }),
      linearDamping: 0.0,
      angularDamping: 0.0,
    })
    world.addBody(cubeBody)

    let animationFrameId = 0
    const clock = new THREE.Clock()
    let elapsedTime = 0
    let previousVx = 0

    function handleResize() {
      if (!container) return
      const { clientWidth, clientHeight } = container
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }
    window.addEventListener("resize", handleResize)

    function animate() {
      const delta = Math.min(clock.getDelta(), 0.033)
      if (enabled) {
        // Apply constant force along X each step for F = m a visualization
        if (force !== 0) {
          cubeBody.applyForce(new CANNON.Vec3(force, 0, 0), cubeBody.position)
        }
        world.step(1 / 60, delta, 3)
      }

      // Sync Three with Cannon
      cubeMesh.position.set(
        cubeBody.position.x,
        cubeBody.position.y,
        cubeBody.position.z
      )
      cubeMesh.quaternion.set(
        cubeBody.quaternion.x,
        cubeBody.quaternion.y,
        cubeBody.quaternion.z,
        cubeBody.quaternion.w
      )

      // Sampling for charts
      if (enabled && onSample) {
        elapsedTime += delta
        const vx = cubeBody.velocity.x
        const ax = (vx - previousVx) / (delta || 1 / 60)
        previousVx = vx
        onSample({ t: elapsedTime, x: cubeBody.position.x, v: vx, a: ax })
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    cleanupRef.current = () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
      // Cannon bodies and world cleanup
      world.bodies.forEach((b) => world.removeBody(b))
    }

    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, mass, force, gravity])

  return <div ref={containerRef} className={className} style={{ width: "100%", height: 480 }} />
}


