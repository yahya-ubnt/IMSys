"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"; // Added Image import
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, MapPin, User, FileText, Globe, Upload, X, Phone, Camera, Save, Plus as LucidePlus, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Equipment {
  deviceName: string;
  ipAddress: string;
  username: string;
  password: string;
  type: string;
  serialNumber?: string; // Added serialNumber
}

interface ReversePoeSwitch {
  serialNumber: string;
  notes?: string; // Added notes field
}

interface BuildingFormData {
  name: string
  address: string
  gps: { lat: number; lng: number }
  owner: string
  staffName: string
  staffPhone: string
  notes: string
  totalUnits: number
  providers: string[]
  images: string[]
  equipment: Equipment[]; // New field
  reversePoeSwitches: ReversePoeSwitch[]; // Added reversePoeSwitches
}

const initialFormData: BuildingFormData = {
  name: "",
  address: "",
  gps: { lat: 0, lng: 0 },
  owner: "",
  staffName: "",
  staffPhone: "",
  notes: "",
  totalUnits: 0,
  providers: [],
  images: [],
  equipment: [], // New field
  reversePoeSwitches: [], // Added reversePoeSwitches
}

export default function NewBuildingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState<BuildingFormData>(initialFormData)
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCustomProviderInput, setShowCustomProviderInput] = useState(false)
  const [customProvider, setCustomProvider] = useState("")
  const [providerOptions, setProviderOptions] = useState(["Mediatek", "Safaricom", "Zuku", "Airtel", "Telkom"])
  const [showPasswordStates, setShowPasswordStates] = useState<boolean[]>([])

  const handleAddCustomProvider = () => {
    if (customProvider && !providerOptions.includes(customProvider)) {
      setProviderOptions((prev) => [...prev, customProvider])
      setSelectedProviders((prev) => [...prev, customProvider])
      setCustomProvider("")
      setShowCustomProviderInput(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = "Building name is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    // Optional fields, only validate if provided
    if (formData.staffPhone.trim() && !/^\+254[0-9]{9}$/.test(formData.staffPhone)) {
      newErrors.staffPhone = "Phone must be in format +254XXXXXXXXX"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof BuildingFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const buildingData = {
        name: formData.name,
        address: formData.address,
        gps: formData.gps,
        owner: formData.owner || null,
        staffName: formData.staffName,
        staffPhone: formData.staffPhone,
        notes: formData.notes || null,
        images: uploadedImages,
        providers: selectedProviders,
        totalUnits: formData.totalUnits || 0,
        equipment: formData.equipment, // Add equipment here
        reversePoeSwitches: formData.reversePoeSwitches, // Added reversePoeSwitches
      }

      console.log("Sending buildingData:", buildingData); // Moved for debugging

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      const response = await fetch("/api/buildings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(buildingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create building")
      }

      toast({
        title: "Building Created",
        description: "New building has been successfully added.",
      })

      router.push("/buildings")
    } catch (error) {
      console.error("Error creating building:", error)
      setErrors({ api: (error instanceof Error) ? error.message : "An unexpected error occurred." })
      toast({
        title: "Error",
        description: (error instanceof Error) ? error.message : "Failed to create building. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) => (prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const file = files[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Image upload failed');
        }

        const data = await res.json();
        setUploadedImages((prev) => [...prev, data.image]);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Image upload failed. Please try again.",
          variant: "destructive",
        });
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationSearch = () => {
    if (formData.address) {
      // Simulate geocoding - in real app, use Google Maps API
      const mockCoordinates = {
        lat: -1.2921 + (Math.random() - 0.5) * 0.1,
        lng: 36.8219 + (Math.random() - 0.5) * 0.1,
      }
      setFormData((prev) => ({ ...prev, gps: mockCoordinates }))
    }
  }

  const handleAddEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: [
        ...prev.equipment,
        { deviceName: "", ipAddress: "", username: "", password: "", type: "Ubiquiti Antenna", serialNumber: "" },
      ],
    }));
    setShowPasswordStates((prev) => [...prev, false]);
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
    setShowPasswordStates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEquipmentChange = (index: number, field: keyof Equipment, value: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddReversePoeSwitch = () => {
    setFormData((prev) => ({
      ...prev,
      reversePoeSwitches: [
        ...prev.reversePoeSwitches,
        { serialNumber: "", notes: "" },
      ],
    }));
  };

  const handleRemoveReversePoeSwitch = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      reversePoeSwitches: prev.reversePoeSwitches.filter((_, i) => i !== index),
    }));
  };

  const handleReversePoeSwitchChange = (index: number, field: keyof ReversePoeSwitch, value: string) => {
    setFormData((prev) => ({
      ...prev,
      reversePoeSwitches: prev.reversePoeSwitches.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
      <Topbar />

      <div className="flex-1 p-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/buildings">
            <Button variant="ghost" size="icon" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-400">Add New Building</h1>
            <p className="text-lg text-zinc-400">Create a new building record with caretaker information</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {/* Basic Information */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription className="text-zinc-400">Enter the basic details about the building</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">Building Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., Sunrise Apartments"
                      className={`bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalUnits" className="text-zinc-300">Total Units</Label>
                    <Input
                      id="totalUnits"
                      type="number"
                      min="0"
                      value={formData.totalUnits || ""}
                      onChange={(e) => handleInputChange("totalUnits", Number(e.target.value) || 0)}
                      placeholder="50"
                      className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-zinc-300">Address *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="e.g., Kilimani, Nairobi"
                      className={`bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.address ? "border-red-500" : ""}`}
                    />
                    <Button type="button" variant="outline" onClick={handleLocationSearch} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700 rounded-lg">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  {formData.gps.lat !== 0 && formData.gps.lng !== 0 && (
                    <p className="text-sm text-zinc-400">
                      GPS: {formData.gps.lat.toFixed(4)}, {formData.gps.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner" className="text-zinc-300">Owner / Landlord Name</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => handleInputChange("owner", e.target.value)}
                    placeholder="Property owner name"
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Caretaker Information */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <User className="h-5 w-5" />
                  Caretaker / Agent Information
                </CardTitle>
                <CardDescription className="text-zinc-400">Contact details for the building caretaker or managing agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffName" className="text-zinc-300">Caretaker/Agent Name</Label>
                    <Input
                      id="staffName"
                      value={formData.staffName}
                      onChange={(e) => handleInputChange("staffName", e.target.value)}
                      placeholder="e.g., Peter Mwangi"
                      className={`bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.staffName ? "border-red-500" : ""}`}
                    />
                    {errors.staffName && <p className="text-sm text-red-500">{errors.staffName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffPhone" className="text-zinc-300">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        id="staffPhone"
                        value={formData.staffPhone}
                        onChange={(e) => handleInputChange("staffPhone", e.target.value)}
                        placeholder="+254712345678"
                        className={`pl-10 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.staffPhone ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.staffPhone && <p className="text-sm text-red-500">{errors.staffPhone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Building Images */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Camera className="h-5 w-5" />
                  Building Images
                </CardTitle>
                <CardDescription className="text-zinc-400">Upload images of the building (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="images"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-zinc-400" />
                        <p className="mb-2 text-sm text-zinc-400">
                          <span className="font-semibold">Click to upload</span> building images
                        </p>
                        <p className="text-xs text-zinc-400">PNG, JPG or JPEG (MAX. 5MB each)</p>
                      </div>
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={image ? `http://localhost:5000/${image}` : "/user-placeholder.png"}
                            alt={`Building image ${index + 1}`}
                            width={200} // Added width
                            height={150} // Added height
                            fill // Added fill prop
                            sizes="(max-width: 768px) 100vw, 200px" // Added sizes prop
                            className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Providers */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Globe className="h-5 w-5" />
                  Service Providers
                </CardTitle>
                <CardDescription className="text-zinc-400">Select which internet/TV providers are available in this building</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label className="text-zinc-300">Available Providers</Label>
                  <div className="flex flex-wrap gap-2">
                    {providerOptions.map((provider) => (
                      <Button
                        key={provider}
                        type="button"
                        variant={selectedProviders.includes(provider) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleProvider(provider)}
                        className={`h-8 ${selectedProviders.includes(provider) ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"}`}
                      >
                        {provider}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomProviderInput(true)}
                      className="h-8 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                    >
                      Add Custom
                    </Button>
                  </div>
                  {showCustomProviderInput && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customProvider}
                        onChange={(e) => setCustomProvider(e.target.value)}
                        placeholder="Enter custom provider"
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                      <Button type="button" onClick={handleAddCustomProvider} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Add
                      </Button>
                    </div>
                  )}
                  {selectedProviders.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedProviders.map((provider) => (
                        <Badge key={provider} variant="secondary" className="bg-zinc-800 text-white border border-zinc-700">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription className="text-zinc-400">Any additional notes or special information about the building</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-zinc-300">Description / Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    placeholder="Additional notes about the building, special instructions, access codes, etc."
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment Information */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Globe className="h-5 w-5" /> {/* Using Globe icon for now, can be changed */}
                  Rooftop Equipment
                </CardTitle>
                <CardDescription className="text-zinc-400">Details of network equipment installed on the rooftop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {formData.equipment.map((item, index) => (
                  <div key={index} className="border border-zinc-700 p-4 rounded-md space-y-3 relative">
                    <h4 className="font-semibold text-blue-300">Equipment #{index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`deviceName-${index}`} className="text-zinc-300">Device Name *</Label>
                        <Input
                          id={`deviceName-${index}`}
                          value={item.deviceName}
                          onChange={(e) => handleEquipmentChange(index, "deviceName", e.target.value)}
                          placeholder="e.g., Main Antenna 1"
                          required
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ipAddress-${index}`} className="text-zinc-300">IP Address</Label>
                        <Input
                          id={`ipAddress-${index}`}
                          value={item.ipAddress}
                          onChange={(e) => handleEquipmentChange(index, "ipAddress", e.target.value)}
                          placeholder="e.g., 192.168.1.1"
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`username-${index}`} className="text-zinc-300">Username</Label>
                        <Input
                          id={`username-${index}`}
                          value={item.username}
                          onChange={(e) => handleEquipmentChange(index, "username", e.target.value)}
                          placeholder="Login username"
                          autoComplete="off"
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`password-${index}`} className="text-zinc-300">Password</Label>
                        <div className="relative">
                          <Input
                            id={`password-${index}`}
                            type={showPasswordStates[index] ? "text" : "password"}
                            value={item.password}
                            onChange={(e) => handleEquipmentChange(index, "password", e.target.value)}
                            placeholder="Login password"
                            className="pr-10 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-1 text-zinc-400 hover:text-white"
                            onClick={() =>
                              setShowPasswordStates((prev) =>
                                prev.map((val, i) => (i === index ? !val : val))
                              )
                            }
                          >
                            {showPasswordStates[index] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`} className="text-zinc-300">Type</Label>
                      <Input
                        id={`type-${index}`}
                        value={item.type}
                        onChange={(e) => handleEquipmentChange(index, "type", e.target.value)}
                        placeholder="e.g., Ubiquiti Antenna"
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`serialNumber-${index}`} className="text-zinc-300">Serial Number</Label>
                      <Input
                        id={`serialNumber-${index}`}
                        value={item.serialNumber || ""}
                        onChange={(e) => handleEquipmentChange(index, "serialNumber", e.target.value)}
                        placeholder="e.g., SN123456789"
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveEquipment(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddEquipment} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700 rounded-lg">
                  <LucidePlus className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
              </CardContent>
            </Card>

            {/* Reverse PoE Switches Information */}
            <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Globe className="h-5 w-5" /> {/* Using Globe icon for now, can be changed */}
                  Reverse PoE Switches
                </CardTitle>
                <CardDescription className="text-zinc-400">Details of Reverse PoE Switches installed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {formData.reversePoeSwitches.map((item, index) => (
                  <div key={index} className="border border-zinc-700 p-4 rounded-md space-y-3 relative">
                    <h4 className="font-semibold text-blue-300">Switch #{index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`serialNumber-${index}`} className="text-zinc-300">Serial Number</Label>
                        <Input
                          id={`serialNumber-${index}`}
                          value={item.serialNumber}
                          onChange={(e) => handleReversePoeSwitchChange(index, "serialNumber", e.target.value)}
                          placeholder="e.g., SN12345"
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${index}`} className="text-zinc-300">Notes</Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={item.notes || ""}
                        onChange={(e) => handleReversePoeSwitchChange(index, "notes", e.target.value)}
                        placeholder="Add any relevant notes about this switch"
                        rows={2}
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveReversePoeSwitch(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddReversePoeSwitch} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700 rounded-lg">
                  <LucidePlus className="mr-2 h-4 w-4" /> Add Reverse PoE Switch
                </Button>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-800">
              <Link href="/buildings">
                <Button type="button" variant="outline" disabled={isSubmitting} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Building...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Building
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}