'use client';

import { StyledTabs, StyledTabsContent } from '@/components/ui/StyledTabs';
import { PppoeActiveTable } from './PppoeActiveTable';
import { PppoeSecretsTable } from './PppoeSecretsTable';

export function PppoeTabs({ routerId }: { routerId: string }) {
  const tabs = [
    { id: 'active-sessions', label: 'Active Sessions' },
    { id: 'secrets', label: 'Secrets' },
  ];

  return (
    <StyledTabs defaultValue="active-sessions" className="w-full" tabs={tabs}>
      <StyledTabsContent value="active-sessions" className="mt-4">
        <PppoeActiveTable routerId={routerId} />
      </StyledTabsContent>
      <StyledTabsContent value="secrets" className="mt-4">
        <PppoeSecretsTable routerId={routerId} />
      </StyledTabsContent>
    </StyledTabs>
  );
}