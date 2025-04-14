import type { Metadata } from "next"
import AuditPanel from "@/components/audit-panel"

export const metadata: Metadata = {
  title: "Production Audit | Production Tracker",
  description: "Audit and manage production entries",
}

export default function AuditPage() {
  return <AuditPanel />
}
