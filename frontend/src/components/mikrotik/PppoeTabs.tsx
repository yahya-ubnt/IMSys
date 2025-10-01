'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PppoeActiveTable } from './PppoeActiveTable';
import { PppoeSecretsTable } from './PppoeSecretsTable';

export function PppoeTabs({ routerId }: { routerId: string }) {
  return (
    <Tabs defaultValue="active-sessions">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
        <TabsTrigger value="secrets">Secrets</TabsTrigger>
      </TabsList>
      <TabsContent value="active-sessions">
        <PppoeActiveTable routerId={routerId} />
      </TabsContent>
      <TabsContent value="secrets">
        <PppoeSecretsTable routerId={routerId} />
      </TabsContent>
    </Tabs>
  );
}
