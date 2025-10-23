'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getTransactionById, updateTransaction } from '@/lib/transactionService';

import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function EditTransactionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    transactionId: string;
    transactionDate: string;
    transactionTime: string;
    amount: string;
    method: "M-Pesa" | "Bank" | "Cash" | "";
    transactionMessage: string;
    description: string;
    label: string;
    receiverEntity: string;
    phoneNumber: string;
  }>({
    transactionId: '',
    transactionDate: '',
    transactionTime: '',
    amount: '',
    method: '',
    transactionMessage: '',
    description: '',
    label: '',
    receiverEntity: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionCategory, setTransactionCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) {
        setError('Transaction ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getTransactionById(id as string);
        setFormData({
          amount: data.amount.toString(),
          method: data.method,
          transactionMessage: data.transactionMessage,
          description: data.description,
          label: data.label,
          transactionId: data.transactionId || '',
          transactionDate: data.date ? format(new Date(data.date), 'yyyy-MM-dd') : '',
          transactionTime: data.date ? format(new Date(data.date), 'HH:mm') : '',
          receiverEntity: data.senderReceiverName || '',
          phoneNumber: data.phoneNumber || '',
        });
        setTransactionCategory(data.category || null); // Store the category
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch transaction details for editing.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch transaction details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date: Date | undefined, name: string) => {
    setFormData({ ...formData, [name]: date ? format(date, 'yyyy-MM-dd') : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const dailyTransactionData = {
        ...formData,
        date: formData.transactionDate, // Map new transactionDate to old date field
        amount: parseFloat(formData.amount), // Ensure amount is parsed as float
        method: formData.method === "" ? undefined : formData.method,
      };
      await updateTransaction(id as string, dailyTransactionData);
      toast({
        title: 'Transaction Updated',
        description: 'Transaction has been successfully updated.',
      });
      router.push(`/transactions/${(transactionCategory || 'personal').toLowerCase()}`);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to update transaction.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to update transaction. Please try again.',
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
            <p className="mt-2 text-muted-foreground">Loading transaction for editing...</p>
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
            <Button onClick={() => router.push('/transactions/personal')} className="mt-4">Back to Transactions</Button>
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
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push(`/transactions/${(transactionCategory || 'personal').toLowerCase()}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
              <p className="text-muted-foreground">Modify the details of this transaction.</p>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    name="transactionId"
                    placeholder="e.g., TI14UTFYYW"
                    value={formData.transactionId}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Transaction Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.transactionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.transactionDate ? format(new Date(formData.transactionDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.transactionDate ? new Date(formData.transactionDate) : undefined}
                        onSelect={(date) => handleDateChange(date, 'transactionDate')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionTime">Transaction Time</Label>
                  <Input
                    id="transactionTime"
                    name="transactionTime"
                    placeholder="e.g., 9:12 AM"
                    value={formData.transactionTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 110.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiverEntity">Receiver/Entity Name</Label>
                  <Input
                    id="receiverEntity"
                    name="receiverEntity"
                    placeholder="e.g., EBRAHIM ISMAIL"
                    value={formData.receiverEntity}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="e.g., 0722645080"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select name="method" value={formData.method} onValueChange={(value) => handleSelectChange('method', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label/Category</Label>
                  <Input
                    id="label"
                    name="label"
                    placeholder="e.g., Rent, Airtime, Equipment"
                    value={formData.label}
                    onChange={handleChange}
                    required
                  />
                </div>

                

                
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionMessage">Transaction Message (Paste full SMS/Bank message)</Label>
                <Textarea
                  id="transactionMessage"
                  name="transactionMessage"
                  placeholder="Paste the full transaction message here..."
                  value={formData.transactionMessage}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Short free text)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Monthly office rent"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3} // Adjust rows as needed
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/transactions/${id}`)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
