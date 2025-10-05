"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useRole } from "@/providers/RoleProvider"

export default function CreateLabPage() {
  const { role } = useRole()
  const router = useRouter()
  const [title, setTitle] = React.useState("")

  React.useEffect(() => {
    if (role === "student") {
      router.replace("/labs")
    }
  }, [role, router])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Lab</CardTitle>
          <CardDescription>Stub builder for teacher-created labs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Button disabled>Save (coming soon)</Button>
            <Button variant="secondary" onClick={() => router.push("/labs")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


