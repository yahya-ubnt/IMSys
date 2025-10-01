'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Users, UserX } from 'lucide-react'; // Icons for active/inactive

interface ActiveSession {
  name: string;
  // ... other properties
}

interface Secret {
  name: string;
  // ... other properties
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

export function PppoeOverviewCards({ routerId }: { routerId: string }) {
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [activeResponse, secretsResponse] = await Promise.all([
          fetch(`/api/routers/${routerId}/dashboard/pppoe/active`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`/api/routers/${routerId}/dashboard/pppoe/secrets`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!activeResponse.ok || !secretsResponse.ok) {
          throw new Error('Failed to fetch PPPoE data');
        }

        const activeData: ActiveSession[] = await activeResponse.json();
        const secretsData: Secret[] = await secretsResponse.json();

        setActiveCount(activeData.length);

        const activeNames = new Set(activeData.map(session => session.name));
        const inactiveUsers = secretsData.filter(secret => !activeNames.has(secret.name));
        setInactiveCount(inactiveUsers.length);

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading PPPoE overview...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <OverviewCard
        title="Total Active PPPoE"
        value={activeCount}
        icon={Users}
        bgColor="bg-blue-600"
      />
      <OverviewCard
        title="Total Inactive PPPoE"
        value={inactiveCount}
        icon={UserX}
        bgColor="bg-red-600"
      />
    </div>
  );
}
