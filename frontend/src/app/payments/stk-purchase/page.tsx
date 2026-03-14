"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, DollarSign, User, Package as PackageIcon, Phone } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface User {
  _id: string;
  officialName: string;
  username: string;
  mobileNumber: string;
  package?: { _id: string; price: number; };
}
interface Package {
  _id: string;
  name: string;
  price: number;
  durationInDays: number;
}

// --- MAIN COMPONENT ---
export default function StkPurchasePage() {
  const { toast } = useToast()

  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [usersRes, packagesRes] = await Promise.all([
          fetch('/api/mikrotik/users'),
          fetch('/api/mikrotik/packages')
        ]);
        if (!usersRes.ok) throw new Error('Failed to fetch users.');
        if (!packagesRes.ok) throw new Error('Failed to fetch packages.');
        setUsers(await usersRes.json());
        setPackages(await packagesRes.json());
      } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  // --- EVENT HANDLERS ---
  const handleUserSelect = () => {
    if (!selectedUserId) return toast({ title: 'Error', description: 'Please select a user.', variant: 'destructive' })
    const user = users.find(u => u._id === selectedUserId)
    setSelectedUser(user || null)
    setPhoneNumber(user?.mobileNumber || '')

    // Auto-select package and set amount if user has a current package
    if (user?.package?._id) {
      const userPackage = packages.find(p => p._id === user.package?._id);
      if (userPackage) {
        setSelectedPackageId(userPackage._id);
        setAmount(userPackage.price.toString());
      }
    } else {
      setSelectedPackageId(null);
      setAmount('');
    }
  }

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    const pkg = packages.find(p => p._id === packageId);
    setAmount(pkg?.price?.toString() || '');
  }

  const handleInitiateStkPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !selectedPackageId) {
      toast({ title: 'Error', description: 'Please select a user and a package.', variant: 'destructive' })
      return;
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payments/initiate-stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phoneNumber,
          accountReference: selectedUser.username,
          packageId: selectedPackageId,
        }),
      })
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to initiate STK push.')
      
      const data = await response.json();
      toast({ title: 'Success', description: `STK Push initiated for ${selectedUser.officialName}. (CheckoutID: ${data.CheckoutRequestID})` })
      // Reset form
      setSelectedUser(null)
      setSelectedUserId(null)
      setSelectedPackageId(null)
      setAmount('')
      setPhoneNumber('')
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Initiate STK Purchase</h1>
            <p className="text-sm text-zinc-400">Select a user and package to send a payment prompt.</p>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-2xl mx-auto">
          <Card className="bg-transparent border-none">
            <AnimatePresence mode="wait">
              {!selectedUser ? (
                <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2"><User className="w-5 h-5" /> Select User</CardTitle>
                    <CardDescription className="text-zinc-400">Choose the user to send the payment prompt to.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select" className="text-zinc-300">User</Label>
                      <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
                        <SelectTrigger id="user-select" className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
                          <SelectValue placeholder="Select a user..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                          {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                           users.map(user => <SelectItem key={user._id} value={user._id}>{user.officialName} ({user.username})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUserSelect} disabled={!selectedUserId || isLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                      <Search className="mr-2 h-4 w-4" /> Continue to Payment
                    </Button>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-cyan-400 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Initiate Payment</CardTitle>
                        <CardDescription className="text-zinc-400">For {selectedUser.officialName}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent border-zinc-700 hover:bg-zinc-800" onClick={() => setSelectedUser(null)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Change User
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInitiateStkPush} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-zinc-800/50 rounded-lg">
                        <div><Label className="text-xs text-zinc-400">Account #</Label><p className="font-mono text-sm">{selectedUser.username}</p></div>
                        <div><Label className="text-xs text-zinc-400">Current Mobile #</Label><p className="font-mono text-sm">{selectedUser.mobileNumber}</p></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="package-select" className="text-zinc-300">Package</Label>
                          <Select onValueChange={handlePackageSelect} value={selectedPackageId || ''} required>
                            <SelectTrigger id="package-select" className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
                              <SelectValue placeholder="Select a package..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                              {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                              packages.map(pkg => <SelectItem key={pkg._id} value={pkg._id}>{pkg.name} (KES {pkg.price})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-zinc-300">Amount</Label>
                          <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-zinc-300">Phone Number for STK</Label>
                        <Input id="phoneNumber" type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="e.g. 2547..." className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                      </div>
                      <div className="pt-4 border-t border-zinc-800 flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !selectedPackageId} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                          {isSubmitting ? 'Initiating...' : 'Initiate STK Push'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
