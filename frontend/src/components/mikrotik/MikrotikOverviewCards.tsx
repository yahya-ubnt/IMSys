'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Cpu, HardDrive, MemoryStick, Globe } from 'lucide-react';

interface SystemInfo {
  'board-name': string;
  version: string;
  'cpu-load': string;
  uptime: string;
  'free-memory': string;
  'total-memory': string;
  'hdd-free'?: string; // Added
  'ip-address'?: string; // Added
}

interface OverviewCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon: Icon, bgColor }) => (
  <Card className={`flex flex-col justify-between h-full ${bgColor} text-white`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
      <Icon className="h-4 w-4 text-white" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function MikrotikOverviewCards({ routerId }: { routerId: string }) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch system info');
        }
        const data = await response.json();
        setSystemInfo(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, [routerId, token]);

  const formatMemory = (bytes: string) => {
    const value = parseInt(bytes, 10);
    if (isNaN(value)) return 'N/A';
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatHddSpace = (bytes: string) => {
    const value = parseInt(bytes, 10);
    if (isNaN(value)) return 'N/A';
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Card><CardContent>Loading...</CardContent></Card></div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!systemInfo) {
    return <div>No system information available.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <OverviewCard
        title="CPU Load"
        value={`${systemInfo['cpu-load']}%`}
        icon={Cpu}
        bgColor="bg-blue-500"
      />
      <OverviewCard
        title="Free Memory"
        value={formatMemory(systemInfo['free-memory'])}
        icon={MemoryStick}
        bgColor="bg-green-500"
      />
      <OverviewCard
        title="HDD Free"
        value={formatHddSpace(systemInfo['hdd-free'] || '0')}
        icon={HardDrive}
        bgColor="bg-yellow-500"
      />
      <OverviewCard
        title="IP Address"
        value={systemInfo['ip-address'] || 'N/A'}
        icon={Globe}
        bgColor="bg-purple-500"
      />
    </div>
  );
}
