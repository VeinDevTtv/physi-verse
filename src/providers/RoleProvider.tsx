"use client"

import * as React from "react"

export type UserRole = "teacher" | "student"

type RoleContextValue = {
  role: UserRole | null
  setRole: (next: UserRole) => void
  clearRole: () => void
}

const RoleContext = React.createContext<RoleContextValue | undefined>(undefined)

const STORAGE_KEY = "physiverse.role"

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<UserRole | null>(null)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "teacher" || stored === "student") {
        setRoleState(stored)
      }
    } catch {}
  }, [])

  const setRole = React.useCallback((next: UserRole) => {
    setRoleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const clearRole = React.useCallback(() => {
    setRoleState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const value = React.useMemo<RoleContextValue>(() => ({ role, setRole, clearRole }), [role, setRole, clearRole])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextValue {
  const ctx = React.useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within RoleProvider")
  return ctx
}


