import type { Metadata } from "next"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "Dashboard | Production Tracker",
  description: "View production statistics and metrics",
}

export default function Home() {
  return <Dashboard />
}
