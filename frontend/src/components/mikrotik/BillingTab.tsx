"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MpesaTransaction } from '@/app/mikrotik/users/[id]/details/mpesa-columns';
import { WalletTransaction } from '@/app/mikrotik/users/[id]/details/wallet-columns';
import { format } from 'date-fns';
import { DollarSign, Calendar, Hash, TrendingUp, Wallet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WalletTransactionTable } from './WalletTransactionTable';
import { Button } from '@/components/ui/button';

interface BillingTabProps {
  mpesaTransactions: MpesaTransaction[];
  walletTransactions: WalletTransaction[];
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

const BillingTab: React.FC<BillingTabProps> = ({ mpesaTransactions, walletTransactions }) => {
  const [activeTable, setActiveTable] = useState('mpesa');

  const totalSpent = mpesaTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const lastPayment = mpesaTransactions.length > 0 ? new Date(mpesaTransactions[0].createdAt) : null;
  const avgTransaction = mpesaTransactions.length > 0 ? totalSpent / mpesaTransactions.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Spent (M-Pesa)" value={`KES ${totalSpent.toLocaleString()}`} />
        <StatCard icon={Calendar} label="Last M-Pesa Payment" value={lastPayment ? format(lastPayment, 'PP') : 'N/A'} />
        <StatCard icon={Hash} label="Total M-Pesa Transactions" value={mpesaTransactions.length} />
        <StatCard icon={TrendingUp} label="Avg. M-Pesa Transaction" value={`KES ${avgTransaction.toFixed(2)}`} />
      </div>
      <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
        <CardHeader>
          <div>
            <CardTitle className="text-cyan-400">Transaction History</CardTitle>
            <div className="flex gap-2 mt-4">
              <Button 
                variant={activeTable === 'mpesa' ? 'default' : 'outline'} 
                onClick={() => setActiveTable('mpesa')}
                className={activeTable === 'mpesa' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : ''}
              >
                M-Pesa
              </Button>
              <Button 
                variant={activeTable === 'wallet' ? 'default' : 'outline'} 
                onClick={() => setActiveTable('wallet')}
                className={activeTable === 'wallet' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : ''}
              >
                Wallet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTable === 'mpesa' ? (
            <div className="h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mpesaTransactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="font-semibold">{tx.transactionId}</TableCell>
                      <TableCell>{format(new Date(tx.createdAt), 'PPpp')}</TableCell>
                      <TableCell className="text-right font-bold text-green-400">KES {tx.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <WalletTransactionTable data={walletTransactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;