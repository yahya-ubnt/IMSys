'use client';

import { useEffect, useState } from 'react';
import { UserCheck, UserX } from 'lucide-react';

interface StaticCounts {
  activeStatic: number;
  inactiveStatic: number;
}

export function StaticUserCountCard({ routerId }: { routerId: string }) {
  const [staticCounts, setStaticCounts] = useState<StaticCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId) return;

    const fetchStaticCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/static/counts`);
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
  }, [routerId]);

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
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center space-x-3">
        <UserCheck className="h-5 w-5 text-green-500" />
        <div>
          <p className="text-sm text-gray-400">Active Static</p>
          <p className="text-lg font-bold text-white">{staticCounts.activeStatic}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <UserX className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="text-sm text-gray-400">Inactive Static</p>
          <p className="text-lg font-bold text-white">{staticCounts.inactiveStatic}</p>
        </div>
      </div>
    </div>
  );
}
