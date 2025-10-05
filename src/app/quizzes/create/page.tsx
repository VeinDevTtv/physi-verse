"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Quiz, CreateQuizPayload, Question } from "@/lib/quizTypes"
import { evaluateExpression } from "@/lib/eval"

export default function CreateQuizPage() {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<Quiz | null>(null)

  function addMcq() {
    setQuestions((q) => [
      ...q,
      { id: crypto.randomUUID(), type: "mcq", prompt: "", choices: [""], correctIndex: 0 },
    ])
  }

  function addFormula() {
    setQuestions((q) => [
      ...q,
      { id: crypto.randomUUID(), type: "formula", prompt: "", expectedValue: 0, tolerance: 0.01 },
    ])
  }

  function addSimulation() {
    setQuestions((q) => [
      ...q,
      {
        id: crypto.randomUUID(),
        type: "simulation",
        prompt: "Set velocity/angle so projectile lands at target x.",
        simulation: "projectile",
        targetX: 10,
        gravity: 9.81,
        tolerance: 0.25,
        minVelocity: 1,
        maxVelocity: 50,
        minAngleDeg: 0,
        maxAngleDeg: 90,
      },
    ])
  }

  function updateQuestion<K extends keyof Question>(id: string, key: K, value: Question[K]) {
    setQuestions((arr) => arr.map((q) => (q.id === id ? { ...q, [key]: value } : q)))
  }

  function removeQuestion(id: string) {
    setQuestions((arr) => arr.filter((q) => q.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setCreated(null)
    try {
      // Normalize formula questions if creator typed an expression in a helper field
      const payload: CreateQuizPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => {
          if (q.type === "formula") {
            return { ...q, expectedValue: Number(q.expectedValue) }
          }
          return q
        }),
      }
      const res = await fetch("/api/quizzes", { method: "POST", body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Failed to save")
      const json = (await res.json()) as Quiz
      setCreated(json)
      setTitle("")
      setDescription("")
      setQuestions([])
    } catch (e) {
      setError("Could not save quiz")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Quiz</CardTitle>
          <CardDescription>Build a quiz with MCQ, formula input, and simulation tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="flex gap-2">
            <Button onClick={addMcq} variant="secondary">Add Multiple-choice</Button>
            <Button onClick={addFormula} variant="secondary">Add Formula</Button>
            <Button onClick={addSimulation} variant="secondary">Add Simulation</Button>
          </div>

          <div className="space-y-3">
            {questions.map((q) => (
              <Card key={q.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">{q.type.toUpperCase()}</CardTitle>
                  <Button variant="ghost" onClick={() => removeQuestion(q.id)}>Remove</Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Prompt"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(q.id, "prompt", e.target.value as any)}
                  />

                  {q.type === "mcq" && (
                    <div className="space-y-2">
                      {q.choices.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            placeholder={`Choice ${idx + 1}`}
                            value={c}
                            onChange={(e) => {
                              const next = [...q.choices]
                              next[idx] = e.target.value
                              updateQuestion(q.id, "choices", next as any)
                            }}
                          />
                          <Button
                            variant={q.correctIndex === idx ? "default" : "outline"}
                            onClick={() => updateQuestion(q.id, "correctIndex", idx as any)}
                          >
                            Correct
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const next = q.choices.filter((_, i) => i !== idx)
                              updateQuestion(q.id, "choices", next as any)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => updateQuestion(q.id, "choices", [...q.choices, ""] as any)}
                      >
                        Add Choice
                      </Button>
                    </div>
                  )}

                  {q.type === "formula" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Expected numeric value (e.g., 2*sqrt(2))"
                        value={String(q.expectedValue)}
                        onChange={(e) => {
                          const v = e.target.value
                          // allow temporary non-numeric, we evaluate on save
                          updateQuestion(q.id, "expectedValue", (evaluateExpression(v) ?? Number(v) || 0) as any)
                        }}
                      />
                      <Input
                        placeholder="Tolerance (e.g., 0.01)"
                        value={String(q.tolerance ?? "")}
                        onChange={(e) => updateQuestion(q.id, "tolerance", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Units (optional)"
                        value={String((q as any).units ?? "")}
                        onChange={(e) => updateQuestion(q.id, "units", e.target.value as any)}
                      />
                    </div>
                  )}

                  {q.type === "simulation" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Target X"
                        value={String(q.targetX)}
                        onChange={(e) => updateQuestion(q.id, "targetX", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Gravity"
                        value={String(q.gravity ?? 9.81)}
                        onChange={(e) => updateQuestion(q.id, "gravity", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Tolerance"
                        value={String(q.tolerance ?? 0.25)}
                        onChange={(e) => updateQuestion(q.id, "tolerance", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Min velocity"
                        value={String(q.minVelocity ?? 1)}
                        onChange={(e) => updateQuestion(q.id, "minVelocity", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Max velocity"
                        value={String(q.maxVelocity ?? 50)}
                        onChange={(e) => updateQuestion(q.id, "maxVelocity", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Min angle"
                        value={String(q.minAngleDeg ?? 0)}
                        onChange={(e) => updateQuestion(q.id, "minAngleDeg", Number(e.target.value) as any)}
                      />
                      <Input
                        placeholder="Max angle"
                        value={String(q.maxAngleDeg ?? 90)}
                        onChange={(e) => updateQuestion(q.id, "maxAngleDeg", Number(e.target.value) as any)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving || !title.trim() || questions.length === 0}>Save Quiz</Button>
            {error && <span className="text-sm text-red-500">{error}</span>}
            {created && <span className="text-sm text-green-600">Saved. ID: {created.id}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


