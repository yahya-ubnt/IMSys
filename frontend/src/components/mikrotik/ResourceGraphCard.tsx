'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ResourceData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ResourceGraphCardProps {
  routerId: string;
  resourceType: 'cpu' | 'memory' | 'disk';
  title: string;
  unit: string;
}

export function ResourceGraphCard({ routerId, resourceType, title }: ResourceGraphCardProps) {
  const [resourceValue, setResourceValue] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId) return;

    const fetchResourceData = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch resource data');
        }
        const data = await response.json();

        let currentVal: number | null = null;
        let totalVal: number | null = null;

        if (resourceType === 'cpu') {
          currentVal = parseFloat(data['cpu-load']);
          totalVal = 100; // CPU load is always out of 100%
        } else if (resourceType === 'memory') {
          currentVal = parseInt(data['total-memory'], 10) - parseInt(data['free-memory'], 10); // Used memory
          totalVal = parseInt(data['total-memory'], 10);
        } else if (resourceType === 'disk') {
          const totalHddSpace = parseInt(data['total-hdd-space'], 10);
          const hddFree = parseInt(data['hdd-free'], 10);
          if (!isNaN(totalHddSpace) && !isNaN(hddFree)) {
            currentVal = totalHddSpace - hddFree; // Used disk
            totalVal = totalHddSpace;
          } else {
            console.warn('Invalid disk space data:', data['total-hdd-space'], data['hdd-free']);
            currentVal = null;
            totalVal = null;
          }
        }

        setResourceValue(currentVal);
        setTotalValue(totalVal);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResourceData();
    const interval = setInterval(fetchResourceData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [routerId, resourceType]);

  if (loading) {
    return <div>Loading {title} data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const percentage = (resourceValue !== null && totalValue !== null && totalValue > 0)
    ? ((resourceValue / totalValue) * 100).toFixed(0)
    : 'N/A';

  const data: ResourceData[] = [
    { name: 'Used', value: resourceValue !== null ? resourceValue : 0 },
    { name: 'Free', value: (totalValue !== null && resourceValue !== null) ? (totalValue - resourceValue) : 0 },
  ];

  const usedColor = resourceType === 'cpu' ? '#22d3ee' : (resourceType === 'memory' ? '#818cf8' : '#f59e0b');

  return (
    <div className="w-full h-28">
      {resourceValue !== null && totalValue !== null ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              startAngle={180}
              endAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? usedColor : '#3f3f46'} />
              ))}
            </Pie>
            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="20" fontWeight="bold">
              {percentage}%
            </text>
            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="#a1a1aa" fontSize="10">
              {title}
            </text>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-400">Loading...</div>
      )}
    </div>
  );
}
