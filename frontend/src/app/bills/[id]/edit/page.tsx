'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getBillById, updateBill } from '@/lib/billService';
import { Bill } from '@/types/bill';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function EditBillPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: '',
    status: '',
    paymentDate: '',
    method: '',
    transactionMessage: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Bill ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getBillById(id as string, token);
        setFormData({
          name: data.name,
          amount: data.amount.toString(),
          dueDate: data.dueDate.toString(),
          category: data.category,
          status: data.status,
          paymentDate: data.paymentDate ? format(new Date(data.paymentDate), 'yyyy-MM-dd') : '',
          method: data.method || '',
          transactionMessage: data.transactionMessage || '',
          description: data.description || '',
        });
      } catch (err) {
        let errorMessage = 'Failed to fetch bill details for editing.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [id, token, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, paymentDate: date ? format(date, 'yyyy-MM-dd') : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!token) {
      setError('Authentication token not found. Please log in.');
      setSubmitting(false);
      return;
    }

    try {
      const billData: Partial<Bill> = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: parseInt(formData.dueDate),
        category: formData.category as 'Personal' | 'Company',
        status: formData.status as 'Paid' | 'Not Paid',
        description: formData.description,
      };

      if (billData.status === 'Paid') {
        billData.paymentDate = formData.paymentDate ? new Date(formData.paymentDate) : new Date();
        billData.method = formData.method as 'M-Pesa' | 'Bank' | 'Cash';
        billData.transactionMessage = formData.transactionMessage;
      } else {
        billData.paymentDate = undefined;
        billData.method = undefined;
        billData.transactionMessage = undefined;
      }

      await updateBill(id as string, billData, token);
      toast({
        title: 'Bill Updated',
        description: 'Bill has been successfully updated.',
      });
      router.push(`/bills/${id}?refresh=${Date.now()}`); // ADD THIS LINE to force re-fetch on the target page
    } catch (err) {
      let errorMessage = 'Failed to update bill.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading bill for editing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error: {error}</p>
            <Button onClick={() => router.push('/bills/personal')} className="mt-4">Back to Bills</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Bill</h1>
            <p className="text-muted-foreground">Modify the details of this bill.</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bill Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Rent, Electricity"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KSh)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15000.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g., 5 (for 5th of month)"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input value={formData.category} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Paid">Not Paid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.status === 'Paid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.paymentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.paymentDate ? format(new Date(formData.paymentDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.paymentDate ? new Date(formData.paymentDate) : undefined}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select name="method" value={formData.method} onValueChange={(value) => handleSelectChange('method', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transactionMessage">Transaction Message</Label>
                    <Textarea
                      id="transactionMessage"
                      name="transactionMessage"
                      placeholder="Paste the full transaction message here..."
                      value={formData.transactionMessage}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Monthly office rent for July"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/bills/${id}`)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Bill'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
