import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { CreateQuizPayload, Quiz } from "@/lib/quizTypes"

function getDataPath(): string {
  const dataDir = path.join(process.cwd(), "data")
  return path.join(dataDir, "quizzes.json")
}

async function ensureFile(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data")
  await fs.mkdir(dataDir, { recursive: true })
  const file = getDataPath()
  try {
    await fs.access(file)
  } catch {
    await fs.writeFile(file, JSON.stringify([], null, 2), "utf-8")
  }
}

export async function readAllQuizzes(): Promise<Quiz[]> {
  await ensureFile()
  const raw = await fs.readFile(getDataPath(), "utf-8")
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Quiz[]
    return []
  } catch {
    return []
  }
}

export async function writeAllQuizzes(quizzes: Quiz[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(getDataPath(), JSON.stringify(quizzes, null, 2), "utf-8")
}

export async function addQuiz(payload: CreateQuizPayload): Promise<Quiz> {
  const quizzes = await readAllQuizzes()
  const now = new Date().toISOString()
  const quiz: Quiz = {
    id: randomUUID(),
    title: payload.title,
    description: payload.description,
    questions: payload.questions,
    createdAt: now,
    updatedAt: now,
  }
  quizzes.push(quiz)
  await writeAllQuizzes(quizzes)
  return quiz
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  const quizzes = await readAllQuizzes()
  return quizzes.find((q) => q.id === id) ?? null
}

export async function updateQuiz(id: string, data: Partial<CreateQuizPayload>): Promise<Quiz | null> {
  const quizzes = await readAllQuizzes()
  const idx = quizzes.findIndex((q) => q.id === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const updated: Quiz = {
    ...quizzes[idx],
    ...data,
    updatedAt: now,
  }
  quizzes[idx] = updated
  await writeAllQuizzes(quizzes)
  return updated
}


