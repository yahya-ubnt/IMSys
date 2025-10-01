"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'

import { Topbar } from "@/components/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


import { Search, Building2, Loader2, ServerCrash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns"


type Building = {
  _id: string
  name: string
  address: string
  gps?: { lat: number; lng: number }
  owner?: string
  staffName: string
  staffPhone: string
  notes?: string
  images?: string[]
  providers: string[]
  totalUnits: number
  active: boolean
  createdAt: string
  visitedUnits: number
  completionRate: number
  lastUpdated: string
  status: "completed" | "in-progress"
  caretakerName: string
}





export default function UnitsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)
  const [errorBuildings, setErrorBuildings] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  

  const fetchBuildings = async () => {
    setIsLoadingBuildings(true)
    setErrorBuildings(null)
    try {
      const response = await fetch("/api/buildings")
      if (!response.ok) {
        throw new Error("Failed to fetch buildings")
      }
      const data = await response.json()
      setBuildings(data)
    } catch (error: unknown) {
      setErrorBuildings((error instanceof Error) ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoadingBuildings(false)
    }
  }

  const handleDeleteBuilding = async (buildingId: string) => {
    // Implement delete functionality here
    console.log("Deleting building:", buildingId)
    toast({
      title: "Building Deleted",
      description: `Building ${buildingId} has been deleted. (Not really, this is a placeholder)`,
    })
    // In a real application, you would make an API call to delete the building
    // and then refetch the buildings list or update the state directly.
  }

  useEffect(() => {
    fetchBuildings()
  }, [])

  const filteredBuildings = buildings.filter((building) => {
    const matchesSearch =
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || building.status === statusFilter

    return matchesSearch && matchesStatus && building.active
  })

  

  if (isLoadingBuildings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading buildings...</p>
      </div>
    )
  }

  if (errorBuildings) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ServerCrash className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Failed to load buildings</h2>
        <p className="text-muted-foreground">{errorBuildings}</p>
        <Button onClick={fetchBuildings} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Topbar />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-400">Units Management</h1>
            <p className="text-gray-400 text-base">Track and manage individual units across all buildings</p>
          </div>
        </div>

        

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search buildings..."
              className="pl-8 bg-gray-800 text-white border-gray-600 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "completed" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
              className="bg-gray-700 text-green-400 border-green-600 hover:bg-gray-600"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "in-progress" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("in-progress")}
              className="bg-gray-700 text-blue-400 border-blue-600 hover:bg-gray-600"
            >
              In Progress
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBuildings.length > 0 ? (
            <DataTable columns={getColumns({ handleDelete: handleDeleteBuilding, handleEdit: (id: string) => router.push(`/units/edit/${id}`) })} data={filteredBuildings} filterColumn="name" className="text-sm [&_th]:bg-zinc-800 [&_th]:text-white [&_th]:font-semibold [&_td]:bg-zinc-900 [&_td]:text-white [&_td]:border-b [&_td]:border-zinc-700 [&_tr:last-child_td]:border-b-0 hover:[&_tr]:bg-zinc-800 transition-colors duration-200" />
          ) : (
            <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-blue-300 mb-2">No buildings found</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No buildings available for unit management."}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
