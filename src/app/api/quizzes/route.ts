import { NextRequest, NextResponse } from "next/server"
import { addQuiz, readAllQuizzes } from "@/lib/server/quizStore"
import { CreateQuizPayload } from "@/lib/quizTypes"

export async function GET() {
  const quizzes = await readAllQuizzes()
  return NextResponse.json(quizzes)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateQuizPayload
    if (!body || !body.title || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const created = await addQuiz(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}


