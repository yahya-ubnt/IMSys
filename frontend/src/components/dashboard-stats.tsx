import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalConvertedLeads: number;
}

export function DashboardStats({ totalLeads, newLeadsThisMonth, totalConvertedLeads }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-zinc-900 text-white border-blue-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-blue-400">Total Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-300">{totalLeads}</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 text-white border-yellow-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-yellow-400">New Leads (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-yellow-300">{newLeadsThisMonth}</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 text-white border-green-600 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
          <CardTitle className="text-sm font-medium text-green-400">Total Converted Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-green-300">{totalConvertedLeads}</div>
        </CardContent>
      </Card>
    </div>
  );
}