import type { Metadata } from "next"
import UserManagement from "@/components/user-management"

export const metadata: Metadata = {
  title: "User Management | Production Tracker",
  description: "Manage users and their permissions",
}

export default function UsersPage() {
  return <UserManagement />
}
