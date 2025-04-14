import type { Metadata } from "next"
import RegisterForm from "@/components/register-form"

export const metadata: Metadata = {
  title: "Register | Production Tracker",
  description: "Register a new account for the production tracking system",
}

export default function RegisterPage() {
  return <RegisterForm />
}
