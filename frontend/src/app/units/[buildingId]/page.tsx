"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"
import { PlusCircledIcon } from "@radix-ui/react-icons"
import { UnitsTable } from "./units-table"

interface Building {
  name: string;
  address: string;
  // Add other properties as they become apparent or are defined elsewhere
}

export default function ManageUnitsPage() {
  const params = useParams()
  const buildingId = params.buildingId as string
  const [building, setBuilding] = useState<Building | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBuilding = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/buildings/${buildingId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch building details")
        }
        const data = await response.json()
        setBuilding(data)
      } catch (error) {
        console.error("Error fetching building details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (buildingId) {
      fetchBuilding()
    }
  }, [buildingId])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading building details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!building) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Building Not Found</h2>
            <p className="text-muted-foreground mb-4">The building you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/units">
              <Button>Back to Units</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/units">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Units for {building.name}</h1>
            <p className="text-muted-foreground">{building.address}</p>
          </div>
          <div className="ml-auto">
            <Button asChild>
              <Link href={`/units/new?buildingId=${buildingId}`}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add New Unit
              </Link>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitsTable buildingId={buildingId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
