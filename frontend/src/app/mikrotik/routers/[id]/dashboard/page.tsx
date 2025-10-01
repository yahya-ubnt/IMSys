'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MikrotikOverviewCards } from '@/components/mikrotik/MikrotikOverviewCards';
import { TrafficMonitorGraph } from '@/components/mikrotik/TrafficMonitorGraph';
import { InterfacesTable } from '@/components/mikrotik/InterfacesTable';
import { PppoeDashboard } from '@/components/mikrotik/PppoeDashboard';
import { PppoeOverviewCards } from '@/components/mikrotik/PppoeOverviewCards';
import { QueuesTable } from '@/components/mikrotik/QueuesTable';
import { FirewallRulesTable } from '@/components/mikrotik/FirewallRulesTable';
import { DhcpLeasesTable } from '@/components/mikrotik/DhcpLeasesTable';
import { StaticOverviewCards } from '@/components/mikrotik/StaticOverviewCards';
import { RouterLogsTable } from '@/components/mikrotik/RouterLogsTable';
import { useAuth } from '@/components/auth-provider';

export default function MikrotikRouterDashboardPage() {
  const params = useParams();
  const routerId = params.id as string;

  const [routerName, setRouterName] = useState('Loading...'); // State for router name
  const [routerLoading, setRouterLoading] = useState(true); // State for router loading
  const { token, user } = useAuth(); // Get token and user from useAuth

  useEffect(() => {
    const fetchRouterDetails = async () => {
      if (!token) {
        setRouterName('Not Authenticated');
        setRouterLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/mikrotik/routers/${routerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch router details');
        }
        const data = await response.json();
        setRouterName(data.name);
      } catch (err: any) {
        setRouterName('Error loading router name');
        console.error('Error fetching router details:', err);
      } finally {
        setRouterLoading(false);
      }
    };

    fetchRouterDetails();
  }, [routerId, token]); // Add token to dependency array

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        MikroTik Dashboard: {routerLoading ? 'Loading...' : routerName}
      </h1>
      {user ? (
        <p className="text-sm text-green-600">Authenticated as: {user.name}</p>
      ) : (
        <p className="text-sm text-red-600">Not Authenticated</p>
      )}
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="pppoe">PPPoE</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="firewall">Firewall</TabsTrigger>
          <TabsTrigger value="dhcp">DHCP</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="py-6 space-y-6">
          <MikrotikOverviewCards routerId={routerId} />
          <TrafficMonitorGraph routerId={routerId} interfaceName="ether1" /> {/* Assuming "ether1" is the LAN interface */}
        </TabsContent>
        <TabsContent value="interfaces">
          <InterfacesTable routerId={routerId} />
        </TabsContent>
        <TabsContent value="pppoe" className="py-6 space-y-6">
          <PppoeOverviewCards routerId={routerId} />
          <PppoeDashboard id={routerId} />
        </TabsContent>
        <TabsContent value="queues">
          <QueuesTable routerId={routerId} />
        </TabsContent>
        <TabsContent value="firewall">
          <FirewallRulesTable routerId={routerId} />
        </TabsContent>
        <TabsContent value="dhcp" className="py-6 space-y-6">
          <StaticOverviewCards routerId={routerId} />
          <DhcpLeasesTable routerId={routerId} />
        </TabsContent>
        <TabsContent value="logs">
          <RouterLogsTable id={routerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
