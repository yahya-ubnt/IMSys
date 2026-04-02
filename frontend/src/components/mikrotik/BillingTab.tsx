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
  <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
    <Icon className="h-5 w-5 flex-shrink-0 text-cyan-400" />
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
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
      <Card className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl border border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-cyan-400 text-lg font-semibold">
            {activeTable === 'mpesa' ? 'M-Pesa Transaction History' : 'Wallet Transaction History'}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
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
        </CardHeader>
        <CardContent className="pt-0">
          {activeTable === 'mpesa' ? (
            <div className="h-64 overflow-y-auto overflow-x-auto">
              {mpesaHistory.length > 0 ? (
                <Table className="min-w-full">
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
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">No M-Pesa transactions found.</div>
              )}
            </div>
          ) : (
            <div className="h-64 overflow-y-auto overflow-x-auto">
              {walletTransactions.length > 0 ? (
                <WalletTransactionTable data={walletTransactions} />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">No wallet transactions found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;