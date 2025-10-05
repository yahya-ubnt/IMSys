'use client';

import { StyledTabs, StyledTabsContent, StyledTabsList, StyledTabsTrigger } from '@/components/ui/StyledTabs';
import { PppoeActiveTable } from './PppoeActiveTable';
import { PppoeSecretsTable } from './PppoeSecretsTable';

export function PppoeTabs({ routerId }: { routerId: string }) {
  return (
    <StyledTabs defaultValue="active-sessions" className="w-full">
      <StyledTabsList className="grid w-full grid-cols-2">
        <StyledTabsTrigger value="active-sessions">Active Sessions</StyledTabsTrigger>
        <StyledTabsTrigger value="secrets">Secrets</StyledTabsTrigger>
      </StyledTabsList>
      <StyledTabsContent value="active-sessions" className="mt-4">
        <PppoeActiveTable routerId={routerId} />
      </StyledTabsContent>
      <StyledTabsContent value="secrets" className="mt-4">
        <PppoeSecretsTable routerId={routerId} />
      </StyledTabsContent>
    </StyledTabs>
  );
}