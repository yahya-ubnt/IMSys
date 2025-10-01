"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Unit } from "./columns"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface UnitsTableProps {
  buildingId: string
}

export function UnitsTable({ buildingId }: UnitsTableProps) {
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const router = useRouter()

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
  }, [buildingId, setIsLoading, setIsError, setUnits, toast]);

  useEffect(() => {
    if (buildingId) {
      fetchUnits()
    }
  }, [buildingId, fetchUnits])

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      return
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`http://localhost:5000/api/buildings/${buildingId}/units/${unitId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to delete unit")
      }
      toast({
        title: "Unit Deleted",
        description: "Unit has been successfully deleted.",
      })
      fetchUnits() // Re-fetch units after successful deletion
    } catch (error: unknown) {
      console.error("Error deleting unit:", error)
      toast({
        title: "Error",
        description: (error instanceof Error) ? error.message : "Failed to delete unit. Please try again.",
        variant: "destructive",
      })
    }
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
      onRowClick={(unit: Unit) => {
        router.push(`/units/view/${unit._id}`)
      }}
      className="text-sm [&_td]:p-2 [&_th]:p-2"
    />
  )
}
