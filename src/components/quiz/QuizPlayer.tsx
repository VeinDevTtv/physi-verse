"use client"

import * as React from "react"
import { Quiz, Question } from "@/lib/quizTypes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProjectileTask from "@/components/quiz/SimulationProjectileTask"

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = React.useState<Record<string, any>>({})
  const [feedback, setFeedback] = React.useState<Record<string, string>>({})

  function setAnswer(id: string, val: any) {
    setAnswers((a) => ({ ...a, [id]: val }))
  }

  function checkQuestion(q: Question): boolean {
    if (q.type === "mcq") {
      const idx = Number(answers[q.id])
      return idx === q.correctIndex
    }
    if (q.type === "formula") {
      const val = Number(answers[q.id])
      const tol = q.tolerance ?? 0
      return Math.abs(val - q.expectedValue) <= tol
    }
    if (q.type === "simulation") {
      const res = answers[q.id] as { landedX: number } | undefined
      if (!res) return false
      const tol = q.tolerance ?? 0.25
      return Math.abs(res.landedX - q.targetX) <= tol
    }
    return false
  }

  function submitQuestion(q: Question) {
    const ok = checkQuestion(q)
    setFeedback((f) => ({ ...f, [q.id]: ok ? "Correct" : "Try again" }))
  }

  return (
    <div className="space-y-4">
      {quiz.questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-sm">Q{i + 1}. {q.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.type === "mcq" && (
              <div className="space-y-2">
                {q.choices.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={Number(answers[q.id]) === idx}
                      onChange={() => setAnswer(q.id, idx)}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === "formula" && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Enter value${(q as any).units ? ` (${(q as any).units})` : ""}`}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              </div>
            )}
            {q.type === "simulation" && (
              <ProjectileTask
                config={q}
                onResult={(landedX) => setAnswer(q.id, { landedX })}
              />
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => submitQuestion(q)}>Check</Button>
              {feedback[q.id] && (
                <span className={feedback[q.id] === "Correct" ? "text-green-600" : "text-amber-600"}>
                  {feedback[q.id]}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


