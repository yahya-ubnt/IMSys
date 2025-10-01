"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Unit } from "./columns"
import { useToast } from "@/hooks/use-toast"

interface UnitsTableProps {
  buildingId: string
}

export function UnitsTable({ buildingId }: UnitsTableProps) {
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchUnits = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const response = await fetch(`/api/buildings/${buildingId}/units`)
      if (!response.ok) {
        throw new Error("Failed to fetch units")
      }
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error("Error fetching units:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load units. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [buildingId, toast])

  useEffect(() => {
    if (buildingId) {
      fetchUnits()
    }
  }, [buildingId, fetchUnits])

  const handleDeleteUnit = async (unitId: string) => {
    // Implement delete functionality here
    console.log("Deleting unit:", unitId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-2 text-muted-foreground">Loading units...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold text-red-500">Error loading units. Please try again.</p>
        <button onClick={fetchUnits} className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Retry
        </button>
      </div>
    )
  }

  return (
    <DataTable
      columns={getColumns(handleDeleteUnit)}
      data={units}
      filterColumn="label"
      className="text-sm [&_td]:p-2 [&_th]:p-2"
    />
  )
}
