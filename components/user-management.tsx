"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getAllUsers, createUser, deleteUser, getCurrentUser, updateUserPassword, isPasswordValid } from "@/lib/auth"
import { User, Trash2, Shield, UserPlus, Key, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // For password change functionality
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in and is admin
    const checkUserAndLoadData = async () => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      if (currentUser.role !== "admin") {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      // Load users
      await loadUsers()
      setIsPageLoading(false)
    }

    checkUserAndLoadData()
  }, [router, toast])

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!username || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!isPasswordValid(password)) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 8 characters and include letters, numbers, and symbols",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const success = await createUser(username, password, username === "admin" ? "admin" : "supervisor")

      if (success) {
        toast({
          title: "User created",
          description: `User ${username} has been created successfully`,
        })
        setUsername("")
        setPassword("")
        setIsDialogOpen(false)
        await loadUsers()
      } else {
        toast({
          title: "Creation failed",
          description: "Username already exists or password doesn't meet requirements",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (username: string) => {
    const currentUser = getCurrentUser()

    if (currentUser?.username === username) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await deleteUser(username)

      if (success) {
        toast({
          title: "User deleted",
          description: `User ${username} has been deleted`,
        })
        await loadUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const openChangePasswordDialog = (username: string) => {
    setSelectedUser(username)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError(null)
    setIsChangePasswordDialogOpen(true)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setPasswordError(null)

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (!isPasswordValid(newPassword)) {
      setPasswordError("Password must be at least 8 characters and include letters, numbers, and symbols")
      setIsLoading(false)
      return
    }

    try {
      const success = await updateUserPassword(selectedUser, newPassword)

      if (success) {
        toast({
          title: "Password updated",
          description: `Password for ${selectedUser} has been updated successfully`,
        })
        setIsChangePasswordDialogOpen(false)
      } else {
        setPasswordError("Failed to update password")
      }
    } catch (error) {
      console.error("Error updating password:", error)
      setPasswordError("An error occurred while updating the password")
    } finally {
      setIsLoading(false)
    }
  }

  if (isPageLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-3xl font-bold">Loading...</h2>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="relative w-40 h-40 mb-4 md:mb-0">
            <Image src="/images/logo.png" alt="AJ'S EVOLUTION Logo" fill className="object-contain" priority />
          </div>
          <div className="text-center md:text-right">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-xl">Manage users and their permissions</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-6 gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 h-14 text-xl">
              <UserPlus className="h-6 w-6" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full w-[95%] rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add New User</DialogTitle>
              <DialogDescription className="text-lg">Create a new user account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label htmlFor="new-username" className="flex items-center gap-2 text-xl">
                    <User className="h-6 w-6" />
                    Username
                  </Label>
                  <Input
                    id="new-username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-xl h-16"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="flex items-center gap-2 text-xl">
                    <Shield className="h-6 w-6" />
                    Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xl h-16"
                  />
                  <p className="text-base text-muted-foreground">
                    Password must be at least 8 characters and include letters, numbers, and symbols.
                  </p>
                </div>
                <p className="text-base text-muted-foreground">
                  Note: Users with username "admin" will be created as administrators.
                </p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 text-xl w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="h-14 text-xl w-full">
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="max-w-full w-[95%] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Change Password</DialogTitle>
            <DialogDescription className="text-lg">
              Change password for user: <span className="font-bold">{selectedUser}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="new-password" className="flex items-center gap-2 text-xl">
                  <Key className="h-6 w-6" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xl h-16"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="flex items-center gap-2 text-xl">
                  <Key className="h-6 w-6" />
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xl h-16"
                />
              </div>
              <p className="text-base text-muted-foreground">
                Password must be at least 8 characters and include letters, numbers, and symbols.
              </p>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangePasswordDialogOpen(false)}
                className="h-14 text-xl w-full"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-14 text-xl w-full">
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Users</CardTitle>
          <CardDescription className="text-lg">Manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xl">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xl">Username</TableHead>
                    <TableHead className="text-xl">Role</TableHead>
                    <TableHead className="text-right text-xl">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell className="font-medium text-lg">{user.username}</TableCell>
                      <TableCell className="text-lg">
                        {user.role === "admin" ? "Administrator" : "Supervisor"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => openChangePasswordDialog(user.username)}
                            className="text-primary hover:text-primary/90"
                          >
                            <Key className="h-6 w-6" />
                            <span className="sr-only">Change Password</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => handleDeleteUser(user.username)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-6 w-6" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
