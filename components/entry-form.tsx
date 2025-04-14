"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/date-input"
import { useToast } from "@/hooks/use-toast"
import { addProductionEntry, getTypes, getCrews } from "@/lib/storage"
import type { ProductionEntry, CrewData, TypeData } from "@/lib/types"
import { Ruler, Tag, Calendar, Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { dateToDbString } from "@/lib/utils"

export default function EntryForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [feet, setFeet] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [crew, setCrew] = useState<string>("")
  const [types, setTypes] = useState<TypeData[]>([])
  const [crews, setCrews] = useState<CrewData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Initialize data
      const user = getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const [crewData, typeData] = await Promise.all([getCrews(), getTypes()])

        setCurrentUser(user)
        setCrews(crewData)
        setTypes(typeData)
      } catch (error) {
        console.error("Error fetching entry form data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!crew || !feet || !type) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const feetValue = Number.parseInt(feet)
    if (isNaN(feetValue) || feetValue <= 0) {
      toast({
        title: "Invalid feet value",
        description: "Please enter a valid positive number for feet",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format date in a consistent way using our utility
      const formattedDate = dateToDbString(date)

      const entry: ProductionEntry = {
        date: formattedDate,
        crew: crew,
        feet: feetValue,
        type,
        username: currentUser.username,
      }

      const success = await addProductionEntry(entry)

      if (success) {
        toast({
          title: "Entry added",
          description: "Production entry has been saved successfully",
        })

        // Reset form
        setFeet("")
        setType("")
        setCrew("")
        setDate(new Date())
      } else {
        throw new Error("Failed to add entry")
      }
    } catch (error) {
      console.error("Error adding entry:", error)
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
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
            <h1 className="text-4xl font-bold mb-2">New Production Entry</h1>
            <p className="text-xl">Logged in as: {currentUser?.username}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DateInput date={date} onSelect={(d) => d && setDate(d)} label="Select date" />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              Crew
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {crews.length === 0 ? (
                <p className="text-center text-xl p-4">No crews available</p>
              ) : (
                crews.map((crewItem) => (
                  <Button
                    key={crewItem.name}
                    type="button"
                    variant={crew === crewItem.name ? "default" : "outline"}
                    className={`h-20 text-2xl ${crew === crewItem.name ? "ring-4 ring-primary" : ""}`}
                    onClick={() => setCrew(crewItem.name)}
                    style={{
                      backgroundColor: crew === crewItem.name ? crewItem.color : "",
                      borderColor: crew.color,
                      color: crew === crewItem.name ? "#ffffff" : crewItem.color,
                    }}
                  >
                    {crewItem.name}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Ruler className="h-6 w-6" />
              Feet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              id="feet"
              type="number"
              placeholder="Enter feet"
              value={feet}
              onChange={(e) => setFeet(e.target.value)}
              min="1"
              className="text-3xl h-20 text-center"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {types.length === 0 ? (
                <p className="text-center text-xl p-4">No types available</p>
              ) : (
                types.map((typeItem) => (
                  <Button
                    key={typeItem.name}
                    type="button"
                    variant={type === typeItem.name ? "default" : "outline"}
                    className={`h-20 text-2xl ${type === typeItem.name ? "ring-4 ring-primary" : ""}`}
                    onClick={() => setType(typeItem.name)}
                    style={{
                      backgroundColor: type === typeItem.name ? typeItem.color : "",
                      borderColor: typeItem.color,
                      color: type === typeItem.name ? "#ffffff" : typeItem.color,
                    }}
                  >
                    {typeItem.name}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-6 gap-3">
            <Button
              type="submit"
              size="lg"
              className="text-xl h-16 w-full"
              disabled={isSubmitting || !feet || !type || !crew}
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-xl h-16 w-full"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
