'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';

import { Input } from '@/components/ui/input';
import { Search, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Topbar } from '@/components/topbar';
import { ColumnDef } from '@tanstack/react-table';

// Define a placeholder interface for Transaction data
interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  date: string;
  description: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const error = null;
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder for fetching transactions (replace with actual API call)
  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const dummyData: Transaction[] = [
        { _id: '1', type: 'Payment', amount: 100, status: 'success', date: '2025-09-01', description: 'Monthly subscription' },
        { _id: '2', type: 'Refund', amount: 50, status: 'failed', date: '2025-09-02', description: 'Service cancellation' },
        { _id: '3', type: 'Payment', amount: 75, status: 'pending', date: '2025-09-03', description: 'New user setup' },
        { _id: '4', type: 'Payment', amount: 120, status: 'success', date: '2025-09-04', description: 'Annual renewal' },
      ];
      setTransactions(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(t => t.status === 'success').length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `$${row.original.amount.toFixed(2)}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const status = row.original.status;
      let colorClass = '';
      if (status === 'success') colorClass = 'text-green-400';
      else if (status === 'failed') colorClass = 'text-red-400';
      else if (status === 'pending') colorClass = 'text-yellow-400';
      return <span className={`capitalize ${colorClass}`}>{status}</span>;
    }},
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">Loading transactions...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-black text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-400">Transactions Overview</h1>
            <p className="text-sm text-zinc-400">View and manage all financial transactions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          <Card className="bg-zinc-900 text-white border-blue-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
              <CardTitle className="text-sm font-medium text-blue-400">Total Transactions</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-300">{totalTransactions}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white border-green-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
              <CardTitle className="text-sm font-medium text-green-400">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">{successfulTransactions}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white border-red-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
              <CardTitle className="text-sm font-medium text-red-400">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-300">{failedTransactions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="w-full bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
          <CardHeader className="border-b border-zinc-700 pb-4">
            <CardTitle className="text-cyan-400">Transaction List</CardTitle>
            <CardDescription className="text-zinc-400">Detailed log of all transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-zinc-400">Loading transactions...</p>
            ) : (
              <DataTable
                columns={columns}
                data={filteredTransactions}
                filterColumn="description" // Example filter
                className="text-sm [&_th]:bg-zinc-800 [&_th]:text-white [&_th]:font-semibold [&_td]:bg-zinc-900 [&_td]:text-white [&_td]:border-b [&_td]:border-zinc-700 [&_tr:last-child_td]:border-b-0 hover:[&_tr]:bg-zinc-800 transition-colors duration-200"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
