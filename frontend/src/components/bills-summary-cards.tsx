'use client';

import { Bill } from '@/types/bill';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CheckCircle, AlertCircle, List } from 'lucide-react';

interface BillsSummaryCardsProps {
  bills: Bill[];
}

const StatCard = ({ title, value, icon: Icon, color = "text-white", subtext }: { title: string, value: string, icon: React.ElementType, color?: string, subtext?: string }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
    </div>
  </div>
);

export function BillsSummaryCards({ bills }: BillsSummaryCardsProps) {
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = bills.filter(bill => bill.status === 'Paid').reduce((sum, bill) => sum + bill.amount, 0);
  const totalUnpaid = bills.filter(bill => bill.status === 'Not Paid').reduce((sum, bill) => sum + bill.amount, 0);
  const numberOfBills = bills.length;
  const numberOfPaidBills = bills.filter(bill => bill.status === 'Paid').length;
  const numberOfUnpaidBills = bills.length - numberOfPaidBills;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total Amount" 
        value={formatCurrency(totalAmount)} 
        icon={DollarSign}
        color="text-cyan-400"
      />
      <StatCard 
        title="Total Paid" 
        value={formatCurrency(totalPaid)} 
        icon={CheckCircle}
        color="text-green-400"
      />
      <StatCard 
        title="Total Unpaid" 
        value={formatCurrency(totalUnpaid)} 
        icon={AlertCircle}
        color="text-yellow-400"
      />
      <StatCard 
        title="Number of Bills" 
        value={numberOfBills.toString()} 
        icon={List}
        subtext={`${numberOfPaidBills} paid, ${numberOfUnpaidBills} unpaid`}
      />
    </div>
  );
}