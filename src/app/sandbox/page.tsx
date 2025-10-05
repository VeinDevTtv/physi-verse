"use client"

import React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { SandboxCanvas, SandboxHandle } from "@/components/sandbox/SandboxCanvas"

export default function SandboxPage() {
  const canvasRef = React.useRef<SandboxHandle | null>(null)
  const [gravity, setGravity] = React.useState<number>(9.82)
  const [playing, setPlaying] = React.useState<boolean>(true)
  const [selected, setSelected] = React.useState<number[]>([])
  const [impulse, setImpulse] = React.useState<{ x: number; y: number; z: number }>({ x: 0, y: 5, z: 0 })

  const handleAddBox = () => canvasRef.current?.addBox(undefined, { position: { x: 0, y: 2, z: 0 } })
  const handleAddSphere = () => canvasRef.current?.addSphere(undefined, { position: { x: 0, y: 2, z: 0 } })
  const handleClear = () => canvasRef.current?.clear()
  const handleTogglePlay = () => {
    const next = !playing
    setPlaying(next)
    canvasRef.current?.setPlaying(next)
  }
  const handleApplyImpulse = () => {
    if (selected.length === 0) return
    canvasRef.current?.applyImpulse(selected, impulse)
  }
  const handleLinkSelected = () => {
    if (selected.length !== 2) return
    canvasRef.current?.addDistanceConstraint(selected[0], selected[1])
  }

  React.useEffect(() => {
    canvasRef.current?.setGravity(gravity)
  }, [gravity])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Sandbox Mode</h1>
          <p className="text-sm opacity-70">Build your own experiments: add objects, drag them, apply forces, link with constraints.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
          <Card className="h-max">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Objects, physics and selection tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleAddBox} className="w-full">Add Box</Button>
                  <Button onClick={handleAddSphere} variant="outline" className="w-full">Add Sphere</Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">Gravity (m/s²)</label>
                  <div className="w-24">
                    <Input type="number" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} step={0.01} min={0} />
                  </div>
                </div>
                <Slider value={gravity} min={0} max={25} step={0.01} onChange={setGravity} />

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={handleTogglePlay} className="w-full">{playing ? "Pause" : "Play"}</Button>
                  <Button onClick={handleClear} variant="outline" className="w-full">Clear</Button>
                  <Button onClick={() => canvasRef.current?.removeSelected()} variant="ghost" className="w-full">Delete</Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Impulse (N·s)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" value={impulse.x} onChange={(e) => setImpulse({ ...impulse, x: Number(e.target.value) })} />
                    <Input type="number" value={impulse.y} onChange={(e) => setImpulse({ ...impulse, y: Number(e.target.value) })} />
                    <Input type="number" value={impulse.z} onChange={(e) => setImpulse({ ...impulse, z: Number(e.target.value) })} />
                  </div>
                  <Button onClick={handleApplyImpulse} className="w-full">Apply to Selected</Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Constraints</div>
                  <Button onClick={handleLinkSelected} variant={selected.length === 2 ? "default" : "outline"} disabled={selected.length !== 2} className="w-full">Link Selected (Distance)</Button>
                </div>

                <div className="rounded-md border p-2 text-xs text-muted-foreground">
                  <div>Selected: {selected.length} {selected.length === 1 ? "object" : "objects"}</div>
                  <div className="mt-1">Hint: Click objects to select. Drag with left mouse to move along ground plane.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative w-full overflow-hidden rounded-lg border bg-background/20">
            <SandboxCanvas ref={canvasRef} onSelectionChange={setSelected} className="h-[520px] w-full" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


