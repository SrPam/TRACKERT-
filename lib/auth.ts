import { supabase } from "./supabase"
import type { User } from "./types"

// User management functions
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("ptr_users").select("*").order("username")

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data || []
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase.from("ptr_users").select("*").eq("username", username)

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}

export async function createUser(
  username: string,
  password: string,
  role: "admin" | "supervisor",
  crew?: string,
): Promise<boolean> {
  // Validate password
  if (!isPasswordValid(password)) {
    return false
  }

  // Check if username already exists
  const existingUser = await getUserByUsername(username)
  if (existingUser) {
    return false
  }

  // Create new user
  const { error } = await supabase.from("ptr_users").insert([
    {
      username,
      password, // In a real app, you'd hash this password
      role,
      crew: role === "supervisor" ? crew : null,
    },
  ])

  if (error) {
    console.error("Error creating user:", error)
    return false
  }

  return true
}

export async function deleteUser(username: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_users").delete().eq("username", username)

  if (error) {
    console.error("Error deleting user:", error)
    return false
  }

  return true
}

export async function updateUserCrew(username: string, crew: string): Promise<boolean> {
  const { error } = await supabase.from("ptr_users").update({ crew }).eq("username", username)

  if (error) {
    console.error("Error updating user crew:", error)
    return false
  }

  return true
}

// New function to update user password
export async function updateUserPassword(username: string, newPassword: string): Promise<boolean> {
  // Validate password
  if (!isPasswordValid(newPassword)) {
    return false
  }

  const { error } = await supabase.from("ptr_users").update({ password: newPassword }).eq("username", username)

  if (error) {
    console.error("Error updating user password:", error)
    return false
  }

  return true
}

// Password validation function
export function isPasswordValid(password: string): boolean {
  // Check if password is at least 8 characters long
  if (password.length < 8) {
    return false
  }

  // Check if password contains at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return false
  }

  // Check if password contains at least one number
  if (!/[0-9]/.test(password)) {
    return false
  }

  // Check if password contains at least one symbol
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false
  }

  return true
}

// Authentication functions
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("ptr_users")
    .select("*")
    .eq("username", username)
    .eq("password", password) // In a real app, you'd compare hashed passwords
    .single()

  if (error || !data) {
    console.error("Authentication error:", error)
    return null
  }

  // Store the current user in localStorage for client-side access
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: data.username,
        role: data.role,
        crew: data.crew,
      }),
    )
  }

  return data
}

export async function registerUser(
  username: string,
  password: string,
  role: "admin" | "supervisor",
  crew?: string,
): Promise<User | null> {
  const success = await createUser(username, password, role, crew)

  if (success) {
    // Auto login after registration
    return authenticateUser(username, password)
  }

  return null
}

export function getCurrentUser(): { username: string; role: "admin" | "supervisor"; crew?: string } | null {
  if (typeof window === "undefined") {
    return null
  }

  const userStr = localStorage.getItem("currentUser")
  if (!userStr) {
    return null
  }

  try {
    return JSON.parse(userStr)
  } catch (e) {
    return null
  }
}

export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}

// Initialize default admin user if no users exist
export async function initializeAuth(): Promise<void> {
  const users = await getAllUsers()

  if (users.length === 0) {
    // Create default admin with a secure password
    await createUser("admin", "Admin@123", "admin")

    // Create test users with secure passwords
    await createUser("PAM", "PAM@1234", "supervisor")
    await createUser("cry", "Cry@1234", "supervisor")
  }
}
