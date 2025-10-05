'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { useAuth } from '@/components/auth-provider';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Cpu, Gauge, HardDrive } from 'lucide-react'; // Reverted to original import

interface ResourceData {
  name: string;
  value: number;
  [key: string]: any;
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
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchResourceData = async () => {
      try {
        const response = await fetch(`/api/routers/${routerId}/dashboard/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
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
  }, [routerId, resourceType, token]);

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const valueDisplay = (resourceType === 'cpu')
    ? `${resourceValue !== null ? resourceValue.toFixed(0) : 'N/A'}%`
    : `${resourceValue !== null ? formatBytes(resourceValue) : 'N/A'}/${totalValue !== null ? formatBytes(totalValue) : 'N/A'}`;

  const gradientId = `${resourceType}Gradient`;
  const usedColor = resourceType === 'cpu' ? '#8884d8' : (resourceType === 'memory' ? '#82ca9d' : '#ffc658');
  const freeColor = '#e0e0e0'; // Light gray for free part

  let IconComponent;
  if (resourceType === 'cpu') {
    IconComponent = Cpu;
  } else if (resourceType === 'memory') {
    IconComponent = Gauge;
  } else if (resourceType === 'disk') {
    IconComponent = HardDrive;
  }

  return (
    <Card className="w-full shadow-lg"> {/* Added futuristic styling */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-700"> {/* Modified CardHeader */}
        <CardTitle className="text-sm font-medium text-blue-400">{title}</CardTitle>
        {IconComponent && <IconComponent className="h-4 w-4 text-blue-400" />}
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6"> {/* Added padding */}
        {resourceValue !== null && totalValue !== null ? (
          <div className="relative w-32 h-32"> {/* Reverted size */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={usedColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={usedColor} stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40} // Adjusted size
                  outerRadius={55} // Adjusted size
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell key="used" fill={`url(#${gradientId})`} /> {/* Used part with gradient */}
                  <Cell key="free" fill={freeColor} /> {/* Free part */}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#eee' }}
                  labelStyle={{ color: '#eee' }}
                  itemStyle={{ color: '#eee' }}
                  formatter={(value: number) => (resourceType === 'cpu' ? `${value.toFixed(0)}%` : formatBytes(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-blue-300 drop-shadow-lg">{percentage}%</span> {/* Enhanced text */}
            </div>
          </div>
        ) : (
          <div className="text-gray-400">No data available.</div>
        )}
      </CardContent>
      {resourceValue !== null && totalValue !== null && ( // Moved valueDisplay outside
        <CardFooter className="flex justify-center text-base text-gray-400 mt-2"> {/* Enhanced text */}
          {valueDisplay}
        </CardFooter>
      )}
    </Card>
  );
}
