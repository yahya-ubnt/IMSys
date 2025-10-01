'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface PppoeCounts {
  activePppoe: number;
  inactivePppoe: number;
}

export function PppoeUserCountCard({ routerId }: { routerId: string }) {
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
          throw new Error('Failed to fetch PPPoE user counts');
        }
        const data = await response.json();
        setPppoeCounts(data);
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

    fetchPppoeCounts();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading PPPoE user counts...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!pppoeCounts) {
    return <div>No PPPoE user counts available.</div>;
  }

  return (
    <>
      <Card className="bg-gray-800 text-white border-blue-600"> {/* Active PPPoE - Blue */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-400">Active PPPoE</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-300">{pppoeCounts.activePppoe}</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-800 text-white border-red-600"> {/* Inactive PPPoE - Red */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-400">Inactive PPPoE</CardTitle>
          <UserX className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-300">{pppoeCounts.inactivePppoe}</p>
        </CardContent>
      </Card>
    </>
  );
}
