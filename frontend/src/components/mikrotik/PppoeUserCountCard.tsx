'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface PppoeCounts {
  activePppoe: number;
  inactivePppoe: number;
}

export function PppoeUserCountCard({ routerId }: { routerId: string }) {
  const [pppoeCounts, setPppoeCounts] = useState<PppoeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routerId) return;

    const fetchPppoeCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/counts`);
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
  }, [routerId]);

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
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-blue-400">PPPoE Users</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm text-gray-400">Active</p>
            <p className="text-lg font-bold text-white">{pppoeCounts.activePppoe}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-400">Inactive</p>
            <p className="text-lg font-bold text-white">{pppoeCounts.inactivePppoe}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
