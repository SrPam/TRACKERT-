"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Chart, registerables } from "chart.js"
import type { ProductionEntry, CrewData } from "@/lib/types"

Chart.register(...registerables)

interface CrewComparisonChartProps {
  data: ProductionEntry[]
  crews: CrewData[]
}

export function CrewComparisonChart({ data, crews }: CrewComparisonChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || data.length === 0 || crews.length === 0) return

    const isDark = theme === "dark"
    const textColor = isDark ? "#e5e7eb" : "#374151"
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Process data for radar chart
    const crewNames = crews.map((crew) => crew.name)

    // Calculate metrics for each crew
    const totalProduction = crewNames.map((crewName) => {
      const crewEntries = data.filter((entry) => entry.crew === crewName)
      return crewEntries.reduce((sum, entry) => sum + entry.feet, 0)
    })

    const averageProduction = crewNames.map((crewName) => {
      const crewEntries = data.filter((entry) => entry.crew === crewName)
      if (crewEntries.length === 0) return 0
      return crewEntries.reduce((sum, entry) => sum + entry.feet, 0) / crewEntries.length
    })

    const entryCount = crewNames.map((crewName) => {
      return data.filter((entry) => entry.crew === crewName).length
    })

    // Normalize data for radar chart (0-100 scale)
    const normalizeData = (values: number[]) => {
      const max = Math.max(...values)
      if (max === 0) return values
      return values.map((value) => (value / max) * 100)
    }

    const normalizedTotal = normalizeData(totalProduction)
    const normalizedAverage = normalizeData(averageProduction)
    const normalizedCount = normalizeData(entryCount)

    chartInstance.current = new Chart(ctx, {
      type: "radar",
      data: {
        labels: crewNames,
        datasets: [
          {
            label: "Total Production",
            data: normalizedTotal,
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
          },
          {
            label: "Average Production",
            data: normalizedAverage,
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
          },
          {
            label: "Number of Entries",
            data: normalizedCount,
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            borderColor: "rgba(245, 158, 11, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(245, 158, 11, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: textColor,
              font: {
                size: 12,
              },
              padding: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex
                const datasetIndex = context.datasetIndex

                if (datasetIndex === 0) {
                  return `Total: ${totalProduction[index].toLocaleString()} ft`
                } else if (datasetIndex === 1) {
                  return `Average: ${Math.round(averageProduction[index]).toLocaleString()} ft`
                } else {
                  return `Entries: ${entryCount[index]}`
                }
              },
            },
          },
        },
        scales: {
          r: {
            angleLines: {
              color: gridColor,
            },
            grid: {
              color: gridColor,
            },
            pointLabels: {
              color: textColor,
              font: {
                size: 12,
              },
            },
            ticks: {
              display: false,
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, crews, theme])

  return <canvas ref={chartRef} />
}
