'use client';

import { useParams } from 'next/navigation';
import { MikrotikDashboardSidebar } from '@/components/mikrotik/MikrotikDashboardSidebar';
import { Topbar } from '@/components/topbar';
import React from 'react';

export default function MikrotikRouterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const routerId = params.id as string;

  if (!routerId) {
    return <div>Loading router details...</div>;
  }

  return (
    <div className="flex h-screen">
      <MikrotikDashboardSidebar routerId={routerId} />
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
