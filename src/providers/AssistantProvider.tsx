"use client"

import React from "react"

export type AssistantMode = "explain" | "quiz" | "simplify"

export interface AssistantMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
}

interface AssistantContextValue {
  enabled: boolean
  setEnabled: (v: boolean) => void
  messages: AssistantMessage[]
  setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>
  mode: AssistantMode
  setMode: (m: AssistantMode) => void
}

const AssistantContext = React.createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    if (typeof localStorage === "undefined") return true
    const raw = localStorage.getItem("assistant_enabled")
    return raw == null ? true : raw === "1"
  })
  const [mode, setMode] = React.useState<AssistantMode>(() => {
    if (typeof localStorage === "undefined") return "explain"
    const raw = localStorage.getItem("assistant_mode") as AssistantMode | null
    return raw ?? "explain"
  })
  const [messages, setMessages] = React.useState<AssistantMessage[]>([])

  React.useEffect(() => {
    try {
      localStorage.setItem("assistant_enabled", enabled ? "1" : "0")
    } catch {}
  }, [enabled])
  React.useEffect(() => {
    try {
      localStorage.setItem("assistant_mode", mode)
    } catch {}
  }, [mode])

  const value: AssistantContextValue = React.useMemo(
    () => ({ enabled, setEnabled, messages, setMessages, mode, setMode }),
    [enabled, messages, mode]
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant() {
  const ctx = React.useContext(AssistantContext)
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider")
  return ctx
}


