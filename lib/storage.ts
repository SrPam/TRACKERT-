import type { ProductionEntry, CrewData, TypeData } from "./types"
import { supabase } from "./supabase"

// Production data functions
export async function getProductionData(): Promise<ProductionEntry[]> {
  const { data, error } = await supabase.from("ptr_entries").select("*").order("date", { ascending: false })

  if (error) {
    console.error("Error fetching production data:", error)
    return []
  }

  // Convert date format from database to our application format
  const formattedData = data.map((entry) => ({
    ...entry,
    date: entry.date.includes("-")
      ? entry.date.replace(/-/g, "/") // Convert YYYY-MM-DD to YYYY/MM/DD
      : entry.date, // Already in YYYY/MM/DD format
  }))

  return formattedData || []
}

export async function getProductionEntryById(id: string): Promise<ProductionEntry | null> {
  const { data, error } = await supabase.from("ptr_entries").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching production entry:", error)
    return null
  }

  // Convert date format if needed
  if (data) {
    data.date = data.date.includes("-")
      ? data.date.replace(/-/g, "/") // Convert YYYY-MM-DD to YYYY/MM/DD
      : data.date // Already in YYYY/MM/DD format
  }

  return data
}

export async function addProductionEntry(entry: ProductionEntry): Promise<boolean> {
  // Ensure the date is properly formatted for the database
  const formattedEntry = {
    ...entry,
    date: entry.date, // The date should already be in YYYY/MM/DD format
  }

  const { error } = await supabase.from("ptr_entries").insert([formattedEntry])

  if (error) {
    console.error("Error adding production entry:", error)
    return false
  }

  return true
}

export async function updateProductionEntry(id: string, updates: Partial<ProductionEntry>): Promise<boolean> {
  // If there's a date in the updates, ensure it's properly formatted
  const formattedUpdates = { ...updates }

  const { error } = await supabase.from("ptr_entries").update(formattedUpdates).eq("id", id)

  if (error) {
    console.error("Error updating production entry:", error)
    return false
  }

  return true
}

export async function removeProductionEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_entries").delete().eq("id", id)

  if (error) {
    console.error("Error removing production entry:", error)
    return false
  }

  return true
}

// Crew functions
export async function getCrews(): Promise<CrewData[]> {
  const { data, error } = await supabase.from("ptr_crews").select("*").order("name")

  if (error) {
    console.error("Error fetching crews:", error)
    return []
  }

  return data || []
}

export async function getCrewNames(): Promise<string[]> {
  const crews = await getCrews()
  return crews.map((crew) => crew.name)
}

export async function addCrew(name: string, color: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_crews").insert([{ name, color }])

  if (error) {
    console.error("Error adding crew:", error)
    return false
  }

  return true
}

export async function removeCrew(name: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_crews").delete().eq("name", name)

  if (error) {
    console.error("Error removing crew:", error)
    return false
  }

  return true
}

export async function updateCrewColor(name: string, color: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_crews").update({ color }).eq("name", name)

  if (error) {
    console.error("Error updating crew color:", error)
    return false
  }

  return true
}

// Type functions
export async function getTypes(): Promise<TypeData[]> {
  const { data, error } = await supabase.from("ptr_types").select("*").order("name")

  if (error) {
    console.error("Error fetching types:", error)
    return []
  }

  return data || []
}

export async function getTypeNames(): Promise<string[]> {
  const types = await getTypes()
  return types.map((type) => type.name)
}

export async function addType(name: string, color: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_types").insert([{ name, color }])

  if (error) {
    console.error("Error adding type:", error)
    return false
  }

  return true
}

export async function removeType(name: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_types").delete().eq("name", name)

  if (error) {
    console.error("Error removing type:", error)
    return false
  }

  return true
}

export async function updateTypeColor(name: string, color: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_types").update({ color }).eq("name", name)

  if (error) {
    console.error("Error updating type color:", error)
    return false
  }

  return true
}

// Initialize default data
export async function initializeDefaultData(): Promise<void> {
  // Check if we have any crews
  const crews = await getCrews()
  if (crews.length === 0) {
    // Add default crews
    await addCrew("AJS1", "#3B82F6") // Azul
    await addCrew("AJS2", "#EF4444") // Rojo
  }

  // Check if we have any types
  const types = await getTypes()
  if (types.length === 0) {
    // Add default types
    await addType("ROCK", "#9CA3AF") // Gris
    await addType("NO ROCK", "#10B981") // Verde
  }
}
