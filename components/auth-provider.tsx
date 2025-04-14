"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, initializeAuth } from "@/lib/auth"
import { initializeDefaultData } from "@/lib/storage"

// Pages that don't require authentication
const publicPages = ["/login", "/register"]

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize authentication system and default data
    const initialize = async () => {
      try {
        await initializeAuth()
        await initializeDefaultData()
      } catch (error) {
        console.error("Initialization error:", error)
      } finally {
        setIsInitialized(true)
      }
    }

    initialize()
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    // Check if user is logged in
    const user = getCurrentUser()

    // If not logged in and not on a public page, redirect to login
    if (!user && !publicPages.includes(pathname)) {
      router.push("/login")
    }

    // If logged in and on a public page, redirect to dashboard
    if (user && publicPages.includes(pathname)) {
      router.push("/")
    }
  }, [pathname, router, isInitialized])

  return <>{children}</>
}
