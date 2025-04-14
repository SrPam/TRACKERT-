"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface ChartData {
  crew: string
  type: string
  value: number
}

interface StackedBarChartProps {
  data: ChartData[]
}

export function StackedBarChart({ data }: StackedBarChartProps) {
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

    // Process data for stacked bar chart
    const crews = Array.from(new Set(data.map((item) => item.crew)))
    const types = Array.from(new Set(data.map((item) => item.type)))

    // Generate colors
    const colors = [
      "rgba(59, 130, 246, 0.7)",
      "rgba(16, 185, 129, 0.7)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(239, 68, 68, 0.7)",
      "rgba(139, 92, 246, 0.7)",
      "rgba(236, 72, 153, 0.7)",
      "rgba(14, 165, 233, 0.7)",
      "rgba(168, 85, 247, 0.7)",
    ]

    // Create datasets for each type
    const datasets = types.map((type, index) => {
      return {
        label: type,
        data: crews.map((crew) => {
          const match = data.find((item) => item.crew === crew && item.type === type)
          return match ? match.value : 0
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace("0.7", "1"),
        borderWidth: 1,
      }
    })

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: crews,
        datasets: datasets,
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
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ft`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => value.toLocaleString(),
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
