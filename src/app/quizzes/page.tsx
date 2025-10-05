import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readAllQuizzes } from "@/lib/server/quizStore"

export default async function QuizzesPage() {
  const quizzes = await readAllQuizzes()
  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quizzes</h2>
        <Link href="/quizzes/create" className="text-sm underline">Create quiz</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quizzes.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>{q.title}</CardTitle>
              <CardDescription>{q.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/quizzes/${q.id}`} className="text-sm underline">Open</Link>
            </CardContent>
          </Card>
        ))}
        {quizzes.length === 0 && <p className="text-sm text-muted-foreground">No quizzes yet.</p>}
      </div>
    </div>
  )
}


