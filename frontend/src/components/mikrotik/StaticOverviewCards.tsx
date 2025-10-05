'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StaticCounts {
  activeStatic: number;
  inactiveStatic: number;
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

export function StaticOverviewCards({ routerId }: { routerId: string }) {
  const [staticCounts, setStaticCounts] = useState<StaticCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchStaticCounts = async () => {
      try {
        // No setLoading(true) here to allow stale-while-revalidate feeling
        const response = await fetch(`/api/routers/${routerId}/dashboard/static/counts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch static user counts');
        }
        const data = await response.json();
        setStaticCounts(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchStaticCounts, 5000); // Refresh every 5 seconds
    fetchStaticCounts(); // Initial fetch

    return () => clearInterval(interval);
  }, [routerId, token]);

  if (loading && !staticCounts) {
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

  if (!staticCounts) {
    return <div>No static user count information available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <OverviewCard
        title="Active Static Users"
        value={staticCounts.activeStatic.toString()}
        icon={Wifi}
        color="text-green-400"
      />
      <OverviewCard
        title="Inactive Static Users"
        value={staticCounts.inactiveStatic.toString()}
        icon={WifiOff}
        color="text-yellow-400"
      />
    </div>
  );
}
