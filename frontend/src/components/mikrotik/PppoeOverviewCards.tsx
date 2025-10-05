'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface PppoeCounts {
  activePppoe: number;
  inactivePppoe: number;
}

interface OverviewCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function PppoeOverviewCards({ routerId }: { routerId: string }) {
  const [pppoeCounts, setPppoeCounts] = useState<PppoeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchPppoeCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/counts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
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

    fetchPppoeCounts();
  }, [routerId, token]);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2"><Card><CardContent>Loading PPPoE counts...</CardContent></Card></div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!pppoeCounts) {
    return <div>No PPPoE count information available.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <OverviewCard
        title="Active PPPoE Users"
        value={pppoeCounts.activePppoe.toString()}
        icon={Wifi}
      />
      <OverviewCard
        title="Inactive PPPoE Users"
        value={pppoeCounts.inactivePppoe.toString()}
        icon={WifiOff}
      />
    </div>
  );
}
