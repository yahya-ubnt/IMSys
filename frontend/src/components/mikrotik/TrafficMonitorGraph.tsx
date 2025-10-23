'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrafficData {
  timestamp: string;
  rxMbps: number;
  txMbps: number;
}

interface TrafficMonitorGraphProps {
  routerId: string;
  interfaceName: string;
}

export function TrafficMonitorGraph({ routerId, interfaceName }: TrafficMonitorGraphProps) {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId || !interfaceName) return;

    const fetchTraffic = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/traffic/${interfaceName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch traffic data');
        }
        const data: TrafficData = await response.json();
        setTrafficData((prevData) => {
          const newData = [...prevData, data];
          // Keep only the last 60 data points for a 5-minute graph (if polling every 5 seconds)
          return newData.slice(-60);
        });
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchTraffic();
    const intervalId = setInterval(fetchTraffic, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, interfaceName]);

  if (loading) {
    return <div>Loading traffic data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Monitoring ({interfaceName})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={trafficData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
            <YAxis label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Area type="monotone" dataKey="rxMbps" stroke="#8884d8" fill="#8884d8" name="Rx (Mbps)" />
            <Area type="monotone" dataKey="txMbps" stroke="#82ca9d" fill="#82ca9d" name="Tx (Mbps)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
