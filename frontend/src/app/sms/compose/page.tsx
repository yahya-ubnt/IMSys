"use client"

import { useState, useEffect, useMemo } from "react"
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

type Building = {
  _id: string;
  name: string;
}

const TABS = [
    { id: "users", label: "Users", icon: Users },
    { id: "mikrotik", label: "Mikrotik Group", icon: Router },
    { id: "building", label: "Building", icon: Building },
    { id: "unregistered", label: "Unregistered", icon: Phone },
];

export default function ComposeSmsPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [mikrotikRouters, setMikrotikRouters] = useState<MikrotikRouter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  const [message, setMessage] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedRouters, setSelectedRouters] = useState<string[]>([])
  const [unregisteredPhone, setUnregisteredPhone] = useState("")
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
  const [sendToActiveOnly, setSendToActiveOnly] = useState(false);
  const [sendToExpiredOnly, setSendToExpiredOnly] = useState(false);
  const [sendToMikrotikActiveOnly, setSendToMikrotikActiveOnly] = useState(false);
  const [sendToMikrotikExpiredOnly, setSendToMikrotikExpiredOnly] = useState(false);
  const [mikrotikUsersForSelectedRouters, setMikrotikUsersForSelectedRouters] = useState<User[]>([]);
  const [sendToBuildingActiveOnly, setSendToBuildingActiveOnly] = useState(false);
  const [sendToBuildingExpiredOnly, setSendToBuildingExpiredOnly] = useState(false);
  const [mikrotikUsersForSelectedBuildings, setMikrotikUsersForSelectedBuildings] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [usersRes, routersRes, buildingsRes] = await Promise.all([
          fetch("/api/mikrotik/users/clients-for-sms"),
          fetch("/api/mikrotik/routers"),
          fetch("/api/buildings"), // Fetch buildings
        ])

        if (!usersRes.ok || !routersRes.ok || !buildingsRes.ok) {
          throw new Error("Failed to fetch required data")
        }

        setUsers(await usersRes.json())
        setMikrotikRouters(await routersRes.json())
        setBuildings((await buildingsRes.json()).data) // Set buildings

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

  useEffect(() => {
    const fetchMikrotikUsersByRouters = async () => {
      if (selectedRouters.length === 0) {
        setMikrotikUsersForSelectedRouters([]);
        return;
      }
      try {
        const response = await fetch("/api/mikrotik/users/by-routers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routerIds: selectedRouters }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch MikroTik users by routers");
        }
        const data = await response.json();
        setMikrotikUsersForSelectedRouters(data);
      } catch (error) {
        console.error("Error fetching MikroTik users by routers:", error);
        toast({
          title: "Error",
          description: "Failed to load MikroTik users for selected routers.",
          variant: "destructive",
        });
      }
    };

    fetchMikrotikUsersByRouters();
  }, [selectedRouters, toast]);

  useEffect(() => {
    const fetchMikrotikUsersByBuildings = async () => {
      if (selectedBuildings.length === 0) {
        setMikrotikUsersForSelectedBuildings([]);
        return;
      }
      try {
        const response = await fetch("/api/mikrotik/users/by-buildings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buildingIds: selectedBuildings }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch MikroTik users by buildings");
        }
        const data = await response.json();
        setMikrotikUsersForSelectedBuildings(data);
      } catch (error) {
        console.error("Error fetching MikroTik users by buildings:", error);
        toast({
          title: "Error",
          description: "Failed to load MikroTik users for selected buildings.",
          variant: "destructive",
        });
      }
    };

    fetchMikrotikUsersByBuildings();
  }, [selectedBuildings, toast]);

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
  const buildingOptions = buildings.map(building => ({ value: building._id, label: building.name }));

  const mikrotikUserOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = mikrotikUsersForSelectedRouters;
    if (sendToMikrotikActiveOnly) {
      filtered = mikrotikUsersForSelectedRouters.filter(user => user.expiryDate && new Date(user.expiryDate) >= today);
    } else if (sendToMikrotikExpiredOnly) {
      filtered = mikrotikUsersForSelectedRouters.filter(user => user.expiryDate && new Date(user.expiryDate) < today);
    }
    return filtered.map(user => ({ value: user._id, label: user.officialName }));
  }, [mikrotikUsersForSelectedRouters, sendToMikrotikActiveOnly, sendToMikrotikExpiredOnly]);

  const buildingUserOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = mikrotikUsersForSelectedBuildings;
    if (sendToBuildingActiveOnly) {
      filtered = mikrotikUsersForSelectedBuildings.filter(user => user.expiryDate && new Date(user.expiryDate) >= today);
    } else if (sendToBuildingExpiredOnly) {
      filtered = mikrotikUsersForSelectedBuildings.filter(user => user.expiryDate && new Date(user.expiryDate) < today);
    }
    return filtered.map(user => ({ value: user._id, label: user.officialName }));
  }, [mikrotikUsersForSelectedBuildings, sendToBuildingActiveOnly, sendToBuildingExpiredOnly]);

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

  const handleSelectAllMikrotikUsers = (isChecked: boolean | 'indeterminate') => {
    if (isChecked) {
      setSendToMikrotikActiveOnly(false);
      setSendToMikrotikExpiredOnly(false);
      setSelectedUsers(mikrotikUserOptions.map(u => u.value));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleMikrotikActiveOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToMikrotikActiveOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToMikrotikExpiredOnly(false); // Uncheck the other filter
      const activeUserIds = mikrotikUsersForSelectedRouters
        .filter(user => user.expiryDate && new Date(user.expiryDate) >= today)
        .map(user => user._id);
      setSelectedUsers(activeUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleMikrotikExpiredOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToMikrotikExpiredOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToMikrotikActiveOnly(false); // Uncheck the other filter
      const expiredUserIds = mikrotikUsersForSelectedRouters
        .filter(user => user.expiryDate && new Date(user.expiryDate) < today)
        .map(user => user._id);
      setSelectedUsers(expiredUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllBuildingUsers = (isChecked: boolean | 'indeterminate') => {
    if (isChecked) {
      setSendToBuildingActiveOnly(false);
      setSendToBuildingExpiredOnly(false);
      setSelectedUsers(buildingUserOptions.map(u => u.value));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBuildingActiveOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToBuildingActiveOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToBuildingExpiredOnly(false); // Uncheck the other filter
      const activeUserIds = mikrotikUsersForSelectedBuildings
        .filter(user => user.expiryDate && new Date(user.expiryDate) >= today)
        .map(user => user._id);
      setSelectedUsers(activeUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBuildingExpiredOnlyChange = (isChecked: boolean | 'indeterminate') => {
    const checked = !!isChecked;
    setSendToBuildingExpiredOnly(checked);
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSendToBuildingActiveOnly(false); // Uncheck the other filter
      const expiredUserIds = mikrotikUsersForSelectedBuildings
        .filter(user => user.expiryDate && new Date(user.expiryDate) < today)
        .map(user => user._id);
      setSelectedUsers(expiredUserIds);
    } else {
      setSelectedUsers([]);
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
            buildingIds?: string[];
            unregisteredMobileNumber?: string;    } = { message, sendToType: activeTab }

    switch (activeTab) {
      case "users":
        payload.userIds = selectedUsers;
        break
      case "mikrotik":
        payload.userIds = selectedUsers;
        payload.mikrotikRouterIds = selectedRouters;
        break
      case "building":
        payload.userIds = selectedUsers;
        payload.buildingIds = selectedBuildings;
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
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);
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
                              onClick={() => {
                                  setActiveTab(tab.id);
                                  // Reset selected users and filters when changing tabs
                                  setSelectedUsers([]);
                                  setSendToActiveOnly(false);
                                  setSendToExpiredOnly(false);
                                  setSendToMikrotikActiveOnly(false);
                                  setSendToMikrotikExpiredOnly(false);
                              }}
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
                                    <div className="space-y-2 pt-2">
                                      <Label htmlFor="mikrotik-users" className="text-zinc-300">Select User(s) in selected routers</Label>
                                      <MultiSelect
                                        options={mikrotikUserOptions}
                                        onValueChange={setSelectedUsers}
                                        value={selectedUsers}
                                        placeholder="Select users..."
                                        className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                      />
                                      <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                          id="select-all-mikrotik-users"
                                          onCheckedChange={handleSelectAllMikrotikUsers}
                                          checked={!sendToMikrotikActiveOnly && !sendToMikrotikExpiredOnly && selectedUsers.length === mikrotikUserOptions.length && mikrotikUserOptions.length > 0}
                                        />
                                        <Label htmlFor="select-all-mikrotik-users" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          Send to all users in selected MikroTik routers
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                          id="send-to-mikrotik-active"
                                          onCheckedChange={handleMikrotikActiveOnlyChange}
                                          checked={sendToMikrotikActiveOnly}
                                        />
                                        <Label htmlFor="send-to-mikrotik-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          Send to active users in selected MikroTik routers only
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                          id="send-to-mikrotik-expired"
                                          onCheckedChange={handleMikrotikExpiredOnlyChange}
                                          checked={sendToMikrotikExpiredOnly}
                                        />
                                        <Label htmlFor="send-to-mikrotik-expired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          Send to expired users in selected MikroTik routers only
                                        </Label>
                                      </div>
                                    </div>
                              </div>
                          )}
                          {activeTab === "building" && (
                              <div className="space-y-2">
                                  <Label htmlFor="building" className="text-zinc-300">Select Building(s)</Label>
                                  <MultiSelect
                                    options={buildingOptions}
                                    onValueChange={setSelectedBuildings}
                                    value={selectedBuildings}
                                    placeholder="Select buildings..."
                                    className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                  />
                                  <div className="space-y-2 pt-2">
                                    <Label htmlFor="building-users" className="text-zinc-300">Select User(s) in selected buildings</Label>
                                    <MultiSelect
                                      options={buildingUserOptions}
                                      onValueChange={setSelectedUsers}
                                      value={selectedUsers}
                                      placeholder="Select users..."
                                      className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                                    />
                                    <div className="flex items-center space-x-2 pt-2">
                                      <Checkbox
                                        id="select-all-building-users"
                                        onCheckedChange={handleSelectAllBuildingUsers}
                                        checked={!sendToBuildingActiveOnly && !sendToBuildingExpiredOnly && selectedUsers.length === buildingUserOptions.length && buildingUserOptions.length > 0}
                                      />
                                      <Label htmlFor="select-all-building-users" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Send to all users in selected Building(s)
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                      <Checkbox
                                        id="send-to-building-active"
                                        onCheckedChange={handleBuildingActiveOnlyChange}
                                        checked={sendToBuildingActiveOnly}
                                      />
                                      <Label htmlFor="send-to-building-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Send to active users in selected Building(s) only
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                      <Checkbox
                                        id="send-to-building-expired"
                                        onCheckedChange={handleBuildingExpiredOnlyChange}
                                        checked={sendToBuildingExpiredOnly}
                                      />
                                      <Label htmlFor="send-to-building-expired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Send to expired users in selected Building(s) only
                                      </Label>
                                    </div>
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
