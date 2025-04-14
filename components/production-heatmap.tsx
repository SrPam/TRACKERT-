"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Chart, registerables } from "chart.js"
import type { ProductionEntry } from "@/lib/types"
import { parseISO, getDay } from "date-fns"

Chart.register(...registerables)

interface ProductionHeatmapProps {
  data: ProductionEntry[]
}

export function ProductionHeatmap({ data }: ProductionHeatmapProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    const isDark = theme === "dark"
    const textColor = isDark ? "#e5e7eb" : "#374151"
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Process data for heatmap
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    // Group data by day of week
    const productionByDay: Record<string, number[]> = {}

    // Initialize
    daysOfWeek.forEach((day) => {
      productionByDay[day] = []
    })

    // Fill data
    data.forEach((entry) => {
      const date = parseISO(entry.date)
      const dayIndex = getDay(date)
      const dayName = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1] // Adjust for Sunday

      productionByDay[dayName].push(entry.feet)
    })

    // Calculate average production for each day
    const averageByDay = daysOfWeek.map((day) => {
      const values = productionByDay[day]
      if (values.length === 0) return 0
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })

    // Calculate max for color scaling
    const maxAverage = Math.max(...averageByDay)

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: daysOfWeek,
        datasets: [
          {
            label: "Average Production",
            data: averageByDay,
            backgroundColor: averageByDay.map((value) => {
              const intensity = value / maxAverage
              return `rgba(59, 130, 246, ${Math.max(0.2, intensity)})`
            }),
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const day = context.label
                const count = productionByDay[day].length
                return [`Average: ${Math.round(context.parsed.x).toLocaleString()} ft`, `Entries: ${count}`]
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Average Production (feet)",
              color: textColor,
            },
            ticks: {
              color: textColor,
              callback: (value) => value.toLocaleString(),
            },
            grid: {
              color: gridColor,
            },
          },
          y: {
            title: {
              display: true,
              text: "Day of Week",
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
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
  }, [data, theme])

  return <canvas ref={chartRef} />
}
