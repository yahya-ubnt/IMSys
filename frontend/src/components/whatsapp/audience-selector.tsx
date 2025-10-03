"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
// Assume similar components and services exist or will be created
// import { UserMultiSelect } from "@/components/user-multi-select" 
// import { getMikrotikRouters } from "@/services/mikrotikService"
// import { getBuildings } from "@/services/buildingService"

export function AudienceSelector({ onAudienceChange }) {
  const { token } = useAuth()
  const [sendToType, setSendToType] = useState("users")
  
  // Data for dropdowns
  const [users, setUsers] = useState([])
  const [routers, setRouters] = useState([])
  const [buildings, setBuildings] = useState([])

  // Selected values
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedRouterId, setSelectedRouterId] = useState("")
  const [selectedBuildingId, setSelectedBuildingId] = useState("")
  const [unregisteredNumber, setUnregisteredNumber] = useState("")

  // Fetch data for selectors
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      // const [routersData, buildingsData] = await Promise.all([
      //   getMikrotikRouters(token),
      //   getBuildings(token),
      // ])
      // setRouters(routersData)
      // setBuildings(buildingsData)
    }
    fetchData()
  }, [token])

  // Notify parent component of changes
  useEffect(() => {
    let audienceData = { sendToType }
    switch (sendToType) {
      case "users":
        audienceData.userIds = selectedUserIds
        break
      case "mikrotikGroup":
        audienceData.mikrotikRouterId = selectedRouterId
        break
      case "location":
        audienceData.buildingId = selectedBuildingId
        break
      case "unregistered":
        audienceData.unregisteredMobileNumber = unregisteredNumber
        break
    }
    onAudienceChange(audienceData)
  }, [sendToType, selectedUserIds, selectedRouterId, selectedBuildingId, unregisteredNumber, onAudienceChange])

  return (
    <div className="space-y-6">
      <RadioGroup value={sendToType} onValueChange={setSendToType} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["users", "mikrotikGroup", "location", "unregistered"].map(type => (
          <div key={type}>
            <RadioGroupItem value={type} id={type} className="peer sr-only" />
            <Label htmlFor={type} className="flex flex-col items-center justify-between rounded-md border-2 border-zinc-700 bg-transparent p-4 hover:bg-zinc-800 hover:text-accent-foreground peer-data-[state=checked]:border-cyan-500 [&:has([data-state=checked])]:border-cyan-500 cursor-pointer">
              <span className="text-sm font-medium capitalize">{type.replace("mikrotikGroup", "Mikrotik Group")}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="pt-4 border-t border-zinc-800">
        {/* Render inputs based on selection */}
        <p className="text-zinc-400">Audience selection inputs will appear here based on the choice above.</p>
      </div>
    </div>
  )
}