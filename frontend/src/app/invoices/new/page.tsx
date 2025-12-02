"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, PlusCircle, CalendarIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// --- TYPE DEFINITIONS ---
interface MikrotikUser {
  _id: string;
  officialName: string;
  mobileNumber: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoiceFormData {
  mikrotikUserId: string;
  dueDate?: Date;
  items: InvoiceItem[];
}

// --- MAIN COMPONENT ---
export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<InvoiceFormData>({
    mikrotikUserId: '',
    items: [{ description: '', amount: 0 }],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [mikrotikUsers, setMikrotikUsers] = useState<MikrotikUser[]>([])

  const fetchMikrotikUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // This should be moved to a service file like /lib/mikrotikUserService.ts
      const res = await fetch('/api/mikrotik/users');
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();
      setMikrotikUsers(users);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch client data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMikrotikUsers();
  }, [fetchMikrotikUsers]);

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = [...formData.items];
    const field = e.target.name as keyof InvoiceItem;
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', amount: 0 }] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.mikrotikUserId || !formData.dueDate || totalAmount <= 0 || formData.items.some(i => !i.description)) {
        toast({ title: 'Missing Fields', description: 'Please select a client, a due date, and ensure all items have a description and the total is greater than zero.', variant: 'destructive' })
        return;
    }
    setIsLoading(true)
    try {
      // This should be moved to a service file like /lib/invoiceService.ts
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            amount: totalAmount,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invoice.");
      }
      toast({ title: 'Invoice Created', description: 'New manual invoice has been successfully created.' })
      router.push('/invoices')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Create Manual Invoice</h1>
            <p className="text-sm text-zinc-400">Create a one-off invoice for a customer.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/invoices')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-4xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400">Invoice Details</CardTitle>
              <CardDescription className="text-zinc-400">Fill in the details to create a new manual invoice.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="selectClient" className="text-zinc-300">Select Client *</Label>
                    <Select name="selectClient" value={formData.mikrotikUserId} onValueChange={(value) => setFormData({...formData, mikrotikUserId: value})}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue placeholder="Select a client" /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {mikrotikUsers.map((user) => <SelectItem key={user._id} value={user._id}>{user.officialName} ({user.mobileNumber})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-zinc-300">Due Date *</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700", !formData.dueDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.dueDate} onSelect={(date) => setFormData({...formData, dueDate: date})} initialFocus /></PopoverContent>
                      </Popover>
                  </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-zinc-300">Invoice Items</Label>
                    {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Input name="description" placeholder="Item description" value={item.description} onChange={(e) => handleItemChange(index, e)} className="bg-zinc-800 border-zinc-700 flex-grow" />
                            <Input name="amount" type="number" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(index, e)} className="bg-zinc-800 border-zinc-700 w-32" />
                            {formData.items.length > 1 && (
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="bg-transparent border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                </div>

                <div className="text-right text-lg font-bold text-cyan-400">
                    Total Amount: {new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(totalAmount)}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isLoading ? 'Creating...' : 'Create Invoice'}
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
