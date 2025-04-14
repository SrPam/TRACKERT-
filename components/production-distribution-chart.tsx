"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Chart, registerables } from "chart.js"
import type { ProductionEntry } from "@/lib/types"

Chart.register(...registerables)

interface ProductionDistributionChartProps {
  data: ProductionEntry[]
}

export function ProductionDistributionChart({ data }: ProductionDistributionChartProps) {
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

    // Create distribution buckets
    const bucketSize = 100 // feet
    const maxFeet = Math.max(...data.map((entry) => entry.feet))
    const buckets: Record<string, number> = {}

    // Initialize buckets
    for (let i = 0; i <= Math.ceil(maxFeet / bucketSize); i++) {
      const bucketLabel = `${i * bucketSize}-${(i + 1) * bucketSize}`
      buckets[bucketLabel] = 0
    }

    // Fill buckets
    data.forEach((entry) => {
      const bucketIndex = Math.floor(entry.feet / bucketSize)
      const bucketLabel = `${bucketIndex * bucketSize}-${(bucketIndex + 1) * bucketSize}`
      buckets[bucketLabel]++
    })

    // Filter out empty buckets
    const filteredBuckets = Object.entries(buckets)
      .filter(([_, count]) => count > 0)
      .reduce(
        (acc, [label, count]) => {
          acc[label] = count
          return acc
        },
        {} as Record<string, number>,
      )

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(filteredBuckets),
        datasets: [
          {
            label: "Number of Entries",
            data: Object.values(filteredBuckets),
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `${tooltipItems[0].label} feet`,
              label: (context) => `${context.parsed.y} entries`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Production Range (feet)",
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Entries",
              color: textColor,
            },
            ticks: {
              color: textColor,
              precision: 0,
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
