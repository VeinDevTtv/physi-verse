"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import AssistantChat from "@/components/AssistantChat"
import { useAssistant } from "@/providers/AssistantProvider"

export default function AssistantDialog({ children }: { children?: React.ReactNode }) {
  const { enabled, setEnabled, mode, setMode } = useAssistant()
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button size="sm" variant="outline">Assistant</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assistant</DialogTitle>
          <DialogDescription>Explain concepts, generate quiz questions, or simplify formulas.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="text-sm">
            <div className="font-medium">Enable Assistant</div>
            <div className="text-muted-foreground">Runs locally. No internet required.</div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ModeButton label="Explain concept" active={mode === "explain"} onClick={() => setMode("explain")} />
          <ModeButton label="Generate quiz question" active={mode === "quiz"} onClick={() => setMode("quiz")} />
          <ModeButton label="Simplify formula" active={mode === "simplify"} onClick={() => setMode("simplify")} />
        </div>
        {enabled ? (
          <AssistantChat />
        ) : (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            Assistant is disabled. Toggle it on to use.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}


