"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MpesaTransaction } from '@/app/mikrotik/users/[id]/details/mpesa-columns';
import { format } from 'date-fns';
import { DollarSign, Calendar, Hash, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BillingTabProps {
  transactions: MpesaTransaction[];
}

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => (
  <div className="p-4 rounded-lg bg-zinc-800/50 flex items-center">
    <Icon className="h-6 w-6 text-cyan-400 mr-4" />
    <div>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const BillingTab: React.FC<BillingTabProps> = ({ transactions }) => {
  const totalSpent = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const lastPayment = transactions.length > 0 ? new Date(transactions[0].createdAt) : null;
  const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Spent" value={`KES ${totalSpent.toLocaleString()}`} />
        <StatCard icon={Calendar} label="Last Payment" value={lastPayment ? format(lastPayment, 'PP') : 'N/A'} />
        <StatCard icon={Hash} label="Total Transactions" value={transactions.length} />
        <StatCard icon={TrendingUp} label="Avg. Transaction" value={`KES ${avgTransaction.toFixed(2)}`} />
      </div>
      <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
        <CardHeader>
          <CardTitle className="text-cyan-400">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-semibold">{tx.transactionId}</TableCell>
                    <TableCell>{format(new Date(tx.createdAt), 'PPpp')}</TableCell>
                    <TableCell className="text-right font-bold text-green-400">KES {tx.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;