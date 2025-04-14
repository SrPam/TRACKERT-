"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface DateInputProps {
  date: Date | undefined
  onSelect: (date: Date | undefined) => void
  label?: string
  id?: string
}

export function DateInput({ date, onSelect, label = "Select date", id = "date-input" }: DateInputProps) {
  // Format date for input value (YYYY-MM-DD) - HTML input requires this format
  const formattedDate = date ? format(date, "yyyy-MM-dd") : ""

  // Update the handleChange function to use the approach that avoids timezone issues
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Create date using constructor with year, month, day
      // to avoid timezone issues
      const parts = e.target.value.split("-")
      const year = Number.parseInt(parts[0], 10)
      const month = Number.parseInt(parts[1], 10) - 1 // Months in JS are 0-11
      const day = Number.parseInt(parts[2], 10)
      const date = new Date(year, month, day)
      onSelect(date)
    } else {
      onSelect(undefined)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input type="date" id={id} value={formattedDate} onChange={handleChange} className="h-12 text-lg" />
    </div>
  )
}
