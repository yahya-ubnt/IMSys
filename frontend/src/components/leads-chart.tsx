import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthlyLeadData } from '@/types/lead';

interface LeadsChartProps {
  data: MonthlyLeadData[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  years: string[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length && label !== undefined) {
    const monthName = new Date(2000, label - 1).toLocaleString('en-US', { month: 'long' });
    return (
      <div className="bg-gray-800 text-white p-2 rounded-md text-xs">
        <p className="font-bold">{monthName}</p>
        <p>New Leads: {payload[0].value}</p>
        <p>Converted Leads: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

export function LeadsChart({ data, selectedYear, setSelectedYear, years }: LeadsChartProps) {
  return (
    <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-700">
        <CardTitle className="text-cyan-400">Monthly Lead Trends</CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px] bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            {years.map((year) => (
              <SelectItem key={year} value={year} className="focus:bg-zinc-700 focus:text-white">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 40,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
              <XAxis
                dataKey="_id.month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(2000, value - 1).toLocaleString('default', { month: 'short' })}
                style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} 
              />
              <Tooltip content={<CustomTooltip />} contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }} />
              <Area type="monotone" dataKey="newLeads" stroke="#adfa1d" fill="url(#colorNewLeads)" />
              <Area type="monotone" dataKey="convertedLeads" stroke="#fa1d1d" fill="url(#colorConvertedLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <svg width="0" height="0">
          <defs>
            <linearGradient id="colorNewLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#adfa1d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#adfa1d" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConvertedLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fa1d1d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#fa1d1d" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </svg>
      </CardContent>
    </Card>
  );
}