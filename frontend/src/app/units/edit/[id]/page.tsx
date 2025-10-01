"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Home, Tag, FileText, CheckCircle2, User, CalendarIcon, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Building = {
  _id: string
  name: string
}

type Unit = {
    _id: string;
    buildingId: string;
    label: string;
    visitStatus: string;
    provider: string;
    clientName: string;
    phone: string;
    nextBillingDate: Date | null;
    comments: string;
    wifiName?: string;
    wifiPassword?: string;
    pppoeUsername?: string;
    pppoePassword?: string;
    staticIpAddress?: string;
    wifiInstallationDate?: Date | null; // New field
    initialPaymentAmount?: number; // New field
    routerOwnership?: "Own" | "Provided"; // New field
    active: boolean;
    poeAdapter: boolean;
    status?: string; 
}

export default function EditUnitPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { toast } = useToast()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<Unit>({
    _id: "",
    buildingId: "",
    label: "",
    visitStatus: "Not Visited",
    provider: "",
    clientName: "",
    phone: "",
    nextBillingDate: null,
    comments: "",
    active: true,
    poeAdapter: false,
    status: "active",
  })

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
        setFormData({
            ...data,
            nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
            wifiName: data.wifiName || "",
            wifiPassword: data.wifiPassword || "",
            pppoeUsername: data.pppoeUsername || "",
            pppoePassword: data.pppoePassword || "",
            staticIpAddress: data.staticIpAddress || "",
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

  const [showPasswordStates, setShowPasswordStates] = useState<boolean[]>([false, false])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.buildingId) {
      toast({
        title: "Validation Error",
        description: "Building is a required field.",
        variant: "destructive",
      })
      return
    }

    const token = localStorage.getItem("token")

    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update a unit.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    console.log("Sending formData:", formData); // Added for debugging

    try {
      const response = await fetch(`/api/buildings/${formData.buildingId}/units/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update unit")
      }

      toast({
        title: "Unit Updated",
        description: `Unit ${formData.label} has been updated successfully.`,
      })

      router.push(`/units/${formData.buildingId}`)
    } catch (error: unknown) {
      console.error("Error updating unit:", error)
      toast({
        title: "Error",
        description: (error instanceof Error) ? error.message : "Failed to update unit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (isError) {
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/units")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Units
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Unit</h1>
            <p className="text-muted-foreground">Update the details of the unit</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Unit Information
              </CardTitle>
              <CardDescription>
                Update the details below for the unit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Unit Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    Basic Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buildingId">Building *</Label>
                      <Select
                        value={formData.buildingId}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a building" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building._id} value={building._id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="label">Unit Label</Label>
                      <Input
                        id="label"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="e.g., Apartment 101, Unit B"
                      />
                    </div>
                  </div>
                </div>

                  
                {/* Status and Provider */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Status & Provider
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitStatus">Visit Status</Label>
                      <Select
                        value={formData.visitStatus}
                        onValueChange={(value) => setFormData({ ...formData, visitStatus: value as "Visited" | "Not Visited" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Visited">Not Visited</SelectItem>
                          <SelectItem value="Visited">Visited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Input
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        placeholder="e.g., Safaricom, Zuku"
                      />
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
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        placeholder="e.g., John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Client Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., 254712345678"
                      />
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
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.nextBillingDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.nextBillingDate ? format(formData.nextBillingDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={formData.nextBillingDate || undefined}
                            onSelect={(date) => setFormData({ ...formData, nextBillingDate: date as Date | null })}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
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
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      rows={4}
                      placeholder="Add any relevant comments about this unit."
                    />
                  </div>
                </div>

                {/* Network Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                    Network Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wifiName">Wi-Fi Name</Label>
                      <Input
                        id="wifiName"
                        value={formData.wifiName || ""}
                        onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                        placeholder="e.g., MyHome_WiFi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifiPassword">Wi-Fi Password</Label>
                      <div className="relative">
                        <Input
                          id="wifiPassword"
                          type={showPasswordStates[0] ? "text" : "password"}
                          value={formData.wifiPassword || ""}
                          onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                          placeholder="Wi-Fi password"
                          className="pr-10"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-1"
                          onClick={() =>
                            setShowPasswordStates((prev) => [!prev[0], prev[1]])
                          }
                        >
                          {showPasswordStates[0] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pppoeUsername">PPPoE Username</Label>
                      <Input
                        id="pppoeUsername"
                        value={formData.pppoeUsername || ""}
                        onChange={(e) => setFormData({ ...formData, pppoeUsername: e.target.value })}
                        placeholder="PPPoE username"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pppoePassword">PPPoE Password</Label>
                      <div className="relative">
                        <Input
                          id="pppoePassword"
                          type={showPasswordStates[1] ? "text" : "password"}
                          value={formData.pppoePassword || ""}
                          onChange={(e) => setFormData({ ...formData, pppoePassword: e.target.value })}
                          placeholder="PPPoE password"
                          className="pr-10"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-1"
                          onClick={() =>
                            setShowPasswordStates((prev) => [prev[0], !prev[1]])
                          }
                        >
                          {showPasswordStates[1] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staticIpAddress">Static IP Address</Label>
                    <Input
                      id="staticIpAddress"
                      value={formData.staticIpAddress || ""}
                      onChange={(e) => setFormData({ ...formData, staticIpAddress: e.target.value })}
                      placeholder="e.g., 192.168.1.100"
                    />
                  </div>
                </div>

                {/* WiFi Installation Date */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        WiFi Installation Date
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wifiInstallationDate">WiFi Installation Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.wifiInstallationDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.wifiInstallationDate ? format(formData.wifiInstallationDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.wifiInstallationDate || undefined}
                                    onSelect={(date) => setFormData({ ...formData, wifiInstallationDate: date as Date | null })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Initial Payment Amount */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                        Financial Details
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="initialPaymentAmount">Initial Payment Amount</Label>
                        <Input
                            id="initialPaymentAmount"
                            type="number"
                            value={formData.initialPaymentAmount}
                            onChange={(e) => setFormData({ ...formData, initialPaymentAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 1500"
                        />
                    </div>
                </div>

                {/* Router Ownership */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                        Router Ownership
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="routerOwnership">Router Ownership</Label>
                        <Select
                            value={formData.routerOwnership}
                            onValueChange={(value) => setFormData({ ...formData, routerOwnership: value as "Own" | "Provided" })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select ownership" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Own">Own</SelectItem>
                                <SelectItem value="Provided">Provided</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Status
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger>
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id="poeAdapter"
                            checked={formData.poeAdapter}
                            onCheckedChange={(checked) => setFormData({ ...formData, poeAdapter: checked as boolean })}
                        />
                        <Label htmlFor="poeAdapter">PoE Adapter</Label>
                        </div>
                    </div>
                </div>
                

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.push(`/units/${formData.buildingId}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
