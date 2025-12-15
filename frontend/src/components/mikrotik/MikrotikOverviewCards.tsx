'use client';

import { useEffect, useState } from 'react';
import { Cpu, HardDrive, MemoryStick, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemInfo {
  'board-name': string;
  version: string;
  'cpu-load': string;
  uptime: string;
  'free-memory': string;
  'total-memory': string;
  'hdd-free'?: string;
  'ip-address'?: string;
}

interface OverviewCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon: Icon, color = "text-cyan-400" }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export function MikrotikOverviewCards({ routerId }: { routerId: string }) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId) return;

    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/status`);
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

    const interval = setInterval(fetchSystemInfo, 5000); // Refresh every 5 seconds
    fetchSystemInfo(); // Initial fetch

    return () => clearInterval(interval);
  }, [routerId]);

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

  if (loading && !systemInfo) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-zinc-800/50 rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!systemInfo) {
    return <div>No system information available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <OverviewCard
        title="CPU Load"
        value={`${systemInfo['cpu-load']}%`}
        icon={Cpu}
        color="text-green-400"
      />
      <OverviewCard
        title="Free Memory"
        value={formatMemory(systemInfo['free-memory'])}
        icon={MemoryStick}
        color="text-blue-400"
      />
      <OverviewCard
        title="HDD Free"
        value={formatHddSpace(systemInfo['hdd-free'] || '0')}
        icon={HardDrive}
        color="text-yellow-400"
      />
      <OverviewCard
        title="Uptime"
        value={systemInfo.uptime || 'N/A'}
        icon={Globe}
        color="text-purple-400"
      />
    </div>
  );
}
