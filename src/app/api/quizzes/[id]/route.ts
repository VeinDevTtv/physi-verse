import { NextRequest, NextResponse } from "next/server"
import { getQuiz, updateQuiz } from "@/lib/server/quizStore"
import { CreateQuizPayload } from "@/lib/quizTypes"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const quiz = await getQuiz(params.id)
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(quiz)
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = (await req.json()) as Partial<CreateQuizPayload>
    const updated = await updateQuiz(params.id, body)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}


