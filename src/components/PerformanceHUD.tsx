"use client"

import * as React from "react"

export function PerformanceHUD(): JSX.Element | null {
  const show = process.env.NEXT_PUBLIC_SHOW_PERF_HUD === "1" || process.env.NEXT_PUBLIC_SHOW_PERF_HUD === "true"
  const [fps, setFps] = React.useState<number>(0)
  const [ms, setMs] = React.useState<number>(0)

  React.useEffect(() => {
    if (!show) return
    let frame = 0
    let last = performance.now()
    let lastFpsUpdate = last
    let frames = 0
    let rafId = 0

    const loop = (now: number) => {
      frames += 1
      const delta = now - last
      setMs(delta)
      last = now
      if (now > lastFpsUpdate + 500) {
        const currentFps = (frames * 1000) / (now - lastFpsUpdate)
        setFps(Math.round(currentFps))
        lastFpsUpdate = now
        frames = 0
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed right-3 top-3 z-50 rounded-lg border bg-background/70 px-3 py-2 text-xs shadow backdrop-blur">
      <div className="font-semibold">Performance</div>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <div className="text-muted-foreground">FPS</div>
        <div className="text-right font-medium">{fps}</div>
        <div className="text-muted-foreground">Frame ms</div>
        <div className="text-right font-medium">{ms.toFixed(1)}</div>
      </div>
    </div>
  )
}


