"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Tag, FileText, CheckCircle2, User, CalendarIcon, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Building = {
  _id: string
  name: string
}

export default function NewUnitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { toast } = useToast()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)
  const [isErrorBuildings, setIsErrorBuildings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordStates, setShowPasswordStates] = useState<boolean[]>([false, false])

  const initialBuildingId = searchParams.get("buildingId") || ""; // Get initial buildingId from search params

  const [formData, setFormData] = useState({
    buildingId: initialBuildingId, // Initialize with value from search params
    label: "",
    visitStatus: "Not Visited",
    provider: "",
    clientName: "",
    phone: "",
    nextBillingDate: null as Date | null,
    comments: "",
    wifiName: "",
    wifiPassword: "",
    pppoeUsername: "",
    pppoePassword: "",
    staticIpAddress: "",
    wifiInstallationDate: null as Date | null, // New field
    initialPaymentAmount: 0, // New field
    routerOwnership: "Own", // New field, default to 'Own'
    status: "active",
    poeInstall: false,
  })

  const fetchBuildings = useCallback(async () => {
    setIsLoadingBuildings(true)
    setIsErrorBuildings(false)
    try {
      const response = await fetch("/api/buildings")
      if (!response.ok) {
        throw new Error("Failed to fetch buildings")
      }
      const data = await response.json()
      setBuildings(data)
    } catch (error) {
      console.error("Error fetching buildings:", error)
      setIsErrorBuildings(true)
      toast({
        title: "Error",
        description: "Failed to load buildings data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBuildings(false)
    }
  }, [setIsLoadingBuildings, setIsErrorBuildings, setBuildings, toast])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

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
        description: "You must be logged in to create a unit.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/buildings/${formData.buildingId}/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create unit")
      }

      toast({
        title: "Unit Created",
        description: `Unit ${formData.label} has been created successfully.`,
      })

      router.push(`/units/${formData.buildingId}`)
    } catch (error: unknown) {
      console.error("Error creating unit:", error)
      toast({
        title: "Error",
        description: (error instanceof Error) ? error.message : "Failed to create unit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      buildingId: "",
      label: "",
      visitStatus: "Not Visited",
      provider: "",
      clientName: "",
      phone: "",
      nextBillingDate: null,
      comments: "",
      wifiName: "",
      wifiPassword: "",
      pppoeUsername: "",
      pppoePassword: "",
      staticIpAddress: "",
      wifiInstallationDate: null,
      initialPaymentAmount: 0,
      routerOwnership: "Own",
      status: "active",
      poeInstall: false,
    })
  }

  const handleCancel = () => {
    const buildingId = searchParams.get("buildingId")
    if (buildingId) {
      router.push(`/units/${buildingId}`)
      console.log("Navigating to specific building units page:", `/units/${buildingId}`)
    } else {
      router.push("/units")
      console.log("Navigating to general units page.")
    }
  }

  if (isLoadingBuildings) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading buildings data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isErrorBuildings) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error loading buildings data. Please try again.</p>
            <Button onClick={fetchBuildings} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-blue-400">Add New Unit</h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
              <CardHeader className="border-b border-gray-700 pb-4">
                <CardTitle className="text-blue-400">Unit Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Fill in the details for the new unit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unit Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                    <Tag className="h-4 w-4" />
                    Basic Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Building Select */}
                    <div className="space-y-2">
                      <Label htmlFor="buildingId" className="text-gray-300">Building *</Label>
                      <Select
                        value={formData.buildingId}
                        onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                      >
                        <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                          <SelectValue placeholder="Select a building" className="text-gray-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 text-white border-gray-600">
                          {buildings.map((building) => (
                            <SelectItem key={building._id} value={building._id} className="focus:bg-gray-600 focus:text-white">
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Unit Label Input */}
                    <div className="space-y-2">
                      <Label htmlFor="label" className="text-gray-300">Unit Label</Label>
                      <Input
                        id="label"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="e.g., Apartment 101, Unit B"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Status and Provider */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Status & Provider
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitStatus" className="text-gray-300">Visit Status</Label>
                      <Select
                        value={formData.visitStatus}
                        onValueChange={(value) => setFormData({ ...formData, visitStatus: value })}
                      >
                        <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                          <SelectValue className="text-gray-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 text-white border-gray-600">
                          <SelectItem value="Not Visited" className="focus:bg-gray-600 focus:text-white">Not Visited</SelectItem>
                          <SelectItem value="Visited" className="focus:bg-gray-600 focus:text-white">Visited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider" className="text-gray-300">Provider</Label>
                      <Input
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        placeholder="e.g., Safaricom, Zuku"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                    
                  </div>
                </div>

                {/* Client Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                    <User className="h-4 w-4" />
                    Client Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-gray-300">Client Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        placeholder="e.g., John Doe"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Client Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., 254712345678"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Next Billing Date */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <CalendarIcon className="h-4 w-4" />
                        Next Billing Date
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nextBillingDate" className="text-gray-300">Next Billing Date</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal bg-gray-700 text-white border-gray-600 hover:bg-gray-600",
                                !formData.nextBillingDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.nextBillingDate ? format(formData.nextBillingDate, "PPP") : <span className="text-gray-400">Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 text-white border-gray-700">
                            <Calendar
                            mode="single"
                            selected={formData.nextBillingDate || undefined}
                            onSelect={(date) => setFormData({ ...formData, nextBillingDate: date as Date | null })}
                            initialFocus
                            className="bg-gray-800 text-white"
                            />
                        </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                    <FileText className="h-4 w-4" />
                    Comments
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="text-gray-300">Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      rows={4}
                      placeholder="Add any relevant comments about this unit."
                      className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Network Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                    <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                    Network Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wifiName" className="text-gray-300">Wi-Fi Name</Label>
                      <Input
                        id="wifiName"
                        value={formData.wifiName}
                        onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                        placeholder="e.g., MyHome_WiFi"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifiPassword" className="text-gray-300">Wi-Fi Password</Label>
                      <div className="relative">
                        <Input
                          id="wifiPassword"
                          type={showPasswordStates[0] ? "text" : "password"}
                          value={formData.wifiPassword}
                          onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                          placeholder="Wi-Fi password"
                          className="pr-10 bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-1 text-gray-400 hover:bg-gray-600"
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
                      <Label htmlFor="pppoeUsername" className="text-gray-300">PPPoE Username</Label>
                      <Input
                        id="pppoeUsername"
                        value={formData.pppoeUsername}
                        onChange={(e) => setFormData({ ...formData, pppoeUsername: e.target.value })}
                        placeholder="PPPoE username"
                        autoComplete="off"
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pppoePassword" className="text-gray-300">PPPoE Password</Label>
                      <div className="relative">
                        <Input
                          id="pppoePassword"
                          type={showPasswordStates[1] ? "text" : "password"}
                          value={formData.pppoePassword}
                          onChange={(e) => setFormData({ ...formData, pppoePassword: e.target.value })}
                          placeholder="PPPoE password"
                          className="pr-10 bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-1 text-gray-400 hover:bg-gray-600"
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
                    <Label htmlFor="staticIpAddress" className="text-gray-300">Static IP Address</Label>
                    <Input
                      id="staticIpAddress"
                      value={formData.staticIpAddress}
                      onChange={(e) => setFormData({ ...formData, staticIpAddress: e.target.value })}
                      placeholder="e.g., 192.168.1.100"
                      className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* WiFi Installation Date */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <CalendarIcon className="h-4 w-4" />
                        WiFi Installation Date
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wifiInstallationDate" className="text-gray-300">WiFi Installation Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-gray-700 text-white border-gray-600 hover:bg-gray-600",
                                        !formData.wifiInstallationDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.wifiInstallationDate ? format(formData.wifiInstallationDate, "PPP") : <span className="text-gray-400">Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-gray-800 text-white border-gray-700">
                                <Calendar
                                    mode="single"
                                    selected={formData.wifiInstallationDate || undefined}
                                    onSelect={(date) => setFormData({ ...formData, wifiInstallationDate: date as Date | null })}
                                    initialFocus
                                    className="bg-gray-800 text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Initial Payment Amount */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                        Financial Details
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="initialPaymentAmount" className="text-gray-300">Initial Payment Amount</Label>
                        <Input
                            id="initialPaymentAmount"
                            type="number"
                            value={formData.initialPaymentAmount}
                            onChange={(e) => setFormData({ ...formData, initialPaymentAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 1500"
                            className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Router Ownership */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <Tag className="h-4 w-4" /> {/* Using Tag icon for now, can be changed */}
                        Router Ownership
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="routerOwnership" className="text-gray-300">Router Ownership</Label>
                        <Select
                            value={formData.routerOwnership}
                            onValueChange={(value) => setFormData({ ...formData, routerOwnership: value as "Own" | "Provided" })}
                        >
                            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                                <SelectValue placeholder="Select ownership" className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 text-white border-gray-600">
                                <SelectItem value="Own" className="focus:bg-gray-600 focus:text-white">Own</SelectItem>
                                <SelectItem value="Provided" className="focus:bg-gray-600 focus:text-white">Provided</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Status
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="status" className="text-gray-300">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                            <SelectValue className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 text-white border-gray-600">
                            <SelectItem value="active" className="focus:bg-gray-600 focus:text-white">Active</SelectItem>
                            <SelectItem value="inactive" className="focus:bg-gray-600 focus:text-white">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id="poeInstall"
                            checked={formData.poeInstall}
                            onCheckedChange={(checked) => setFormData({ ...formData, poeInstall: !!checked })}
                            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                        />
                        <Label htmlFor="poeInstall" className="text-gray-300">PoE Install</Label>
                        </div>
                    </div>
                </div>
              </CardContent>

                {/* Form Actions */}
                <CardFooter className="flex items-center justify-between pt-6 border-t border-gray-700">
                  <Button type="button" variant="outline" onClick={handleReset} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                    Reset Form
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Creating Unit..." : "Create Unit"}
                    </Button>
                  </div>
                </CardFooter>
            </Card>
          </form>
            
        </div>
      </div>
    </div>
  )
}