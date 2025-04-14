export interface ProductionEntry {
  id?: string
  date: string
  crew: string
  feet: number
  type: string
  username: string
  created_at?: string
}

export interface CrewData {
  id?: string
  name: string
  color: string
  created_at?: string
}

export interface TypeData {
  id?: string
  name: string
  color: string
  created_at?: string
}

export interface User {
  id?: string
  username: string
  password?: string
  role: "admin" | "supervisor"
  crew?: string
  created_at?: string
}
