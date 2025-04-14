"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import FileSaver from "file-saver"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateInput } from "@/components/date-input"
import { BarChart, PieChart, LineChart } from "@/components/charts"
import { StackedBarChart } from "@/components/stacked-bar-chart"
import { ProductionDistributionChart } from "@/components/production-distribution-chart"
import { ProductionHeatmap } from "@/components/production-heatmap"
import { CrewComparisonChart } from "@/components/crew-comparison-chart"
import { getProductionData, getCrews, getTypes } from "@/lib/storage"
import type { ProductionEntry, CrewData, TypeData } from "@/lib/types"
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  startOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns"
import {
  Briefcase,
  Ruler,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Download,
  TrendingUp,
  MapIcon as HeatMap,
  Tag,
  FileText,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { dateToDbString, dbStringToDate, formatDateForDisplay } from "@/lib/utils"

export default function Dashboard() {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [productionData, setProductionData] = useState<ProductionEntry[]>([])
  const [filteredData, setFilteredData] = useState<ProductionEntry[]>([])
  const [crews, setCrews] = useState<CrewData[]>([])
  const [types, setTypes] = useState<TypeData[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<"day" | "yesterday" | "week" | "month" | "quarter" | "custom">("month")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [productionEntries, crewData, typeData] = await Promise.all([getProductionData(), getCrews(), getTypes()])

        setProductionData(productionEntries)
        setCrews(crewData)
        setTypes(typeData)
        setCurrentUser(getCurrentUser())
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Set date range based on timeFrame
    const now = new Date()

    switch (timeFrame) {
      case "day":
        setStartDate(startOfDay(now))
        setEndDate(endOfDay(now))
        break
      case "yesterday":
        const yesterday = subDays(now, 1)
        setStartDate(startOfDay(yesterday))
        setEndDate(endOfDay(yesterday))
        break
      case "week":
        setStartDate(subDays(now, 7))
        setEndDate(now)
        break
      case "month":
        setStartDate(startOfMonth(now))
        setEndDate(endOfMonth(now))
        break
      case "quarter":
        setStartDate(subDays(now, 90))
        setEndDate(now)
        break
      // For "custom", don't change the dates
    }
  }, [timeFrame])

  useEffect(() => {
    let filtered = productionData

    // Use our date utilities for consistent date handling
    const startDateStr = dateToDbString(startDate)
    const endDateStr = dateToDbString(endDate)

    filtered = filtered.filter((entry) => {
      // Compare dates as strings in YYYY/MM/DD format for consistency
      return entry.date >= startDateStr && entry.date <= endDateStr
    })

    if (selectedCrew !== "all") {
      filtered = filtered.filter((entry) => entry.crew === selectedCrew)
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((entry) => entry.type === selectedType)
    }

    setFilteredData(filtered)
  }, [productionData, startDate, endDate, selectedCrew, selectedType])

  // Calculate metrics
  const totalFeet = filteredData.reduce((sum, entry) => sum + entry.feet, 0)
  const totalEntries = filteredData.length
  const averageFeet = totalEntries > 0 ? Math.round(totalFeet / totalEntries) : 0

  // Daily average
  const dayCount = Math.max(1, differenceInDays(endDate, startDate) + 1)
  const dailyAverage = Math.round(totalFeet / dayCount)

  // Crew data
  const crewData = crews
    .map((crew) => {
      const crewEntries = filteredData.filter((entry) => entry.crew === crew.name)
      return {
        name: crew.name,
        value: crewEntries.reduce((sum, entry) => sum + entry.feet, 0),
      }
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  // Type data
  const typeData = types
    .map((type) => {
      const typeEntries = filteredData.filter((entry) => entry.type === type.name)
      return {
        name: type.name,
        value: typeEntries.reduce((sum, entry) => sum + entry.feet, 0),
      }
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  // Daily production data for line chart
  const dailyData = useMemo(() => {
    const days = differenceInDays(endDate, startDate) + 1
    const daysToShow = Math.min(days, 30) // Limit to 30 days for readability

    return Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(endDate, i)
      const dateString = dateToDbString(date)

      const entries = filteredData.filter((entry) => {
        return entry.date === dateString
      })

      return {
        name: format(date, "MMM dd"),
        value: entries.reduce((sum, entry) => sum + entry.feet, 0),
      }
    }).reverse()
  }, [filteredData, startDate, endDate])

  // User data
  const userData = Array.from(new Set(filteredData.map((entry) => entry.username)))
    .map((username) => {
      const userEntries = filteredData.filter((entry) => entry.username === username)
      return {
        name: username,
        value: userEntries.reduce((sum, entry) => sum + entry.feet, 0),
      }
    })
    .sort((a, b) => b.value - a.value)

  // Combined crew and type data for cross-reference chart
  const crewTypeData = useMemo(() => {
    const result: { crew: string; type: string; value: number }[] = []

    crews.forEach((crew) => {
      types.forEach((type) => {
        const entries = filteredData.filter((entry) => entry.crew === crew.name && entry.type === type.name)
        const value = entries.reduce((sum, entry) => sum + entry.feet, 0)

        if (value > 0) {
          result.push({
            crew: crew.name,
            type: type.name,
            value,
          })
        }
      })
    })

    return result.sort((a, b) => b.value - a.value)
  }, [filteredData, crews, types])

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const weeks: Record<string, number> = {}

    filteredData.forEach((entry) => {
      try {
        const date = dbStringToDate(entry.date)
        if (date) {
          const weekStart = startOfWeek(date)
          const weekKey = dateToDbString(weekStart)

          if (!weeks[weekKey]) {
            weeks[weekKey] = 0
          }

          weeks[weekKey] += entry.feet
        }
      } catch (e) {
        // Skip entries with invalid dates
      }
    })

    return Object.entries(weeks)
      .map(([weekStart, value]) => ({
        name: formatDateForDisplay(dbStringToDate(weekStart)),
        value,
      }))
      .sort((a, b) => {
        const dateA = dbStringToDate(a.name)
        const dateB = dbStringToDate(b.name)
        if (!dateA || !dateB) return 0
        return dateA.getTime() - dateB.getTime()
      })
  }, [filteredData])

  // Print-friendly version for PDF alternative
  const printReport = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Generate HTML content for the report
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Production Data Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin: 20px 0; }
          .summary div { margin: 5px 0; }
          .logo { text-align: center; margin-bottom: 20px; }
          .logo img { max-width: 200px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <button onclick="window.print();" style="padding: 10px; background: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">Print Report</button>
        
        <div class="logo">
          <img src="/images/logo.png" alt="AJ'S EVOLUTION Logo">
        </div>
        
        <h1>Production Data Report</h1>
        <div class="summary">
          <div><strong>Date Range:</strong> ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}</div>
          <div><strong>Total Production:</strong> ${totalFeet.toLocaleString()} ft</div>
          <div><strong>Entries:</strong> ${totalEntries}</div>
          <div><strong>Average per Entry:</strong> ${averageFeet} ft</div>
          <div><strong>Daily Average:</strong> ${dailyAverage} ft</div>
        </div>
        
        <h2>Detailed Production Entries</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Crew</th>
              <th>Type</th>
              <th>Feet</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
              .sort((a, b) => {
                // Sort by date in descending order
                return a.date < b.date ? 1 : -1
              })
              .map(
                (entry) => `
              <tr>
                <td>${formatDateForDisplay(dbStringToDate(entry.date))}</td>
                <td>${entry.username}</td>
                <td>${entry.crew}</td>
                <td>${entry.type}</td>
                <td>${entry.feet.toLocaleString()} ft</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    // Write the content to the new window and trigger print
    printWindow.document.open()
    printWindow.document.write(reportContent)
    printWindow.document.close()
  }

  // Export to CSV function
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Date", "User", "Crew", "Type", "Feet"]
    const csvRows = [
      headers.join(","),
      ...filteredData
        .sort((a, b) => {
          // Sort by date in descending order
          return a.date < b.date ? 1 : -1
        })
        .map((entry) => {
          return [entry.date, entry.username, entry.crew, entry.type, entry.feet].join(",")
        }),
    ]

    const csvContent = csvRows.join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    FileSaver.saveAs(blob, "production-data.csv")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading dashboard data...</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {currentUser?.username && (
        <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="relative w-40 h-40 mb-4 md:mb-0">
              <Image src="/images/logo.png" alt="AJ'S EVOLUTION Logo" fill className="object-contain" priority />
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-4xl font-bold mb-2">Production Dashboard</h1>
              <p className="text-xl">Logged in as: {currentUser.username}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Production Metrics</h1>
          <p className="text-muted-foreground text-lg">Track and analyze production data</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium">Time Frame</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                <Button
                  variant={timeFrame === "day" ? "default" : "outline"}
                  onClick={() => setTimeFrame("day")}
                  className="h-14 text-lg"
                >
                  Today
                </Button>
                <Button
                  variant={timeFrame === "yesterday" ? "default" : "outline"}
                  onClick={() => setTimeFrame("yesterday")}
                  className="h-14 text-lg"
                >
                  Yesterday
                </Button>
                <Button
                  variant={timeFrame === "week" ? "default" : "outline"}
                  onClick={() => setTimeFrame("week")}
                  className="h-14 text-lg"
                >
                  Last Week
                </Button>
                <Button
                  variant={timeFrame === "month" ? "default" : "outline"}
                  onClick={() => setTimeFrame("month")}
                  className="h-14 text-lg"
                >
                  This Month
                </Button>
                <Button
                  variant={timeFrame === "quarter" ? "default" : "outline"}
                  onClick={() => setTimeFrame("quarter")}
                  className="h-14 text-lg"
                >
                  Last 90 Days
                </Button>
                <Button
                  variant={timeFrame === "custom" ? "default" : "outline"}
                  onClick={() => setTimeFrame("custom")}
                  className="h-14 text-lg"
                >
                  Custom Range
                </Button>
              </div>
            </div>
          </div>

          {timeFrame === "custom" && (
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-lg font-medium">Custom Date Range</label>
                <div className="flex flex-col gap-2">
                  <DateInput
                    date={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    label="Start Date"
                    id="start-date"
                  />
                  <DateInput date={endDate} onSelect={(d) => d && setEndDate(d)} label="End Date" id="end-date" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Total Production</CardTitle>
            <Ruler className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalFeet.toLocaleString()} ft</div>
            <p className="text-lg text-muted-foreground">
              {totalEntries} entries, {averageFeet} ft avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Daily Average</CardTitle>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dailyAverage.toLocaleString()} ft</div>
            <p className="text-lg text-muted-foreground">Over {dayCount} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Active Crews</CardTitle>
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{new Set(filteredData.map((entry) => entry.crew)).size}</div>
            <p className="text-lg text-muted-foreground">Out of {crews.length} total crews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Production Types</CardTitle>
            <Tag className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{new Set(filteredData.map((entry) => entry.type)).size}</div>
            <p className="text-lg text-muted-foreground">Out of {types.length} total types</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">Filter by Crew</label>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant={selectedCrew === "all" ? "default" : "outline"}
              onClick={() => setSelectedCrew("all")}
              className="h-14 text-lg"
            >
              All Crews
            </Button>
            {crews.map((crew) => (
              <Button
                key={crew.name}
                variant={selectedCrew === crew.name ? "default" : "outline"}
                onClick={() => setSelectedCrew(crew.name)}
                className="h-14 text-lg"
                style={{
                  backgroundColor: selectedCrew === crew.name ? crew.color : "",
                  borderColor: crew.color,
                  color: selectedCrew === crew.name ? "#ffffff" : crew.color,
                }}
              >
                {crew.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">Filter by Type</label>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              onClick={() => setSelectedType("all")}
              className="h-14 text-lg"
            >
              All Types
            </Button>
            {types.map((type) => (
              <Button
                key={type.name}
                variant={selectedType === type.name ? "default" : "outline"}
                onClick={() => setSelectedType(type.name)}
                className="h-14 text-lg"
                style={{
                  backgroundColor: selectedType === type.name ? type.color : "",
                  borderColor: type.color,
                  color: selectedType === type.name ? "#ffffff" : type.color,
                }}
              >
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Production Analysis</h2>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-lg py-3">
              <BarChart3 className="h-5 w-5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-1 text-lg py-3">
              <PieChartIcon className="h-5 w-5" />
              <span>Charts</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1 text-lg py-3">
              <HeatMap className="h-5 w-5" />
              <span>Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1 text-lg py-3">
              <LineChartIcon className="h-5 w-5" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser?.role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Top Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.length > 0 ? (
                    <div className="space-y-4">
                      {userData.slice(0, 5).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={index === 0 ? "default" : "outline"}
                              className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-lg"
                            >
                              {index + 1}
                            </Badge>
                            <span className="text-lg">{item.name}</span>
                          </div>
                          <span className="font-medium text-lg">{item.value.toLocaleString()} ft</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-lg">No data available</div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Top Crews</CardTitle>
              </CardHeader>
              <CardContent>
                {crewData.length > 0 ? (
                  <div className="space-y-4">
                    {crewData.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={index === 0 ? "default" : "outline"}
                            className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-lg"
                          >
                            {index + 1}
                          </Badge>
                          <span className="text-lg">{item.name}</span>
                        </div>
                        <span className="font-medium text-lg">{item.value.toLocaleString()} ft</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-lg">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Production by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {typeData.length > 0 ? (
                <div className="space-y-4">
                  {typeData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={index === 0 ? "default" : "outline"}
                          className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-lg"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-lg">{item.name}</span>
                      </div>
                      <span className="font-medium text-lg">{item.value.toLocaleString()} ft</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-lg">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Production by Crew</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <BarChart data={crewData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Production by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <PieChart data={typeData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Daily Production</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <LineChart data={dailyData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Production by Crew and Type</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <StackedBarChart data={crewTypeData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Weekly Production Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart data={weeklyTrendData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Production Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ProductionDistributionChart data={filteredData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Production Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ProductionHeatmap data={filteredData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Crew Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <CrewComparisonChart data={filteredData} crews={crews} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Production Entries</CardTitle>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={printReport} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Print Report
                </Button>
                <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-lg">Date</TableHead>
                        <TableHead className="text-lg">Crew</TableHead>
                        <TableHead className="text-lg">Type</TableHead>
                        <TableHead className="text-lg">Feet</TableHead>
                        <TableHead className="text-lg">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData
                        .sort((a, b) => {
                          // Sort by date in descending order
                          return a.date < b.date ? 1 : -1
                        })
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-base">
                              {formatDateForDisplay(dbStringToDate(entry.date))}
                            </TableCell>
                            <TableCell className="text-base">{entry.crew}</TableCell>
                            <TableCell className="text-base">{entry.type}</TableCell>
                            <TableCell className="text-base">{entry.feet.toLocaleString()} ft</TableCell>
                            <TableCell className="text-base">{entry.username}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-lg">No entries found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
