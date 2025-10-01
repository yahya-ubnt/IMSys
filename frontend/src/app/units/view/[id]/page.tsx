"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { ArrowLeft, Home, Tag, FileText, CheckCircle2, User, CalendarIcon, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

type Building = {
  _id: string
  name: string
}

type Unit = {
    _id: string;
    buildingId: string;
    label?: string;
    visitStatus?: 'Visited' | 'Not Visited';
    provider?: string;
    clientName?: string;
    phone?: string;
    nextBillingDate: Date | null; // Keep as Date | null for consistency with component usage
    comments?: string;
    wifiName?: string;
    wifiPassword?: string;
    pppoeUsername?: string;
    pppoePassword?: string;
    staticIpAddress?: string;
    wifiInstallationDate: Date | null; // Keep as Date | null for consistency with component usage
    initialPaymentAmount?: number;
    routerOwnership?: 'Own' | 'Provided';
    poeAdapter?: boolean;
    active?: boolean;
    status?: 'active' | 'inactive';
    createdAt?: string;
}

export default function ViewUnitPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { toast } = useToast()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [unit, setUnit] = useState<Unit | null>(null)

  useEffect(() => {
    const fetchUnit = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
            throw new Error("No token found")
        }
        const response = await fetch(`/api/units/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (!response.ok) {
          throw new Error("Failed to fetch unit data")
        }
        const data = await response.json()
        setUnit({
            ...data,
            nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
            poeAdapter: data.poeAdapter || false, // Added poeAdapter
            wifiInstallationDate: data.wifiInstallationDate ? new Date(data.wifiInstallationDate) : null, // New field
            initialPaymentAmount: data.initialPaymentAmount || 0, // New field
            routerOwnership: data.routerOwnership || "Own", // New field
        })
      } catch (error) {
        console.error("Error fetching unit:", error)
        setIsError(true)
        toast({
          title: "Error",
          description: "Failed to load unit data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchBuildings = async () => {
        try {
          const response = await fetch("/api/buildings")
          if (!response.ok) {
            throw new Error("Failed to fetch buildings")
          }
          const data = await response.json()
          setBuildings(data)
        } catch (error) {
          console.error("Error fetching buildings:", error)
        }
      }

    if (id) {
      fetchUnit()
      fetchBuildings()
    }
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading unit data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !unit) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error loading unit data. Please try again.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/units/${unit.buildingId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Units
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">View Unit Details</h1>
              <p className="text-muted-foreground">Read-only view of the unit\'s information</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/units/edit/${unit._id}`)}>
            Edit Unit
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Unit Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    Basic Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buildingId">Building</Label>
                      <Input value={buildings.find(b => b._id === unit.buildingId)?.name || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="label">Unit Label</Label>
                      <Input value={unit.label} disabled />
                    </div>
                  </div>

                  
                </div>

                {/* Status and Provider */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Status & Provider
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitStatus">Visit Status</Label>
                      <Input value={unit.visitStatus} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Input value={unit.provider} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Input value={unit.status || 'N/A'} disabled />
                    </div>
                    
                  </div>
                </div>

                {/* Client Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    Client Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input value={unit.clientName} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Client Phone</Label>
                      <Input value={unit.phone} disabled />
                    </div>
                  </div>
                </div>

                {/* Next Billing Date */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        Next Billing Date
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                        <Input value={unit.nextBillingDate ? format(unit.nextBillingDate, "PPP") : "N/A"} disabled />
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Comments
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      value={unit.comments}
                      rows={4}
                      disabled
                    />
                  </div>
                </div>

                {/* Network Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                    Network Information
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wifiName">Wi-Fi Name</Label>
                      <Input value={unit.wifiName || "N/A"} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifiPassword">Wi-Fi Password</Label>
                      <Input value={unit.wifiPassword || "N/A"} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pppoeUsername">PPPoE Username</Label>
                      <Input value={unit.pppoeUsername || "N/A"} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pppoePassword">PPPoE Password</Label>
                      <Input value={unit.pppoePassword || "N/A"} disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staticIpAddress">Static IP Address</Label>
                    <Input value={unit.staticIpAddress || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wifiInstallationDate">WiFi Installation Date</Label>
                    <Input value={unit.wifiInstallationDate ? format(unit.wifiInstallationDate, "PPP") : "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialPaymentAmount">Initial Payment Amount</Label>
                    <Input value={unit.initialPaymentAmount || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routerOwnership">Router Ownership</Label>
                    <Input value={unit.routerOwnership || "N/A"} disabled />
                  </div>
                </div>

                {/* PoE Adapter */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                    PoE Adapter
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      {unit.poeAdapter ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                      <span>{unit.poeAdapter ? "Installed" : "Not Installed"}</span>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
