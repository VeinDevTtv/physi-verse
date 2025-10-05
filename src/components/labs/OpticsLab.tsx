"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

type Ray = { x: number; y: number; dx: number; dy: number }

function normalize(dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 1
  return { dx: dx / len, dy: dy / len }
}

export default function OpticsLab() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [refrIndex, setRefrIndex] = React.useState<number>(1.5)
  const [curvature, setCurvature] = React.useState<number>(0.6) // 0 = flat, 1 = strong convex
  const [sourceY, setSourceY] = React.useState<number>(0)

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = "#0b0b0b"
    ctx.fillRect(0, 0, w, h)

    // Lens parameters
    const lensX = Math.round(w * 0.55)
    const lensW = Math.round(w * 0.06)
    const lensH = Math.round(h * 0.7)

    // Lens body
    ctx.fillStyle = "rgba(79,121,255,0.15)"
    ctx.fillRect(lensX - lensW / 2, (h - lensH) / 2, lensW, lensH)

    // Curved right face (convex)
    ctx.strokeStyle = "#6e7fff"
    ctx.lineWidth = 2
    ctx.beginPath()
    const cx = lensX + lensW / 2 + curvature * 60
    ctx.moveTo(lensX + lensW / 2, (h - lensH) / 2)
    ctx.quadraticCurveTo(cx, h / 2, lensX + lensW / 2, (h + lensH) / 2)
    ctx.stroke()

    // Rays from a point source on the left
    const srcX = Math.round(w * 0.15)
    const srcYpx = Math.round(h / 2 + sourceY)

    const rays: Ray[] = []
    for (let i = -4; i <= 4; i++) {
      const dy = i * 10
      const dir = normalize(lensX - srcX, h / 2 + dy - srcYpx)
      rays.push({ x: srcX, y: srcYpx, dx: dir.dx, dy: dir.dy })
    }

    // Draw rays until lens
    ctx.strokeStyle = "#ffc857"
    ctx.lineWidth = 1.5
    for (const r of rays) {
      const t = (lensX - lensW / 2 - r.x) / r.dx
      const ix = r.x + r.dx * t
      const iy = r.y + r.dy * t
      ctx.beginPath()
      ctx.moveTo(r.x, r.y)
      ctx.lineTo(ix, iy)
      ctx.stroke()

      // Refract at lens interface: snell's law on angle with normal of curved surface
      // Approximate normal of quadratic curve at intersection y via derivative
      const yRel = (iy - (h - lensH) / 2) / lensH // 0..1
      const normalAngle = ((yRel - 0.5) * Math.PI * curvature) // simple approximation
      const nx = Math.cos(normalAngle)
      const ny = Math.sin(normalAngle)
      const ndotI = r.dx * nx + r.dy * ny
      const ix_dx = r.dx - 2 * ndotI * nx
      const ix_dy = r.dy - 2 * ndotI * ny

      // Incident angle relative to normal
      const { dx: Ii, dy: Ji } = normalize(r.dx, r.dy)
      const { dx: Nx, dy: Ny } = normalize(nx, ny)
      const cosThetaI = -(Ii * Nx + Ji * Ny)
      const n1 = 1.0
      const n2 = refrIndex
      const eta = n1 / n2
      const k = 1 - eta * eta * (1 - cosThetaI * cosThetaI)
      let tx = r.dx
      let ty = r.dy
      if (k >= 0) {
        // Refraction direction (vector form)
        tx = eta * r.dx + (eta * cosThetaI - Math.sqrt(k)) * Nx
        ty = eta * r.dy + (eta * cosThetaI - Math.sqrt(k)) * Ny
      } else {
        // Total internal reflection fallback: reflect
        tx = ix_dx
        ty = ix_dy
      }
      const t2 = (w - (lensX + lensW / 2) - 10) / tx
      const px2 = ix + tx * t2
      const py2 = iy + ty * t2
      ctx.beginPath()
      ctx.moveTo(ix, iy)
      ctx.lineTo(px2, py2)
      ctx.stroke()
    }

    // Source mark
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(srcX, srcYpx, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [refrIndex, curvature, sourceY])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(640, Math.floor(rect.width))
      canvas.height = 480
      draw()
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [draw])

  React.useEffect(() => {
    draw()
  }, [draw])

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Optics: Ray Tracing</CardTitle>
          <CardDescription>Convex lens, Snell's law, adjustable n.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Refractive index n</label>
              <div className="w-24">
                <Input type="number" min={1} max={2.5} step={0.01} value={refrIndex} onChange={(e) => setRefrIndex(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={refrIndex} min={1} max={2.5} step={0.01} onChange={setRefrIndex} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Curvature</label>
              <div className="w-24">
                <Input type="number" min={0} max={1} step={0.01} value={curvature} onChange={(e) => setCurvature(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={curvature} min={0} max={1} step={0.01} onChange={setCurvature} />

            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Source Y offset (px)</label>
              <div className="w-24">
                <Input type="number" min={-120} max={120} step={1} value={sourceY} onChange={(e) => setSourceY(Number(e.target.value))} />
              </div>
            </div>
            <Slider value={sourceY} min={-120} max={120} step={1} onChange={setSourceY} />

            <div className="rounded-md border p-2 text-xs opacity-70">
              Snell's law: n₁ sin(θ₁) = n₂ sin(θ₂). We approximate a convex lens with a curved interface and compute
              refracted ray directions using vector refraction. Adjust n to see focus shift.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative w-full overflow-hidden rounded-lg border bg-background/20">
        <canvas ref={canvasRef} className="h-[480px] w-full" />
      </div>
    </div>
  )
}


