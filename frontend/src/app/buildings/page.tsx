"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image";
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Users,
  Building2,
  Globe,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

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
}

const providerColors: Record<string, string> = {
  Mediatek: "bg-blue-100 text-blue-800",
  Safaricom: "bg-green-100 text-green-800",
  Zuku: "bg-purple-100 text-purple-800",
  Airtel: "bg-orange-100 text-orange-800",
  Telkom: "bg-red-100 text-red-800",
}

export default function BuildingsPage() {
  const { toast } = useToast()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  

  const fetchBuildings = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const response = await fetch("/api/buildings")
      if (!response.ok) {
        throw new Error("Failed to fetch buildings")
      }
      const data = await response.json()
      setBuildings(data)
    } catch (error) {
      console.error("Error fetching buildings:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load buildings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast]);

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const filteredBuildings = buildings.filter((building) => {
    const matchesSearch =
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProvider = providerFilter === "all" || building.providers.includes(providerFilter)
    return matchesSearch && matchesProvider && building.active
  })

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!confirm("Are you sure you want to delete this building? This action cannot be undone.")) {
      return
    }
    try {
      const token = localStorage.getItem("token") // Get token from localStorage
      if (!token) {
        throw new Error("Authentication token not found.") // Handle missing token
      }
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to delete building")
      }
      toast({
        title: "Building Deleted",
        description: "Building has been successfully deleted.",
      })
      fetchBuildings() // Re-fetch buildings after successful deletion
    } catch (error) {
      console.error("Error deleting building:", error)
      toast({
        title: "Error",
        description: "Failed to delete building. Please try again.",
        variant: "destructive",
      })
    }
  }

  const totalUnits = buildings.reduce((sum, building) => sum + building.totalUnits, 0)
  const averageUnits = buildings.length > 0 ? Math.round(totalUnits / buildings.length) : 0

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading buildings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error loading buildings. Please try again.</p>
            <Button onClick={fetchBuildings} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
      <Topbar />

      <div className="flex-1 p-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-400">Buildings</h1>
            <p className="text-lg text-zinc-400">Manage building information and caretaker assignments</p>
          </div>
          <Link href="/buildings/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105">
            <Plus className="mr-2 h-4 w-4" />
            Add New Building
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 text-white border-blue-600 shadow-xl rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
              <CardTitle className="text-sm font-medium text-blue-400">Total Buildings</CardTitle>
              <Building2 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-300">{buildings.filter((b) => b.active).length}</div>
              <p className="text-xs text-zinc-400">Active properties</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white border-green-600 shadow-xl rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
              <CardTitle className="text-sm font-medium text-green-400">Total Units</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">{totalUnits}</div>
              <p className="text-xs text-zinc-400">Across all buildings</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white border-yellow-600 shadow-xl rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
              <CardTitle className="text-sm font-medium text-yellow-400">Average Units</CardTitle>
              <Building2 className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-300">{averageUnits}</div>
              <p className="text-xs text-zinc-400">Per building</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white border-purple-600 shadow-xl rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
              <CardTitle className="text-sm font-medium text-purple-400">Providers</CardTitle>
              <Globe className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-300">5</div>
              <p className="text-xs text-zinc-400">Service providers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
              <Input
                placeholder="Search buildings..."
                className="pl-10 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-48 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg"> {/* Styled select trigger */}
                <Filter className="mr-2 h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg"> {/* Styled select content */}
                <SelectItem value="all" className="focus:bg-zinc-700 focus:text-white">All Providers</SelectItem>
                <SelectItem value="Mediatek" className="focus:bg-zinc-700 focus:text-white">Mediatek</SelectItem>
                <SelectItem value="Safaricom" className="focus:bg-zinc-700 focus:text-white">Safaricom</SelectItem>
                <SelectItem value="Zuku" className="focus:bg-zinc-700 focus:text-white">Zuku</SelectItem>
                <SelectItem value="Airtel" className="focus:bg-zinc-700 focus:text-white">Airtel</SelectItem>
                <SelectItem value="Telkom" className="focus:bg-zinc-700 focus:text-white">Telkom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          
        </div>

        {/* Buildings Display */}
        <Tabs value="grid" className="space-y-4">
          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBuildings.map((building) => (
                <Link href={`/buildings/${building._id}`} key={building._id} className="block hover:shadow-xl transition-shadow rounded-lg border border-zinc-800 bg-zinc-900">
                  <Card className="bg-transparent text-white"> {/* Make card background transparent to show link styling */}
                    <CardHeader className="pb-3 border-b border-zinc-800">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg text-blue-400">{building.name.replace('in progress', '').trim()}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="h-3 w-3 text-zinc-400" />
                            {building.address}
                          </CardDescription>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:bg-zinc-700">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700"> {/* Styled dropdown content */}
                              <DropdownMenuLabel className="text-zinc-300">Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="focus:bg-zinc-700 focus:text-white">
                                <Link href={`/buildings/${building._id}`} className="flex items-center w-full">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-zinc-700 focus:text-white">
                                <Link href={`/buildings/edit/${building._id}`} className="flex items-center w-full">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Building
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-zinc-700" />
                              <DropdownMenuItem className="text-red-400 focus:bg-zinc-700 focus:text-red-300" onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(building._id); }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Building
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      {building.images && building.images.length > 0 && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                          <Image
                            src={`http://localhost:5000${building.images[0]}`}
                            alt={building.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                            priority
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-zinc-300">{building.totalUnits} units</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-zinc-300">{building.staffPhone}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-zinc-300">
                        <div className="text-sm">
                          <span className="font-medium text-zinc-400">Caretaker:</span> {building.staffName}
                        </div>
                        {building.owner && (
                          <div className="text-sm">
                            <span className="font-medium text-zinc-400">Owner:</span> {building.owner}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {building.providers.map((provider) => (
                          <Badge key={provider} className={`${providerColors[provider] || "bg-zinc-800 text-zinc-300"} border border-zinc-700`}>
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          
        </Tabs>

        {/* Empty State */}
        {filteredBuildings.length === 0 && (
          <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-lg font-semibold text-blue-300 mb-2">No buildings found</h3>
              <p className="text-zinc-400 text-center mb-4">
                {searchTerm || providerFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first building"}
              </p>
              <Link href="/buildings/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Add New Building
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}