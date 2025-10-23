"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils" // Assuming a utility for currency formatting

interface CollectionStats {
  today: { total: number };
  thisWeek: { total: number };
  thisMonth: { total: number };
  thisYear: { total: number };
}

interface ExpenseStats {
  total: number;
}

export function DashboardStatsCards() {
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const collectionRes = await axios.get("/api/daily-transactions/stats");
        setCollectionStats(collectionRes.data);

        const expenseRes = await axios.get("/api/expenses/monthly-total");
        setMonthlyExpenses(expenseRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center text-blue-400">Loading dashboard stats...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-zinc-900 text-white border-blue-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-blue-400">Today's Collection</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-300">
            {formatCurrency(collectionStats?.today.total || 0)}
          </div>
          <p className="text-xs text-zinc-400">Total collected today</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-white border-green-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-green-400">Weekly Collection</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-300">
            {formatCurrency(collectionStats?.thisWeek.total || 0)}
          </div>
          <p className="text-xs text-zinc-400">Total collected this week</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-white border-yellow-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-yellow-400">{currentMonthName} Collection</CardTitle>
          <Calendar className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-300">
            {formatCurrency(collectionStats?.thisMonth.total || 0)}
          </div>
          <p className="text-xs text-zinc-400">Total collected this month</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-white border-blue-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-blue-400">{currentYear} Collection</CardTitle>
          <Calendar className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-300">
            {formatCurrency(collectionStats?.thisYear.total || 0)}
          </div>
          <p className="text-xs text-zinc-400">Total collected this year</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-white border-orange-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-orange-400">{currentMonthName} Expenses</CardTitle>
          <Wallet className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-300">
            {formatCurrency(monthlyExpenses?.total || 0)}
          </div>
          <p className="text-xs text-zinc-400">Total expenses this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
