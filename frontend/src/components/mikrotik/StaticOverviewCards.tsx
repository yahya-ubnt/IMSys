'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface StaticCounts {
  activeStatic: number;
  inactiveStatic: number;
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

export function StaticOverviewCards({ routerId }: { routerId: string }) {
  const [staticCounts, setStaticCounts] = useState<StaticCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchStaticCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/static/counts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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

    fetchStaticCounts();
  }, [routerId, token]);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2"><Card><CardContent>Loading static counts...</CardContent></Card></div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!staticCounts) {
    return <div>No static user count information available.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <OverviewCard
        title="Active Static Users"
        value={staticCounts.activeStatic.toString()}
        icon={Wifi}
      />
      <OverviewCard
        title="Inactive Static Users"
        value={staticCounts.inactiveStatic.toString()}
        icon={WifiOff}
      />
    </div>
  );
}
