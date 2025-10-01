'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PppoeActiveTable } from './PppoeActiveTable';
import { PppoeSecretsTable } from './PppoeSecretsTable';

interface PppoeDashboardProps {
  id: string;
}

export function PppoeDashboard({ id }: PppoeDashboardProps) {
  return (
    <Tabs defaultValue="active-sessions" className="w-full">
      <TabsList>
        <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
        <TabsTrigger value="secrets">Secrets (Accounts)</TabsTrigger>
      </TabsList>
      <TabsContent value="active-sessions" className="py-4">
        <PppoeActiveTable routerId={id} />
      </TabsContent>
      <TabsContent value="secrets" className="py-4">
        <PppoeSecretsTable routerId={id} />
      </TabsContent>
    </Tabs>
  );
}