"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Settings, PlusCircle, Menu, X, Home, Users, LogOut, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { ThemeSwitcher } from "./theme-switcher"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; crew?: string } | null>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [pathname])

  // Cerrar el sidebar cuando se cambia de ruta en dispositivos móviles
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logoutUser()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  // Si no hay usuario logueado, no renderizar el sidebar
  if (!currentUser) {
    return null
  }

  return (
    <>
      {/* Botón para abrir/cerrar el sidebar en móviles */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-12 w-12"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
      </Button>

      {/* Overlay para cerrar el sidebar al hacer clic fuera (solo en móviles) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:w-64 md:relative md:z-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 text-sm">
            <div>
              Logged in as: <span className="font-medium">{currentUser.username}</span>
            </div>
            {currentUser.crew && (
              <div>
                Crew: <span className="font-medium">{currentUser.crew}</span>
              </div>
            )}
          </div>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Button variant={pathname === "/" ? "default" : "ghost"} className="w-full justify-start h-10 text-sm">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href="/entry" onClick={() => setIsOpen(false)}>
              <Button
                variant={pathname === "/entry" ? "default" : "ghost"}
                className="w-full justify-start h-10 text-sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </Link>

            {currentUser.role === "admin" && (
              <>
                <Link href="/audit" onClick={() => setIsOpen(false)}>
                  <Button
                    variant={pathname === "/audit" ? "default" : "ghost"}
                    className="w-full justify-start h-10 text-sm"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Audit Production
                  </Button>
                </Link>

                <Link href="/settings" onClick={() => setIsOpen(false)}>
                  <Button
                    variant={pathname === "/settings" ? "default" : "ghost"}
                    className="w-full justify-start h-10 text-sm"
                  >
                    <Settings className="mr-2 w-4 h-4" />
                    Settings
                  </Button>
                </Link>

                <Link href="/users" onClick={() => setIsOpen(false)}>
                  <Button
                    variant={pathname === "/users" ? "default" : "ghost"}
                    className="w-full justify-start h-10 text-sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="p-2 border-t space-y-1">
            <div className="flex items-center justify-between p-2">
              <ThemeSwitcher />
              <Button variant="outline" size="sm" className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
