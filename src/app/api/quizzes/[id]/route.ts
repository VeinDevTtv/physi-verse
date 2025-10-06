import { NextRequest, NextResponse } from "next/server"
import { getQuiz, updateQuiz } from "@/lib/server/quizStore"
import { CreateQuizPayload } from "@/lib/quizTypes"

type RouteParams = Promise<{ id: string }>

export async function GET(_req: NextRequest, ctx: { params: RouteParams }) {
  const { id } = await ctx.params
  const quiz = await getQuiz(id)
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(quiz)
}

export async function PUT(req: NextRequest, ctx: { params: RouteParams }) {
  try {
    const { id } = await ctx.params
    const body = (await req.json()) as Partial<CreateQuizPayload>
    const updated = await updateQuiz(id, body)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}


