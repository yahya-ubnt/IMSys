'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface StaticCounts {
  activeStatic: number;
  inactiveStatic: number;
}

export function StaticUserCountCard({ routerId }: { routerId: string }) {
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
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStaticCounts();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading static user counts...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!staticCounts) {
    return <div>No static user counts available.</div>;
  }

  return (
    <>
      <Card> {/* Active Static - Green */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-400">Active Static</CardTitle>
          <UserCheck className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-300">{staticCounts.activeStatic}</p>
        </CardContent>
      </Card>
      <Card> {/* Inactive Static - Red */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-400">Inactive Static</CardTitle>
          <UserX className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-300">{staticCounts.inactiveStatic}</p>
        </CardContent>
      </Card>
    </>
  );
}
