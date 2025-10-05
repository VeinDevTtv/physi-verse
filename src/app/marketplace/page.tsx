"use client"

import React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Teacher Marketplace</h1>
          <p className="text-sm opacity-70">A future hub for sharing and discovering labs, quizzes, and lesson plans.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Curated experiments and classroom-ready resources.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">We&apos;re designing a marketplace where teachers can publish interactive labs, rate resources, and remix community content. Stay tuned.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Request Features</CardTitle>
              <CardDescription>Tell us what you want to see.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Want school licensing, grading integrations, or rubric templates? Your feedback guides our roadmap.</div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}


