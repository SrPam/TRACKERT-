import type { Metadata } from "next"
import EntryForm from "@/components/entry-form"

export const metadata: Metadata = {
  title: "Production Entry | Production Tracker",
  description: "Enter new production data",
}

export default function EntryPage() {
  return <EntryForm />
}
