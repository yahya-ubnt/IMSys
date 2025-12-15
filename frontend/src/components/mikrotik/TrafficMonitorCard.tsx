'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added

interface TrafficData {
  timestamp: string;
  rxMbps: number;
  txMbps: number;
}

interface MikroTikInterface {
  name: string;
  // Add other properties if needed, e.g., type, running status
}

export function TrafficMonitorCard({ routerId }: { routerId: string }) { // Removed interfaceName prop
  const [trafficHistory, setTrafficHistory] = useState<TrafficData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableInterfaces, setAvailableInterfaces] = useState<MikroTikInterface[]>([]); // New state
  const [selectedInterface, setSelectedInterface] = useState<string>(''); // New state for selected interface

  // Fetch available interfaces
  useEffect(() => {
    if (!routerId) return;

    const fetchInterfaces = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/interfaces`);
        if (!response.ok) {
          throw new Error('Failed to fetch interfaces');
        }
        const data: MikroTikInterface[] = await response.json();
        setAvailableInterfaces(data);
        if (data.length > 0) {
          setSelectedInterface(data[0].name); // Select the first interface by default
        }
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      }
    };
    fetchInterfaces();
  }, [routerId]);

  // Fetch traffic data for the selected interface
  useEffect(() => {
    if (!routerId || !selectedInterface) {
      setLoading(false); // Stop loading if no interface is selected
      return;
    }

    setLoading(true); // Start loading when interface changes
    setTrafficHistory([]); // Clear history for new interface

    const fetchTraffic = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/traffic/${selectedInterface}`);
        if (!response.ok) {
          throw new Error('Failed to fetch traffic data');
        }
        const data: TrafficData = await response.json();
        setTrafficHistory((prevHistory) => {
          const newHistory = [...prevHistory, data];
          // Keep only the last 60 data points (e.g., 5 minutes if polling every 5 seconds)
          return newHistory.slice(-60);
        });
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 1000); // Poll every 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [routerId, selectedInterface]); // Dependency on selectedInterface

  if (loading && trafficHistory.length === 0) {
    return <div>Loading traffic data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Live Traffic Monitor</h3>
        <Select onValueChange={setSelectedInterface} defaultValue={selectedInterface}>
          <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select an interface" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {availableInterfaces.map((iface) => (
              <SelectItem key={iface.name} value={iface.name}>
                {iface.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp" 
              stroke="#888" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={14}
              tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <Legend />
            <Area type="monotone" dataKey="rxMbps" stroke="#22d3ee" fill="url(#colorRx)" name="Download (Mbps)" />
            <Area type="monotone" dataKey="txMbps" stroke="#818cf8" fill="url(#colorTx)" name="Upload (Mbps)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const time = new Date(label || '').toLocaleTimeString();
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{time}</p>
        <p style={{ color: '#22d3ee' }}>{`Download: ${payload[0].value.toFixed(2)} Mbps`}</p>
        <p style={{ color: '#818cf8' }}>{`Upload: ${payload[1].value.toFixed(2)} Mbps`}</p>
      </div>
    );
  }
  return null;
};
