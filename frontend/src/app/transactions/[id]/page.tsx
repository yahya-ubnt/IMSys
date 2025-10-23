'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getTransactionById, deleteTransaction } from '@/lib/transactionService';
import { Transaction } from '@/types/transaction';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';



import { ArrowLeft, DollarSign } from 'lucide-react'; // Added icons

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const categoryFromUrl = searchParams.get('category'); // Get category from URL
  const { toast } = useToast();

  // Check if 'id' is actually a category name
  useEffect(() => {
    if (id === 'personal' || id === 'company') {
      router.replace(`/transactions/${id.toLowerCase()}`); // Redirect to the correct list page
    }
  }, [id, router]);

  const [dailyTransaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionCategory, setTransactionCategory] = useState<string | null>(null);

  useEffect(() => {
    // If 'id' is a category name, redirect immediately
    if (id === 'personal' || id === 'company') {
      router.replace(`/transactions/${id}`);
      return; // Stop further execution of this useEffect
    }

    const fetchTransaction = async () => {
      if (!id) {
        setError('Transaction ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getTransactionById(id as string);
        setTransaction(data);
        setTransactionCategory(data.category || null); // Store the category
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch transaction details.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch transaction details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Only call fetchTransaction if id is not 'personal' or 'company'
    if (id && id !== 'personal' && id !== 'company') {
      fetchTransaction();
    } else {
      // If id is null/undefined or a category name, set loading to false
      // as we are not fetching a specific transaction
      setLoading(false);
    }
  }, [id, toast, router]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id as string);
        toast({
          title: 'Transaction Deleted',
          description: 'Transaction has been successfully deleted.',
        });
                        router.push('/transactions');
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to delete transaction.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to delete transaction. Please try again.',
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
            <p className="mt-2 text-muted-foreground">Loading transaction details...</p>
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
            <Button onClick={() => router.push(`/transactions/${transactionCategory || categoryFromUrl || 'personal'}`)} className="mt-4">Back to Transactions</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dailyTransaction) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Transaction not found.</p>
            <Button onClick={() => router.push(`/transactions/${transactionCategory || categoryFromUrl || 'personal'}`)} className="mt-4">Back to Transactions</Button>
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
            <Button onClick={() => router.push(`/transactions/${(transactionCategory || categoryFromUrl || 'personal').toLowerCase()}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
              <p className="text-muted-foreground">Detailed view of the transaction.</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/transactions/${dailyTransaction._id}/edit`}>
                Edit Transaction
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Transaction
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto"> {/* Centered content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Transaction Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}