"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/providers/ThemeProvider"

export default function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <Button size="icon" variant="ghost" aria-label="Toggle theme" onClick={toggleTheme}>
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}


