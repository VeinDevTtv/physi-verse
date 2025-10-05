export type MultipleChoiceQuestion = {
  id: string
  type: "mcq"
  prompt: string
  choices: string[]
  correctIndex: number
}

export type FormulaQuestion = {
  id: string
  type: "formula"
  prompt: string
  // Expected numeric answer; if provided as an expression during creation, compute the number client-side
  expectedValue: number
  tolerance?: number // absolute tolerance for correctness
  units?: string
}

export type SimulationQuestion = {
  id: string
  type: "simulation"
  prompt: string
  simulation: "projectile"
  targetX: number
  gravity?: number
  tolerance?: number
  // UI constraints for the attempt controls
  minVelocity?: number
  maxVelocity?: number
  minAngleDeg?: number
  maxAngleDeg?: number
}

export type Question = MultipleChoiceQuestion | FormulaQuestion | SimulationQuestion

export type Quiz = {
  id: string
  title: string
  description?: string
  questions: Question[]
  createdAt: string
  updatedAt: string
}

export type CreateQuizPayload = Omit<Quiz, "id" | "createdAt" | "updatedAt">


