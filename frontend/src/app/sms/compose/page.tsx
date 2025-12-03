"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Topbar } from "@/components/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Router, Building, Phone, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type User = {
  _id: string
  officialName: string
  expiryDate: string;
}

type MikrotikRouter = {
  _id: string
  name: string
}

interface MikrotikUser {
  _id: string;
  officialName: string;
  apartment_house_number?: string;
}

const TABS = [
    { id: "users", label: "Users", icon: Users },
    { id: "mikrotik", label: "Mikrotik Group", icon: Router },
    { id: "location", label: "Location", icon: Building },
    { id: "unregistered", label: "Unregistered", icon: Phone },
];

export default function ComposeSmsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [mikrotikRouters, setMikrotikRouters] = useState<MikrotikRouter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  const [message, setMessage] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedRouters, setSelectedRouters] = useState<string[]>([])
  const [selectedApartmentHouseNumbers, setSelectedApartmentHouseNumbers] = useState<string[]>([])
  const [unregisteredPhone, setUnregisteredPhone] = useState("")
  const [apartmentHouseNumbers, setApartmentHouseNumbers] = useState<string[]>([])
  const [sendToActiveOnly, setSendToActiveOnly] = useState(false);
  const [sendToExpiredOnly, setSendToExpiredOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [usersRes, routersRes, mikrotikUsersRes] = await Promise.all([
          fetch("/api/mikrotik/users/clients-for-sms"),
          fetch("/api/mikrotik/routers"),
          fetch("/api/mikrotik/users"),
        ])

        if (!usersRes.ok || !routersRes.ok || !mikrotikUsersRes.ok) {
          throw new Error("Failed to fetch required data")
        }

        const mikrotikUsersData = await mikrotikUsersRes.json();
        setUsers(await usersRes.json())
        setMikrotikRouters(await routersRes.json())

        const uniqueApartmentHouseNumbers = Array.from(new Set(mikrotikUsersData.map((user: MikrotikUser) => user.apartment_house_number).filter(Boolean)));
        setApartmentHouseNumbers(uniqueApartmentHouseNumbers as string[]);

      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const userOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    let filtered = users;
    if (sendToActiveOnly) {
      filtered = users.filter(user => user.expiryDate && new Date(user.expiryDate) >= today);
    } else if (sendToExpiredOnly) {
      filtered = users.filter(user => user.expiryDate && new Date(user.expiryDate) < today);
    }
    return filtered.map(user => ({ value: user._id, label: user.officialName }));
  }, [users, sendToActiveOnly, sendToExpiredOnly]);

  const routerOptions = mikrotikRouters.map(router => ({ value: router._id, label: router.name }));
  const locationOptions = apartmentHouseNumbers.map(ahn => ({ value: ahn, label: ahn }));

  const handleSelectAllUsers = (isChecked: boolean | 'indeterminate') => {
    if (isChecked) {
      setSendToActiveOnly(false);
      setSendToExpiredOnly(false);
      setSelectedUsers(userOptions.map(u => u.value));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleActiveOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToActiveOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToExpiredOnly(false); // Uncheck the other filter
      const activeUserIds = users
        .filter(user => user.expiryDate && new Date(user.expiryDate) >= today)
        .map(user => user._id);
      setSelectedUsers(activeUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleExpiredOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToExpiredOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToActiveOnly(false); // Uncheck the other filter
      const expiredUserIds = users
        .filter(user => user.expiryDate && new Date(user.expiryDate) < today)
        .map(user => user._id);
      setSelectedUsers(expiredUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllRouters = (isChecked: boolean | 'indeterminate') => {
    if (isChecked) {
      setSelectedRouters(routerOptions.map(r => r.value));
    } else {
      setSelectedRouters([]);
    }
  };

  const handleSelectAllLocations = (isChecked: boolean | 'indeterminate') => {
    if (isChecked) {
      setSelectedApartmentHouseNumbers(locationOptions.map(l => l.value));
    } else {
      setSelectedApartmentHouseNumbers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let payload: { 
      message: string; 
      sendToType: string; 
      userIds?: string[]; 
      mikrotikRouterIds?: string[]; 
      apartmentHouseNumbers?: string[]; 
      unregisteredMobileNumber?: string; 
    } = { message, sendToType: activeTab }

    switch (activeTab) {
      case "users":
        payload.userIds = selectedUsers;
        break
      case "mikrotik":
        payload.mikrotikRouterIds = selectedRouters;
        break
      case "location":
        payload.apartmentHouseNumbers = selectedApartmentHouseNumbers;
        break
      case "unregistered":
        payload.unregisteredMobileNumber = unregisteredPhone;
        break
      default:
        toast({ title: "Error", description: "Invalid recipient group.", variant: "destructive" })
        setIsSubmitting(false)
        return
    }

    try {
      const response = await fetch("/api/sms/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send SMS")
      }

      toast({ title: "SMS Sent", description: "Your message has been queued for sending." })
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      toast({
        title: "Error Sending SMS",
        description: (error instanceof Error) ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Compose New SMS</h1>
            <p className="text-sm text-zinc-400">Send a message to your users or custom groups.</p>
          </div>
        </div>

        <div
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl"
        >
          <Card className="bg-transparent border-none text-white">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-zinc-300">Recipient Group</Label>
                  <div className="relative flex flex-wrap items-center justify-start p-1 bg-zinc-800/70 border border-zinc-700 rounded-lg gap-2">
                      {TABS.map((tab) => (
                          <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveTab(tab.id)}
                              className={'relative rounded-md px-4 py-2 text-sm font-medium text-white transition focus-visible:outline-2 text-center' + (activeTab === tab.id ? "" : " hover:text-white/60")}
                              style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                              {activeTab === tab.id && (
                                  <span
                                      className="absolute inset-0 z-10 bg-blue-600/40"
                                      style={{ borderRadius: 6 }}
                                  />
                              )}
                              <div className="relative z-20 flex items-center justify-center">
                                  <tab.icon className="mr-2 h-4 w-4" />
                                  {tab.label}
                              </div>
                          </button>
                      ))}
                  </div>
                </div>

                <div className="relative min-h-[120px]">
                  <div
                    className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50"
                  >
                      {activeTab === "users" && (
                              <div className="space-y-2">
                                  <Label htmlFor="users" className="text-zinc-300">Select User(s)</Label>
                                  <MultiSelect
                                    options={userOptions}
                                    onValueChange={setSelectedUsers}
                                    value={selectedUsers}
                                    placeholder="Select users..."
                                    className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                  />
                                  <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                      id="select-all-users"
                                      onCheckedChange={handleSelectAllUsers}
                                      checked={!sendToActiveOnly && !sendToExpiredOnly && selectedUsers.length === userOptions.length && userOptions.length > 0}
                                    />
                                    <Label htmlFor="select-all-users" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Send to all users
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                      id="send-to-active"
                                      onCheckedChange={handleActiveOnlyChange}
                                      checked={sendToActiveOnly}
                                    />
                                    <Label htmlFor="send-to-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Send to active users only
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                      id="send-to-expired"
                                      onCheckedChange={handleExpiredOnlyChange}
                                      checked={sendToExpiredOnly}
                                    />
                                    <Label htmlFor="send-to-expired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Send to expired users only
                                    </Label>
                                  </div>
                              </div>
                          )}
                          {activeTab === "mikrotik" && (
                              <div className="space-y-2">
                                  <Label htmlFor="mikrotik-router" className="text-zinc-300">Select Mikrotik Router(s)</Label>
                                   <MultiSelect
                                    options={routerOptions}
                                    onValueChange={setSelectedRouters}
                                    value={selectedRouters}
                                    placeholder="Select routers..."
                                    className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                  />
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox
                                      id="select-all-routers"
                                      onCheckedChange={handleSelectAllRouters}
                                      checked={selectedRouters.length === routerOptions.length && routerOptions.length > 0}
                                    />
                                    <Label htmlFor="select-all-routers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Send to all routers
                                    </Label>
                                  </div>
                              </div>
                          )}
                          {activeTab === "location" && (
                              <div className="space-y-2">
                                  <Label htmlFor="location" className="text-zinc-300">Select Apartment/House Number(s)</Label>
                                  <MultiSelect
                                    options={locationOptions}
                                    onValueChange={setSelectedApartmentHouseNumbers}
                                    value={selectedApartmentHouseNumbers}
                                    placeholder="Select locations..."
                                    className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                  />
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox
                                      id="select-all-locations"
                                      onCheckedChange={handleSelectAllLocations}
                                      checked={selectedApartmentHouseNumbers.length === locationOptions.length && locationOptions.length > 0}
                                    />
                                    <Label htmlFor="select-all-locations" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      Send to all locations
                                    </Label>
                                  </div>
                              </div>
                          )}
                          {activeTab === "unregistered" && (
                              <div className="space-y-2">
                                  <Label htmlFor="unregistered-phone" className="text-zinc-300">Recipient Phone Number</Label>
                                  <Input id="unregistered-phone" value={unregisteredPhone} onChange={(e) => setUnregisteredPhone(e.target.value)} placeholder="Enter phone number, e.g., 2547..." className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                              </div>
                          )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-zinc-300">Message</Label>
                  <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Type your message here..." className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-zinc-800">
                  <Button type="submit" disabled={isSubmitting || isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100">
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
