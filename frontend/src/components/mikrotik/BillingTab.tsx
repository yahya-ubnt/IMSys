"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MpesaTransaction } from '@/app/mikrotik/users/[id]/details/mpesa-columns';
import { WalletTransaction } from '@/app/mikrotik/users/[id]/details/wallet-columns';
import { format } from 'date-fns';
import { DollarSign, Calendar, Hash, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WalletTransactionTable } from './WalletTransactionTable';
import { Button } from '@/components/ui/button';

interface PaymentStats {
  totalSpentMpesa: number;
  lastMpesaPaymentDate: string | null;
  totalMpesaTransactions: number;
  averageMpesaTransaction: number;
  mpesaTransactionHistory: MpesaTransaction[];
}

interface BillingTabProps {
  paymentStats: PaymentStats | null;
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

const BillingTab: React.FC<BillingTabProps> = ({ paymentStats, walletTransactions }) => {
  const [activeTable, setActiveTable] = useState('mpesa');

  const mpesaHistory = paymentStats?.mpesaTransactionHistory ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Spent (M-Pesa)" value={`KES ${paymentStats?.totalSpentMpesa.toLocaleString() ?? '0'}`} />
        <StatCard icon={Calendar} label="Last M-Pesa Payment" value={paymentStats?.lastMpesaPaymentDate ? format(new Date(paymentStats.lastMpesaPaymentDate), 'PP') : 'N/A'} />
        <StatCard icon={Hash} label="Total M-Pesa Transactions" value={paymentStats?.totalMpesaTransactions ?? 0} />
        <StatCard icon={TrendingUp} label="Avg. M-Pesa Transaction" value={`KES ${paymentStats?.averageMpesaTransaction.toFixed(2) ?? '0.00'}`} />
      </div>
      <Card className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
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
            <div className="h-64 overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mpesaHistory.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="font-semibold">{tx.transactionId}</TableCell>
                      <TableCell>{format(new Date(tx.transactionDate), 'PPpp')}</TableCell>
                      <TableCell className="text-right font-bold text-green-400">KES {tx.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 overflow-y-auto overflow-x-auto">
              <WalletTransactionTable data={walletTransactions} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;