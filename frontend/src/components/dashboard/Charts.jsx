import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Charts = () => {
  const [yearlyData, setYearlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(moment().year().toString());
  const [selectedMonth, setSelectedMonth] = useState((moment().month() + 1).toString());

  useEffect(() => {
    const fetchYearlyData = async () => {
      try {
        const token = localStorage.getItem('token');
        const creditRes = await fetch(`/api/daily-transactions/monthly-totals?year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const debitRes = await fetch(`/api/expenses/yearly-monthly-totals?year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const creditData = await creditRes.json();
        const debitData = await debitRes.json();

        const formattedData = creditData.map((c, i) => ({
          month: moment().month(c.month - 1).format('MMM'),
          credit: c.total,
          debit: debitData[i]?.total || 0,
        }));
        setYearlyData(formattedData);
      } catch (error) {
        console.error('Error fetching yearly data:', error);
      }
    };

    fetchYearlyData();
  }, [selectedYear]);

  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        const token = localStorage.getItem('token');
        const creditRes = await fetch(`/api/daily-transactions/daily-collection-totals?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const debitRes = await fetch(`/api/expenses/daily-expense-totals?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const creditData = await creditRes.json();
        const debitData = await debitRes.json();

        const formattedData = creditData.map((c, i) => ({
          day: c.day,
          credit: c.total,
          debit: debitData[i]?.total || 0,
        }));
        setDailyData(formattedData);
      } catch (error) {
        console.error('Error fetching daily data:', error);
      }
    };

    fetchDailyData();
  }, [selectedYear, selectedMonth]);

  const handleYearChange = (value) => {
    setSelectedYear(value);
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-700 pb-4">
          <CardTitle className="text-cyan-400">Monthly Collections vs. Expenses</CardTitle>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[180px] bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
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
                data={yearlyData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 40,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                <XAxis dataKey="month" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value)} domain={[0, 'auto']} allowDataOverflow={true} minTickGap={10} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} />
                <Tooltip content={<CustomTooltip />} contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }} />
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="credit" stroke="#8884d8" fill="url(#colorCredit)" />
                <Area type="monotone" dataKey="debit" stroke="#82ca9d" fill="url(#colorDebit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-700 pb-4">
          <CardTitle className="text-cyan-400">Daily Collections vs. Expenses</CardTitle>
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px] bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
              {moment.months().map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()} className="focus:bg-zinc-700 focus:text-white">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart
                data={dailyData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 40,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                <XAxis dataKey="day" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value)} domain={[0, 'auto']} allowDataOverflow={true} minTickGap={10} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#ccc' }} />
                <Tooltip content={<CustomTooltip />} contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }} />
                <Bar dataKey="credit" fill="#8884d8" />
                <Bar dataKey="debit" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 text-white p-2 rounded-md text-xs">
        <p className="font-bold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
        ))}
      </div>
    );
  }

  return null;
};

export default Charts;
