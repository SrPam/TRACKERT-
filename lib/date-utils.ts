/**
 * Utility functions for consistent date handling throughout the application
 */

// Create a date from year, month, day components (month is 1-12 here for natural usage)
export function createDate(year: number, month: number, day: number): Date {
  // Month in JS Date is 0-11, so we subtract 1
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

// Parse a date string in YYYY-MM-DD format to a Date object
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null

  // Validate format
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return null

  const parts = dateString.split("-")
  const year = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10)
  const day = Number.parseInt(parts[2], 10)

  // Validate parts
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  // Create date at noon to avoid timezone issues
  return createDate(year, month, day)
}

// Format a Date object to YYYY-MM-DD string
export function formatDateToString(date: Date | undefined | null): string {
  if (!date) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
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

// Convert a database date string to a Date object
export function dbStringToDate(dateString: string): Date | null {
  return parseDate(dateString)
}

// Convert a Date object to a database date string
export function dateToDbString(date: Date | undefined | null): string {
  return formatDateToString(date)
}
