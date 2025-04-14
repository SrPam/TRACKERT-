import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility functions for consistent date handling throughout the application
 */

// Format a Date object to YYYY/MM/DD string
export function dateToDbString(date: Date | undefined | null): string {
  if (!date) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}/${month}/${day}`
}

// Convert a database date string to a Date object
export function dbStringToDate(dateString: string): Date | null {
  if (!dateString) return null

  // Handle both formats for backward compatibility
  const regex = /^\d{4}[/-]\d{2}[/-]\d{2}$/
  if (!regex.test(dateString)) return null

  // Split by either / or - for compatibility
  const parts = dateString.includes("/") ? dateString.split("/") : dateString.split("-")

  const year = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10)
  const day = Number.parseInt(parts[2], 10)

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  return new Date(year, month - 1, day)
}

// Format a Date object for display (e.g., "Jan 15, 2023")
export function formatDateForDisplay(date: Date | undefined | null): string {
  if (!date) return ""

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  return date.toLocaleDateString(undefined, options)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
