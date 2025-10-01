"use client"

"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image";
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Building2, MapPin, User, Calendar, Edit, Trash2, ExternalLink, Users, Plus, Eye, Globe as LucideGlobe, } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UnitsTable } from "./units-table"

interface Equipment {
  deviceName: string;
  ipAddress: string;
  username: string;
  password: string;
  type: string;
}

interface ReversePoeSwitch {
  count: number;
  serialNumber: string;
}

interface BuildingDetails {
  _id: string;
  name: string;
  address: string;
  gps: { lat: number; lng: number };
  owner?: string;
  staffName?: string;
  staffPhone?: string;
  notes?: string;
  images?: string[];
  providers?: string[];
  totalUnits?: number;
  active?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  equipment?: Equipment[]; // New field
  reversePoeSwitches?: ReversePoeSwitch[]; // Added reversePoeSwitches
}

export default function BuildingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const buildingId = params.id as string

  const [building, setBuilding] = useState<BuildingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showUnitsTable, setShowUnitsTable] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Added refreshKey

  const loadBuilding = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const response = await fetch(`/api/buildings/${buildingId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch building details")
      }
      const data = await response.json()
      setBuilding(data)
    } catch (error) {
      console.error("Error fetching building details:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load building details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [buildingId, toast])

  useEffect(() => {
    if (buildingId) {
      loadBuilding()
    }
  }, [buildingId, refreshKey, loadBuilding]) // Added refreshKey to dependencies

  // New useEffect to update refreshKey from query param
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      setRefreshKey(prevKey => prevKey + 1); // Increment key to force re-fetch
    }
  }, [searchParams]); // Dependency on searchParams

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete building")
      }
      toast({
        title: "Building Deleted",
        description: "Building has been successfully deleted.",
      })
      router.push("/buildings")
    } catch (error) {
      console.error("Error deleting building:", error)
      toast({
        title: "Error",
        description: "Failed to delete building. Please try again.",
        variant: "destructive",
      })
    }
  }

  

  const handleOpenMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800 mx-auto"></div>
            <p className="mt-2 text-zinc-400">Loading building details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error loading building details. Please try again.</p>
            <Button onClick={loadBuilding} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!building && !isLoading && !isError) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-blue-300">Building Not Found</h2>
            <p className="text-zinc-400 mb-4">The building you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/buildings">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">Back to Buildings</Button>
            </Link>
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
          <div className="flex items-center gap-4">
            <Link href="/buildings">
              <Button variant="ghost" size="icon" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              {building && (
                <>
                  <h1 className="text-4xl font-extrabold tracking-tight text-blue-400">{building.name}</h1>
                  <p className="text-lg text-zinc-400">{building.address}</p>
                </>
              )}
            </div>
          </div>

          {building && (
            <div className="flex items-center gap-2">
              <Link href={`/buildings/edit/${building._id}`}>
                <Button variant="outline" size="sm" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Building
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Building2 className="h-5 w-5" />
                  Building Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Primary Image */}
                {building && building.images && building.images.length > 0 && (
                  <div className="space-y-4">
                    <Image
                      src={`http://localhost:5000${building.images[0]}`}
                      alt={building.name}
                      width={800}
                      height={600}
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-zinc-700"
                      onClick={() => building.images && setSelectedImage(building.images[0])}
                      priority
                    />

                    {/* Additional Images */}
                    {building.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {building.images.slice(1).map((image: string, index: number) => (
                          <Image
                            key={index}
                            src={`http://localhost:5000${image}`}
                            alt={`${building.name} ${index + 2}`}
                            width={200}
                            height={150}
                            className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity border border-zinc-700"
                            onClick={() => setSelectedImage(image)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Building Stats */}
                {building && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="text-2xl font-bold text-blue-300">{building.totalUnits}</div>
                      <div className="text-sm text-zinc-400">Total Units</div>
                    </div>
                    <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="text-2xl font-bold text-blue-300">{building.providers?.length || 0}</div>
                      <div className="text-sm text-zinc-400">Providers</div>
                    </div>
                    <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="text-2xl font-bold text-blue-300">
                        <MapPin className="h-6 w-6 mx-auto" />
                      </div>
                      <div className="text-sm text-zinc-400">GPS Located</div>
                    </div>
                    <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="text-2xl font-bold text-blue-300">
                        <Calendar className="h-6 w-6 mx-auto" />
                      </div>
                      <div className="text-sm text-zinc-400">{building.createdAt ? new Date(building.createdAt).getFullYear() : 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Location */}
                {building && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-blue-400">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h3>
                    <p className="text-zinc-300">{building.address}</p>
                    <Button variant="outline" size="sm" onClick={() => handleOpenMap(building.gps.lat, building.gps.lng)} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Maps
                    </Button>
                  </div>
                )}

                {/* Owner Information */}
                {building && building.owner && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-blue-400">
                      <User className="h-4 w-4" />
                      Owner / Landlord
                    </h3>
                    <p className="text-zinc-300">{building.owner}</p>
                  </div>
                )}

                
              </CardContent>
            </Card>

            {/* Equipment Information */}
            {building && building.equipment && building.equipment.length > 0 && (
              <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <LucideGlobe className="h-5 w-5" />
                    Rooftop Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {building.equipment.map((item: Equipment, index: number) => (
                    <div key={index} className="border border-zinc-700 p-4 rounded-md space-y-2">
                      <h4 className="font-semibold text-blue-300">Switch #{index + 1}</h4>
                      {/* Password is not displayed for security reasons */}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reverse PoE Switches Information */}
            {building && building.reversePoeSwitches && building.reversePoeSwitches.length > 0 && (
              <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <LucideGlobe className="h-5 w-5" /> {/* Using Globe icon for now, can be changed */}
                    Reverse PoE Switches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {building.reversePoeSwitches.map((item: ReversePoeSwitch, index: number) => (
                    <div key={index} className="border border-zinc-700 p-4 rounded-md space-y-2">
                      <h4 className="font-semibold text-blue-300">Switch #{index + 1}</h4>
                      {/* Password is not displayed for security reasons */}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            {building && building.notes && (
              <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-blue-400">Notes & Description</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-zinc-300 leading-relaxed">{building.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            

            {/* Quick Actions */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-blue-400">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <Button variant="outline" size="sm" className="w-full justify-start bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700" onClick={() => setShowUnitsTable(!showUnitsTable)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showUnitsTable ? "Hide Units" : "View Units"}
                </Button>
                {building && (
                  <>
                    <Link href={`/leads/new?building=${building._id}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lead
                      </Button>
                    </Link>
                    <Link href={`/units/new?building=${building._id}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                        <Users className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {showUnitsTable && <UnitsTable buildingId={buildingId} />}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-blue-400">Delete Building</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {building && (
                <>
                  Are you sure you want to delete &quot;{building.name}&quot;? This action cannot be undone and will remove all
                  associated data.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
              Delete Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
            <DialogHeader className="border-b border-zinc-800 pb-4">
              <DialogTitle className="text-blue-400">Building Image</DialogTitle>
              <DialogDescription className="text-zinc-400">Full view of the building image.</DialogDescription>
            </DialogHeader>
            <Image src={`http://localhost:5000${selectedImage}`} alt={"Building"} width={1200} height={800} className="w-full h-auto rounded-lg border border-zinc-700" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}