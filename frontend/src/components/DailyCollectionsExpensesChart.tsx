'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

interface DailyData {
  day: number;
  total: number;
}

interface ChartData {
  day: number;
  collections: number;
  expenses: number;
}

const DailyCollectionsExpensesChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      const currentYear = moment().year();
      const currentMonth = moment().month() + 1; // moment months are 0-indexed

      try {
        const [collectionsRes, expensesRes] = await Promise.all([
          fetch(`/api/daily-transactions/daily-collection-totals?year=${currentYear}&month=${currentMonth}`),
          fetch(`/api/expenses/daily-expense-totals?year=${currentYear}&month=${currentMonth}`),
        ]);

        if (!collectionsRes.ok) {
          throw new Error(`HTTP error! status: ${collectionsRes.status} from collections`);
        }
        if (!expensesRes.ok) {
          throw new Error(`HTTP error! status: ${expensesRes.status} from expenses`);
        }

        const collectionsData: DailyData[] = await collectionsRes.json();
        const expensesData: DailyData[] = await expensesRes.json();

        const daysInMonth = moment().daysInMonth();
        const mergedData: ChartData[] = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const collection = collectionsData.find(d => d.day === day);
          const expense = expensesData.find(d => d.day === day);
          return {
            day,
            collections: collection ? collection.total : 0,
            expenses: expense ? expense.total : 0,
          };
        });
        setChartData(mergedData);
      } catch (e: unknown) {
        setError((e instanceof Error) ? e.message : 'An unknown error occurred');
        console.error("Failed to fetch chart data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <h2 className="text-xl font-semibold mb-4">Daily Collections and Expenses ({moment().format('MMMM YYYY')})</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="collections" fill="#8884d8" name="Collections" />
          <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyCollectionsExpensesChart;
