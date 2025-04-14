import type { Metadata } from "next"
import LoginForm from "@/components/login-form"

export const metadata: Metadata = {
  title: "Login | Production Tracker",
  description: "Log in to access the production tracking system",
}

export default function LoginPage() {
  return <LoginForm />
}
