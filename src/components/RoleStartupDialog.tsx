"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRole } from "@/providers/RoleProvider"

export default function RoleStartupDialog(): JSX.Element | null {
  const { role, setRole } = useRole()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!role) setOpen(true)
  }, [role])

  if (role) return null

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Select your role</DialogTitle>
          <DialogDescription>
            Choose how you want to use PhysiVerse. You can switch later from the navbar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={() => setRole("student")}>Student</Button>
          <Button size="lg" variant="secondary" onClick={() => setRole("teacher")}>Teacher</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


