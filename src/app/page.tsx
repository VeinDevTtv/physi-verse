"use client";
import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhysicsScene } from "@/three/PhysicsScene";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="flex items-center gap-3 rounded-md border p-3">
          <span className="text-sm font-medium">Physics</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="w-full max-w-5xl rounded-lg border bg-background/20 p-2">
          <PhysicsScene enabled={enabled} className="rounded-md" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
