import type { Metadata } from "next"
import SettingsPanel from "@/components/settings-panel"

export const metadata: Metadata = {
  title: "Settings | Production Tracker",
  description: "Configure employees, crews, and production types",
}

export default function SettingsPage() {
  return <SettingsPanel />
}
