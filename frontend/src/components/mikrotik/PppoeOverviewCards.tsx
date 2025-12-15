'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PppoeCounts {
  activePppoe: number;
  inactivePppoe: number;
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

export function PppoeOverviewCards({ routerId }: { routerId: string }) {
  const [pppoeCounts, setPppoeCounts] = useState<PppoeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId) return;

    const fetchPppoeCounts = async () => {
      try {
        // No setLoading(true) here to allow stale-while-revalidate feeling
        const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/counts`);
        if (!response.ok) {
          throw new Error('Failed to fetch PPPoE counts');
        }
        const data = await response.json();
        setPppoeCounts(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchPppoeCounts, 5000); // Refresh every 5 seconds
    fetchPppoeCounts(); // Initial fetch

    return () => clearInterval(interval);
  }, [routerId]);

  if (loading && !pppoeCounts) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full bg-zinc-800/50 rounded-lg" />
        <Skeleton className="h-24 w-full bg-zinc-800/50 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!pppoeCounts) {
    return <div>No PPPoE count information available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <OverviewCard
        title="Active PPPoE Users"
        value={pppoeCounts.activePppoe.toString()}
        icon={Wifi}
        color="text-green-400"
      />
      <OverviewCard
        title="Inactive PPPoE Users"
        value={pppoeCounts.inactivePppoe.toString()}
        icon={WifiOff}
        color="text-yellow-400"
      />
    </div>
  );
}
