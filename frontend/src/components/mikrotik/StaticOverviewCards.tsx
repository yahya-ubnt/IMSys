'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Users, UserX } from 'lucide-react'; // Icons for active/inactive

interface DhcpLease {
  '.id': string;
  address: string;
  'mac-address': string;
  'client-id': string;
  server: string;
  status: string;
  dynamic?: string; // 'true' or 'false'
}

interface OverviewCardProps {
  title: string;
  value: number;
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

export function StaticOverviewCards({ routerId }: { routerId: string }) {
  const [activeStaticCount, setActiveStaticCount] = useState(0);
  const [inactiveStaticCount, setInactiveStaticCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/dhcp-leases`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch DHCP leases');
        }

        const leases: DhcpLease[] = await response.json();

        let active = 0;
        let inactive = 0;

        leases.forEach(lease => {
          // Filter for static leases (dynamic=no or dynamic is undefined/false)
          if (lease.dynamic === 'no' || !lease.dynamic) {
            if (lease.status === 'bound') {
              active++;
            } else {
              inactive++;
            }
          }
        });

        setActiveStaticCount(active);
        setInactiveStaticCount(inactive);

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading static overview...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <OverviewCard
        title="Total Active Static"
        value={activeStaticCount}
        icon={Users}
        bgColor="bg-indigo-600"
      />
      <OverviewCard
        title="Total Inactive Static"
        value={inactiveStaticCount}
        icon={UserX}
        bgColor="bg-orange-600"
      />
    </div>
  );
}
