"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useRole } from "@/providers/RoleProvider";

export function Navbar(): JSX.Element {
  const { role, setRole, clearRole } = useRole();
  return (
    <div className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold">
          PhysiVerse
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className="px-3 py-1.5 text-sm">
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/labs" legacyBehavior passHref>
                <NavigationMenuLink className="px-3 py-1.5 text-sm">
                  Labs
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/quizzes" legacyBehavior passHref>
                <NavigationMenuLink className="px-3 py-1.5 text-sm">
                  Quizzes
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/about" legacyBehavior passHref>
                <NavigationMenuLink className="px-3 py-1.5 text-sm">
                  About
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Role:</span>
          <Button size="sm" variant={role === "student" ? "default" : "outline"} onClick={() => setRole("student")}>
            Student
          </Button>
          <Button size="sm" variant={role === "teacher" ? "default" : "outline"} onClick={() => setRole("teacher")}>
            Teacher
          </Button>
          {role && (
            <Button size="sm" variant="ghost" onClick={() => clearRole()}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


