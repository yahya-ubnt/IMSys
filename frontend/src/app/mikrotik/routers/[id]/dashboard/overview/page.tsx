'use client';

import { useParams } from 'next/navigation';


import { PppoeUserCountCard } from '@/components/mikrotik/PppoeUserCountCard';
import { StaticUserCountCard } from '@/components/mikrotik/StaticUserCountCard';
import { TrafficMonitorCard } from '@/components/mikrotik/TrafficMonitorCard';
import { ResourceGraphCard } from '@/components/mikrotik/ResourceGraphCard';
import { CombinedRouterInfoCard } from '@/components/mikrotik/CombinedRouterInfoCard';

export default function OverviewPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-base">A summary of your MikroTik router.</p>
        </div>
      </div>

      <CombinedRouterInfoCard routerId={routerId} />

      {/* New section for PPPoE and Static User Counts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PppoeUserCountCard routerId={routerId} />
        <StaticUserCountCard routerId={routerId} />
      </div>

      {/* New section for Traffic Monitoring */}
      <TrafficMonitorCard routerId={routerId} /> {/* Updated: Removed interfaceName prop */}

      {/* New section for Resource Graphs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ResourceGraphCard routerId={routerId} resourceType="cpu" title="CPU Usage" unit="%" />
        <ResourceGraphCard routerId={routerId} resourceType="memory" title="Memory Usage" unit="MB" />
        <ResourceGraphCard routerId={routerId} resourceType="disk" title="Disk Usage" unit="MB" />
      </div>
    </div>
  );
}