'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Bill } from '@/types/bill';
import { formatCurrency } from '@/lib/utils';

interface BillsChartProps {
  bills: Bill[];
}

export function BillsChart({ bills }: BillsChartProps) {
  // Aggregate data for the chart
  // For simplicity, let's aggregate by status (Paid vs. Not Paid)
  const paidAmount = bills.filter(bill => bill.status === 'Paid').reduce((sum, bill) => sum + bill.amount, 0);
  const unpaidAmount = bills.filter(bill => bill.status === 'Not Paid').reduce((sum, bill) => sum + bill.amount, 0);

  const chartData = [
    { name: 'Paid', amount: paidAmount },
    { name: 'Unpaid', amount: unpaidAmount },
  ];

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 40,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
          <XAxis dataKey="name" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            domain={[0, 'auto']}
            allowDataOverflow={true}
            minTickGap={10}
            style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }}
          />
          <Tooltip content={<CustomTooltip />} contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }} />
          <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="url(#colorAmount)" />
        </AreaChart>
      </ResponsiveContainer>
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 text-white p-2 rounded-md text-xs">
        <p className="font-bold">{label}</p>
        <p>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }

  return null;
};
