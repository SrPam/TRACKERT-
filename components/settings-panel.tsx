"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  getCrews,
  getTypes,
  addCrew,
  addType,
  removeCrew,
  removeType,
  updateCrewColor,
  updateTypeColor,
} from "@/lib/storage"
import { Users, Tag, Plus, Trash2, Paintbrush } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { CrewData, TypeData } from "@/lib/types"

export default function SettingsPanel() {
  const { toast } = useToast()
  const router = useRouter()
  const [crews, setCrews] = useState<CrewData[]>([])
  const [types, setTypes] = useState<TypeData[]>([])
  const [newCrew, setNewCrew] = useState<string>("")
  const [newType, setNewType] = useState<string>("")
  const [newCrewColor, setNewCrewColor] = useState<string>("#3B82F6")
  const [newTypeColor, setNewTypeColor] = useState<string>("#3B82F6")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const user = getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      try {
        const [crewData, typeData] = await Promise.all([getCrews(), getTypes()])

        setCurrentUser(user)
        setCrews(crewData)
        setTypes(typeData)
      } catch (error) {
        console.error("Error fetching settings data:", error)
        toast({
          title: "Error",
          description: "Failed to load settings data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, toast])

  const handleAddCrew = async () => {
    if (!newCrew.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid crew name",
        variant: "destructive",
      })
      return
    }

    if (crews.some((crew) => crew.name === newCrew.trim())) {
      toast({
        title: "Duplicate entry",
        description: "This crew already exists",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await addCrew(newCrew.trim(), newCrewColor)

      if (success) {
        const updatedCrews = await getCrews()
        setCrews(updatedCrews)
        setNewCrew("")
        toast({
          title: "Crew added",
          description: `${newCrew.trim()} has been added successfully`,
        })
      } else {
        throw new Error("Failed to add crew")
      }
    } catch (error) {
      console.error("Error adding crew:", error)
      toast({
        title: "Error",
        description: "Failed to add crew",
        variant: "destructive",
      })
    }
  }

  const handleAddType = async () => {
    if (!newType.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid type name",
        variant: "destructive",
      })
      return
    }

    if (types.some((type) => type.name === newType.trim())) {
      toast({
        title: "Duplicate entry",
        description: "This type already exists",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await addType(newType.trim(), newTypeColor)

      if (success) {
        const updatedTypes = await getTypes()
        setTypes(updatedTypes)
        setNewType("")
        toast({
          title: "Type added",
          description: `${newType.trim()} has been added successfully`,
        })
      } else {
        throw new Error("Failed to add type")
      }
    } catch (error) {
      console.error("Error adding type:", error)
      toast({
        title: "Error",
        description: "Failed to add type",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCrew = async (crewName: string) => {
    try {
      const success = await removeCrew(crewName)

      if (success) {
        const updatedCrews = await getCrews()
        setCrews(updatedCrews)
        toast({
          title: "Crew removed",
          description: `${crewName} has been removed successfully`,
        })
      } else {
        throw new Error("Failed to remove crew")
      }
    } catch (error) {
      console.error("Error removing crew:", error)
      toast({
        title: "Error",
        description: "Failed to remove crew",
        variant: "destructive",
      })
    }
  }

  const handleRemoveType = async (typeName: string) => {
    try {
      const success = await removeType(typeName)

      if (success) {
        const updatedTypes = await getTypes()
        setTypes(updatedTypes)
        toast({
          title: "Type removed",
          description: `${typeName} has been removed successfully`,
        })
      } else {
        throw new Error("Failed to remove type")
      }
    } catch (error) {
      console.error("Error removing type:", error)
      toast({
        title: "Error",
        description: "Failed to remove type",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCrewColor = async (crewName: string, color: string) => {
    try {
      const success = await updateCrewColor(crewName, color)

      if (success) {
        const updatedCrews = await getCrews()
        setCrews(updatedCrews)
      } else {
        throw new Error("Failed to update crew color")
      }
    } catch (error) {
      console.error("Error updating crew color:", error)
      toast({
        title: "Error",
        description: "Failed to update crew color",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTypeColor = async (typeName: string, color: string) => {
    try {
      const success = await updateTypeColor(typeName, color)

      if (success) {
        const updatedTypes = await getTypes()
        setTypes(updatedTypes)
      } else {
        throw new Error("Failed to update type color")
      }
    } catch (error) {
      console.error("Error updating type color:", error)
      toast({
        title: "Error",
        description: "Failed to update type color",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-3xl font-bold">Loading...</h2>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="relative w-40 h-40 mb-4 md:mb-0">
            <Image src="/images/logo.png" alt="AJ'S EVOLUTION Logo" fill className="object-contain" priority />
          </div>
          <div className="text-center md:text-right">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-xl">Configure crews and production types</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="crews">
        <TabsList className="mb-6 w-full grid grid-cols-2">
          <TabsTrigger value="crews" className="flex items-center gap-1 text-base sm:text-lg py-3">
            <Users className="h-5 w-5" />
            <span className="hidden xs:inline">Crews</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-1 text-base sm:text-lg py-3">
            <Tag className="h-5 w-5" />
            <span className="hidden xs:inline">Types</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crews">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Manage Crews</CardTitle>
              <CardDescription className="text-base">Add or remove crews from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter crew name"
                      value={newCrew}
                      onChange={(e) => setNewCrew(e.target.value)}
                      className="text-lg h-14 flex-1"
                    />
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Paintbrush className="h-5 w-5 text-muted-foreground" />
                      <Input
                        type="color"
                        value={newCrewColor}
                        onChange={(e) => setNewCrewColor(e.target.value)}
                        className="h-10 w-20 p-1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddCrew} className="h-14 text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Crew
                  </Button>
                </div>

                <div className="border rounded-md">
                  {crews.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-lg">No crews added yet</div>
                  ) : (
                    <ul className="divide-y">
                      {crews.map((crew) => (
                        <li key={crew.name} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: crew.color }} />
                            <span className="text-lg">{crew.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={crew.color}
                              onChange={(e) => handleUpdateCrewColor(crew.name, e.target.value)}
                              className="h-8 w-16 p-1"
                            />
                            <Button variant="ghost" size="lg" onClick={() => handleRemoveCrew(crew.name)}>
                              <Trash2 className="h-6 w-6 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Manage Types</CardTitle>
              <CardDescription className="text-base">Add or remove production types from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter type name"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="text-lg h-14 flex-1"
                    />
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Paintbrush className="h-5 w-5 text-muted-foreground" />
                      <Input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="h-10 w-20 p-1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddType} className="h-14 text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Type
                  </Button>
                </div>

                <div className="border rounded-md">
                  {types.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-lg">No types added yet</div>
                  ) : (
                    <ul className="divide-y">
                      {types.map((type) => (
                        <li key={type.name} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: type.color }} />
                            <span className="text-lg">{type.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={type.color}
                              onChange={(e) => handleUpdateTypeColor(type.name, e.target.value)}
                              className="h-8 w-16 p-1"
                            />
                            <Button variant="ghost" size="lg" onClick={() => handleRemoveType(type.name)}>
                              <Trash2 className="h-6 w-6 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
