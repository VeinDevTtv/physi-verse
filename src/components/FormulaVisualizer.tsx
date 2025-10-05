"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { PhysicsScene } from "@/three/PhysicsScene"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type KnownFormulaKey = "F=ma" | "E=0.5mv^2"

type FormulaDefinition = {
  key: KnownFormulaKey
  label: string
  variables: { key: "m" | "a" | "v" | "F" | "E"; label: string; min: number; max: number; step: number }[]
  // Given current state, compute primary dependent value and series for chart
  evaluate: (state: { m: number; a: number; v: number }) => {
    dependentLabel: string
    dependentValue: number
    seriesLabel: string
    data: { x: number; y: number }[]
  }
}

const FORMULAS: Record<KnownFormulaKey, FormulaDefinition> = {
  "F=ma": {
    key: "F=ma",
    label: "F = m a",
    variables: [
      { key: "m", label: "Mass m (kg)", min: 0.1, max: 20, step: 0.1 },
      { key: "a", label: "Acceleration a (m/s²)", min: -20, max: 20, step: 0.1 },
    ],
    evaluate: ({ m, a }) => {
      const F = m * a
      // Show how F changes as a varies for fixed m
      const data = Array.from({ length: 81 }, (_, i) => {
        const aVal = -20 + i * 0.5
        return { x: aVal, y: m * aVal }
      })
      return { dependentLabel: "Force F (N)", dependentValue: F, seriesLabel: "F vs a", data }
    },
  },
  "E=0.5mv^2": {
    key: "E=0.5mv^2",
    label: "E = 1/2 m v²",
    variables: [
      { key: "m", label: "Mass m (kg)", min: 0.1, max: 20, step: 0.1 },
      { key: "v", label: "Velocity v (m/s)", min: 0, max: 40, step: 0.5 },
    ],
    evaluate: ({ m, v }) => {
      const E = 0.5 * m * v * v
      // Show how E grows with v
      const data = Array.from({ length: 81 }, (_, i) => {
        const vVal = i * 0.5
        return { x: vVal, y: 0.5 * m * vVal * vVal }
      })
      return { dependentLabel: "Energy E (J)", dependentValue: E, seriesLabel: "E vs v", data }
    },
  },
}

function formatNumber(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "—"
}

export default function FormulaVisualizer({ className }: { className?: string }) {
  const [formulaKey, setFormulaKey] = React.useState<KnownFormulaKey>("F=ma")
  const [m, setM] = React.useState(5)
  const [a, setA] = React.useState(2)
  const [v, setV] = React.useState(5)
  const [enabled, setEnabled] = React.useState(true)

  // Samples from physics for F=ma demo
  const [samples, setSamples] = React.useState<{ t: number; x: number; v: number; a: number }[]>([])

  React.useEffect(() => {
    setSamples([])
  }, [m, a, v, formulaKey])

  const formula = FORMULAS[formulaKey]
  const { dependentLabel, dependentValue, seriesLabel, data } = formula.evaluate({ m, a, v })

  // Physics driving parameters for F = m a: apply F = m a as constant force
  const forceForPhysics = formulaKey === "F=ma" ? m * a : 0

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 md:flex-row">
        <Card className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={formulaKey}
                onChange={(e) => setFormulaKey(e.target.value as KnownFormulaKey)}
              >
                <option value="F=ma">F = m a</option>
                <option value="E=0.5mv^2">E = 1/2 m v²</option>
              </select>
              <span className="text-sm opacity-70">Interactive Formula</span>
            </div>
            <div className="text-sm">
              <span className="opacity-70">{dependentLabel}: </span>
              <span className="font-semibold">{formatNumber(dependentValue)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              {formula.variables.map((vdef) => (
                <div key={vdef.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">{vdef.label}</span>
                    <span className="font-semibold">
                      {vdef.key === "m" ? formatNumber(m) : vdef.key === "a" ? formatNumber(a) : formatNumber(v)}
                    </span>
                  </div>
                  <Slider
                    value={vdef.key === "m" ? m : vdef.key === "a" ? a : v}
                    min={vdef.min}
                    max={vdef.max}
                    step={vdef.step}
                    onChange={(val) => {
                      if (vdef.key === "m") setM(val)
                      else if (vdef.key === "a") setA(val)
                      else setV(val)
                    }}
                  />
                </div>
              ))}

              <div className="rounded-md border p-2 text-xs opacity-70">
                {formulaKey === "F=ma"
                  ? "Simulation applies constant force F = m·a on a cube over a frictionless plane."
                  : "Graph shows kinetic energy growth with velocity for the chosen mass."}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="x" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ stroke: "#444" }} />
                  <Line type="monotone" dataKey="y" dot={false} stroke="#4f79ff" strokeWidth={2} name={seriesLabel} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-sm font-medium">3D Simulation</span>
          <label className="flex items-center gap-2 text-xs opacity-80">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-4 accent-primary"
            />
            Physics
          </label>
        </div>
        <PhysicsScene
          enabled={enabled}
          mass={m}
          force={forceForPhysics}
          gravity={-9.82}
          onSample={(s) => {
            setSamples((prev) => (prev.length > 600 ? [...prev.slice(-600), s] : [...prev, s]))
          }}
          className="rounded-md"
        />
        {formulaKey === "F=ma" && samples.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 px-2 text-xs opacity-80">
            <div>t = {formatNumber(samples[samples.length - 1]?.t)} s</div>
            <div>vₓ = {formatNumber(samples[samples.length - 1]?.v)} m/s</div>
            <div>aₓ ≈ {formatNumber(samples[samples.length - 1]?.a)} m/s²</div>
          </div>
        )}
      </Card>
    </div>
  )
}


