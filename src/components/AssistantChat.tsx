"use client"

import React from "react"
import { useAssistant } from "@/providers/AssistantProvider"
import { runAssistant } from "@/lib/assistantEngine"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AssistantChat(): JSX.Element {
  const { messages, setMessages, mode } = useAssistant()
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  async function onSend() {
    if (!input.trim() || busy) return
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input.trim(),
      createdAt: Date.now(),
    }
    setInput("")
    setMessages((prev) => [...prev, userMsg])
    setBusy(true)
    setTimeout(() => {
      const res = runAssistant({ mode: mode, prompt: userMsg.content })
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: res.text,
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setBusy(false)
    }, 50)
  }

  return (
    <div className="flex h-[420px] w-full flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto rounded-md border bg-background/40 p-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">Ask a question to get started.</div>
        )}
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-lg border px-3 py-2 text-sm shadow-sm",
                m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <MessageContent content={m.content} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          placeholder="Type your prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSend()
          }}
        />
        <Button onClick={onSend} disabled={busy || !input.trim()}>
          {busy ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // lightweight markdown: bold (**text**), inline code `code`, lists
  const lines = content.split(/\n/)
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {lines.map((line, idx) => (
        <div key={idx} className="">
          <span dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        </div>
      ))}
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function renderInline(s: string): string {
  let out = escapeHtml(s)
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/`([^`]+)`/g, "<code class='rounded bg-black/10 px-1 py-0.5'>$1</code>")
  return out
}


