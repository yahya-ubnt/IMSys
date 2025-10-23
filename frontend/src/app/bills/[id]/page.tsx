'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; // ADD useSearchParams
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getBillById, deleteBill } from '@/lib/billService';
import { Bill } from '@/types/bill';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CalendarIcon, Tag, FileText, DollarSign, Receipt } from 'lucide-react';

export default function BillDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams(); // ADD this line

  const [refreshKey, setRefreshKey] = useState(0); // ADD this state

  useEffect(() => {
    const fetchBill = async () => {
      if (!id) {
        setError('Bill ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getBillById(id as string);
        setBill(data);
      } catch (err) {
        let errorMessage = 'Failed to fetch bill details.';
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
  }, [id, toast, router, refreshKey]); // ADD refreshKey to dependencies

  // Effect to update refreshKey when the 'refresh' query parameter changes
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      setRefreshKey(prevKey => prevKey + 1); // Increment key to force re-fetch
    }
  }, [searchParams]); // Depend on searchParams // ADD router to dependencies

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await deleteBill(id as string);
        toast({
          title: 'Bill Deleted',
          description: 'Bill has been successfully deleted.',
        });
        router.push(`/bills/${bill?.category.toLowerCase()}`);
      } catch (err) {
        let errorMessage = 'Failed to delete bill.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading bill details...</p>
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

  if (!bill) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Bill not found.</p>
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
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/bills/${bill.category.toLowerCase()}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {bill.category} Bills
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bill Details</h1>
              <p className="text-muted-foreground">Detailed view of the bill.</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/bills/${bill._id}/edit`}>
                Edit Bill
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Bill
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto"> {/* Centered content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Basic Details
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bill Name</Label>
                    <Input value={bill.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(bill.amount)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input value={bill.dueDate} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input value={bill.category} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input value={bill.status} disabled />
                  </div>
                </div>
              </div>

              {/* Payment Details (Conditional) */}
              {bill.status === 'Paid' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Payment Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentDate">Payment Date</Label>
                      <Input value={bill.paymentDate ? format(new Date(bill.paymentDate), 'PPP p') : 'N/A'} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Method</Label>
                      <Input value={bill.method || 'N/A'} disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionMessage">Transaction Message</Label>
                    <Textarea
                      value={bill.transactionMessage || 'N/A'}
                      rows={3}
                      disabled
                    />
                  </div>
                </div>
              )}

              {/* Other Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Other Details
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    value={bill.description || 'N/A'}
                    rows={3}
                    disabled
                  />
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Timestamps
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input value={new Date(bill.year, bill.month - 1, 1).toLocaleString('default', { month: 'long' })} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input value={bill.year} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="createdAt">Created At</Label>
                    <Input value={format(new Date(bill.createdAt), 'PPP p')} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updatedAt">Last Updated</Label>
                    <Input value={format(new Date(bill.updatedAt), 'PPP p')} disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
