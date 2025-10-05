'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added
import { Activity } from 'lucide-react';

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
  const { token } = useAuth();
  const [availableInterfaces, setAvailableInterfaces] = useState<MikroTikInterface[]>([]); // New state
  const [selectedInterface, setSelectedInterface] = useState<string>(''); // New state for selected interface

  // Fetch available interfaces
  useEffect(() => {
    if (!routerId || !token) return;

    const fetchInterfaces = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/interfaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
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
  }, [routerId, token]);

  // Fetch traffic data for the selected interface
  useEffect(() => {
    if (!routerId || !token || !selectedInterface) {
      setLoading(false); // Stop loading if no interface is selected
      return;
    }

    setLoading(true); // Start loading when interface changes
    setTrafficHistory([]); // Clear history for new interface

    const fetchTraffic = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/traffic/${selectedInterface}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
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
  }, [routerId, selectedInterface, token]); // Dependency on selectedInterface

  if (loading && trafficHistory.length === 0) {
    return <div>Loading traffic data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Card className="w-full shadow-lg"> {/* Added futuristic styling */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-700"> {/* Modified CardHeader */}
        <CardTitle className="flex items-center gap-2 text-blue-400">Traffic Monitoring <Activity className="h-4 w-4 text-blue-400" /></CardTitle>
        <Select onValueChange={setSelectedInterface} value={selectedInterface} disabled={availableInterfaces.length === 0}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Interface" />
          </SelectTrigger>
          <SelectContent>
            {availableInterfaces.map((iface) => (
              <SelectItem key={iface.name} value={iface.name}>
                {iface.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {trafficHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={trafficHistory}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" /> {/* Darker grid */}
              <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#888" interval={10} />
              <YAxis label={{ value: 'Mbps', angle: -90, position: 'insideLeft', fill: '#888' }} stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }}
                labelStyle={{ color: '#eee' }}
                itemStyle={{ color: '#eee' }}
                formatter={(value: number) => `${value.toFixed(2)} Mbps`}
              />
              <Area type="monotone" dataKey="rxMbps" stroke="#8884d8" fillOpacity={1} fill="url(#colorRx)" name="Rx (Mbps)" />
              <Area type="monotone" dataKey="txMbps" stroke="#82ca9d" fillOpacity={1} fill="url(#colorTx)" name="Tx (Mbps)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400">No traffic data available for {selectedInterface}.</div>
        )}
      </CardContent>
    </Card>
  );
}
