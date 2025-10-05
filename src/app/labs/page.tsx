"use client"

import React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PendulumLab from "@/components/labs/PendulumLab"
import InclinedPlaneLab from "@/components/labs/InclinedPlaneLab"
import OpticsLab from "@/components/labs/OpticsLab"

export default function LabsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Labs</h1>
          <p className="text-sm opacity-70">Explore pre-built physics and optics experiments.</p>
        </div>
        <Tabs defaultValue="pendulum" className="w-full">
          <TabsList>
            <TabsTrigger value="pendulum">Pendulum</TabsTrigger>
            <TabsTrigger value="incline">Inclined Plane</TabsTrigger>
            <TabsTrigger value="optics">Optics</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="pendulum">
              <PendulumLab />
            </TabsContent>
            <TabsContent value="incline">
              <InclinedPlaneLab />
            </TabsContent>
            <TabsContent value="optics">
              <OpticsLab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}


