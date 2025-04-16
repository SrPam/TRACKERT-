"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateInput } from "@/components/date-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { getProductionData, getCrews, getTypes, removeProductionEntry, updateProductionEntry } from "@/lib/storage"
import type { ProductionEntry, CrewData, TypeData } from "@/lib/types"
import { Pencil, Trash2, Search, Filter, AlertCircle, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { dateToDbString, dbStringToDate, formatDateForDisplay } from "@/lib/utils"
import { subDays } from "date-fns"

export default function AuditPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<ProductionEntry[]>([])
  const [crews, setCrews] = useState<CrewData[]>([])
  const [types, setTypes] = useState<TypeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCrew, setFilterCrew] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined)
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [thirtyDaysAgo, setThirtyDaysAgo] = useState<Date>(subDays(new Date(), 30))

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ProductionEntry | null>(null)
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [editCrew, setEditCrew] = useState<string>("")
  const [editType, setEditType] = useState<string>("")
  const [editFeet, setEditFeet] = useState<string>("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      try {
        const [productionData, crewData, typeData] = await Promise.all([getProductionData(), getCrews(), getTypes()])

        // Si no es admin, filtrar solo los registros creados por el usuario actual
        const filteredByPermission =
          currentUser.role === "admin"
            ? productionData
            : productionData.filter((entry) => entry.username === currentUser.username)

        setEntries(filteredByPermission)
        setFilteredEntries(filteredByPermission)
        setCrews(crewData)
        setTypes(typeData)
        setCurrentUser(currentUser)
        setThirtyDaysAgo(subDays(new Date(), 30))
      } catch (error) {
        console.error("Error loading audit data:", error)
        toast({
          title: "Error",
          description: "Failed to load production data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndLoadData()
  }, [router, toast])

  useEffect(() => {
    // Apply filters and search
    let filtered = [...entries]

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.username.toLowerCase().includes(term) ||
          entry.crew.toLowerCase().includes(term) ||
          entry.type.toLowerCase().includes(term),
      )
    }

    // Apply crew filter
    if (filterCrew !== "all") {
      filtered = filtered.filter((entry) => entry.crew === filterCrew)
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((entry) => entry.type === filterType)
    }

    // Apply date range filter
    if (filterDateFrom) {
      const fromDateStr = dateToDbString(filterDateFrom)

      filtered = filtered.filter((entry) => {
        return entry.date >= fromDateStr
      })
    }

    if (filterDateTo) {
      const toDateStr = dateToDbString(filterDateTo)

      filtered = filtered.filter((entry) => {
        return entry.date <= toDateStr
      })
    }

    setFilteredEntries(filtered)
  }, [entries, searchTerm, filterCrew, filterType, filterDateFrom, filterDateTo])

  // Función para verificar si un usuario puede editar/eliminar un registro
  const canEditEntry = (entry: ProductionEntry): boolean => {
    // Administradores pueden editar cualquier registro
    if (currentUser?.role === "admin") return true

    // Usuarios no administradores solo pueden editar sus propios registros
    if (entry.username !== currentUser?.username) return false

    // Y solo si están dentro de los últimos 30 días
    const entryDate = dbStringToDate(entry.date)
    if (!entryDate) return false

    return entryDate >= thirtyDaysAgo
  }

  const handleEdit = (entry: ProductionEntry) => {
    setEditEntry(entry)
    try {
      setEditDate(dbStringToDate(entry.date))
    } catch (e) {
      setEditDate(new Date())
    }
    setEditCrew(entry.crew)
    setEditType(entry.type)
    setEditFeet(entry.feet.toString())
    setEditError(null)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editEntry) return

    setIsSaving(true)
    setEditError(null)

    if (!editDate || !editCrew || !editType || !editFeet) {
      setEditError("All fields are required")
      setIsSaving(false)
      return
    }

    const feetValue = Number.parseInt(editFeet)
    if (isNaN(feetValue) || feetValue <= 0) {
      setEditError("Feet must be a positive number")
      setIsSaving(false)
      return
    }

    try {
      // Format date in a consistent way using our utility
      const formattedDate = dateToDbString(editDate)

      const updates: Partial<ProductionEntry> = {
        date: formattedDate,
        crew: editCrew,
        type: editType,
        feet: feetValue,
      }

      const success = await updateProductionEntry(editEntry.id!, updates)

      if (success) {
        toast({
          title: "Entry updated",
          description: "Production entry has been updated successfully",
        })

        // Refresh the entries list
        const updatedEntries = await getProductionData()

        // Filtrar según permisos del usuario
        const filteredByPermission =
          currentUser.role === "admin"
            ? updatedEntries
            : updatedEntries.filter((entry) => entry.username === currentUser.username)

        setEntries(filteredByPermission)
        setIsEditDialogOpen(false)
      } else {
        setEditError("Failed to update entry")
      }
    } catch (error) {
      console.error("Error updating entry:", error)
      setEditError("An error occurred while updating the entry")
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    setEntryToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!entryToDelete) return

    setIsDeleting(true)

    try {
      const success = await removeProductionEntry(entryToDelete)

      if (success) {
        toast({
          title: "Entry deleted",
          description: "Production entry has been deleted successfully",
        })

        // Refresh the entries list
        const updatedEntries = await getProductionData()

        // Filtrar según permisos del usuario
        const filteredByPermission =
          currentUser.role === "admin"
            ? updatedEntries
            : updatedEntries.filter((entry) => entry.username === currentUser.username)

        setEntries(filteredByPermission)
        setIsDeleteDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the entry",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFilterCrew("all")
    setFilterType("all")
    setFilterDateFrom(undefined)
    setFilterDateTo(undefined)
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
            <h1 className="text-4xl font-bold mb-2">Production Audit</h1>
            {currentUser?.role === "admin" ? (
              <p className="text-xl">Review, edit, and manage all production entries</p>
            ) : (
              <p className="text-xl">Review and manage your production entries</p>
            )}
          </div>
        </div>
      </div>

      {currentUser?.role !== "admin" && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can edit or delete your entries that are less than 30 days old. Older entries cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by username, crew, or type"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="crew-filter" className="mb-2 block">
                Crew
              </Label>
              <Select value={filterCrew} onValueChange={setFilterCrew}>
                <SelectTrigger id="crew-filter" className="h-12">
                  <SelectValue placeholder="All Crews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crews</SelectItem>
                  {crews.map((crew) => (
                    <SelectItem key={crew.name} value={crew.name}>
                      {crew.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="type-filter" className="mb-2 block">
                Type
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="type-filter" className="h-12">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <DateInput date={filterDateFrom} onSelect={setFilterDateFrom} label="Date From" id="filter-date-from" />
            </div>
            <div className="flex-1">
              <DateInput date={filterDateTo} onSelect={setFilterDateTo} label="Date To" id="filter-date-to" />
            </div>
            <div className="flex-1 flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full h-12">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-full w-[95%] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Production Entry</DialogTitle>
            <DialogDescription className="text-lg">Update the details of this production entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <DateInput date={editDate} onSelect={setEditDate} label="Date" id="edit-date" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-crew" className="text-lg">
                Crew
              </Label>
              <Select value={editCrew} onValueChange={setEditCrew}>
                <SelectTrigger id="edit-crew" className="h-12 text-lg">
                  <SelectValue placeholder="Select crew" />
                </SelectTrigger>
                <SelectContent>
                  {crews.map((crew) => (
                    <SelectItem key={crew.name} value={crew.name}>
                      {crew.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-type" className="text-lg">
                Type
              </Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger id="edit-type" className="h-12 text-lg">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-feet" className="text-lg">
                Feet
              </Label>
              <Input
                id="edit-feet"
                type="number"
                value={editFeet}
                onChange={(e) => setEditFeet(e.target.value)}
                className="h-12 text-lg"
                min="1"
              />
            </div>
            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="h-14 text-lg w-full"
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={isSaving} className="h-14 text-lg w-full">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-full w-[95%] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Are you sure you want to delete this production entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-14 text-lg w-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-14 text-lg w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Production Entries</CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} of {entries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-lg">No entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg">Date</TableHead>
                    <TableHead className="text-lg">User</TableHead>
                    <TableHead className="text-lg">Crew</TableHead>
                    <TableHead className="text-lg">Type</TableHead>
                    <TableHead className="text-lg">Feet</TableHead>
                    <TableHead className="text-right text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-base">{formatDateForDisplay(dbStringToDate(entry.date))}</TableCell>
                      <TableCell className="text-base">{entry.username}</TableCell>
                      <TableCell className="text-base">{entry.crew}</TableCell>
                      <TableCell className="text-base">{entry.type}</TableCell>
                      <TableCell className="text-base">{entry.feet.toLocaleString()} ft</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEditEntry(entry) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                                className="text-primary hover:text-primary/90"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmDelete(entry.id!)}
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </>
                          )}
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
