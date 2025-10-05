'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const StyledTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-zinc-800/50 p-1 text-zinc-400 border border-zinc-700',
      className
    )}
    {...props}
  />
));
StyledTabsList.displayName = TabsPrimitive.List.displayName;

const StyledTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
StyledTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const StyledTabsContent = TabsPrimitive.Content;

interface StyledTabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  tabs: { id: string; label: string; icon?: React.ElementType }[];
}

const StyledTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  StyledTabsProps
>(({ className, tabs, children, ...props }, ref) => {
  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    >
      <StyledTabsList>
        {tabs.map((tab) => (
          <StyledTabsTrigger key={tab.id} value={tab.id}>
            {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
            {tab.label}
          </StyledTabsTrigger>
        ))}
      </StyledTabsList>
      {children}
    </TabsPrimitive.Root>
  );
});
StyledTabs.displayName = TabsPrimitive.Root.displayName;

export { StyledTabs, StyledTabsList, StyledTabsTrigger, StyledTabsContent };