import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import QuizPlayer from "@/components/quiz/QuizPlayer"
import { getQuiz } from "@/lib/server/quizStore"

type Params = { params: { id: string } }

export default async function QuizPage({ params }: Params) {
  const quiz = await getQuiz(params.id)
  if (!quiz) return notFound()
  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <QuizPlayer quiz={quiz} />
        </CardContent>
      </Card>
    </div>
  )
}


