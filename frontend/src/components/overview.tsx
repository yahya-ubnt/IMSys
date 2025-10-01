"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { getBills } from "@/lib/billService"
import { Bill } from "@/types/bill"

interface ChartData {
  name: string;
  total: number;
  deals: number;
}

export function Overview() {
  const { user, token } = useAuth(); // Destructure token here
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) { // Use token directly
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        const bills = await getBills(token);

        // Aggregate data by month
        const monthlyData: { [key: string]: { total: number; deals: number } } = {};

        bills.forEach((bill: Bill) => {
          const date = new Date(bill.createdAt);
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
          const monthYear = `${month} ${year}`;

          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { total: 0, deals: 0 };
          }
          monthlyData[monthYear].total += bill.amount;
          monthlyData[monthYear].deals += 1; // Each bill counts as a deal
        });

        // Sort data by month and year
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
          const [monthA, yearA] = a.split(' ');
          const [monthB, yearB] = b.split(' ');
          const dateA = new Date(`${monthA} 1, ${yearA}`);
          const dateB = new Date(`${monthB} 1, ${yearB}`);
          return dateA.getTime() - dateB.getTime();
        });

        const formattedData: ChartData[] = sortedMonths.map(monthYear => ({
          name: monthYear.split(' ')[0], // Just the month abbreviation
          total: monthlyData[monthYear].total,
          deals: monthlyData[monthYear].deals,
        }));

        setChartData(formattedData);

      } catch (err) {
        console.error("Failed to fetch overview data:", err);
        setError("Failed to load overview data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <Tooltip
          formatter={(value, name) => {
            if (name === "total") return [`$${value}`, "Revenue"]
            return [value, "Deals"]
          }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  )
}
