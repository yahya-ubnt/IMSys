'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutGrid, Wifi, DollarSign, FileText, MessageSquare, Settings, Home, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const mikrotikMenu: MenuItem[] = [
  {
    title: 'Overview',
    url: '/mikrotik/routers/[id]/dashboard/overview',
    icon: Home,
  },
  {
    title: 'Interfaces',
    url: '/mikrotik/routers/[id]/dashboard/interfaces',
    icon: Wifi,
  },
  {
    title: 'PPPoE',
    url: '/mikrotik/routers/[id]/dashboard/pppoe',
    icon: Users,
  },
  {
    title: 'Queues',
    url: '/mikrotik/routers/[id]/dashboard/queues',
    icon: LayoutGrid,
  },
  {
    title: 'Firewall',
    url: '/mikrotik/routers/[id]/dashboard/firewall',
    icon: Settings,
  },
  {
    title: 'DHCP Leases',
    url: '/mikrotik/routers/[id]/dashboard/dhcp-leases',
    icon: DollarSign,
  },
  {
    title: 'Logs',
    url: '/mikrotik/routers/[id]/dashboard/logs',
    icon: FileText,
  },
  {
    title: 'Terminal',
    url: '/mikrotik/routers/[id]/dashboard/terminal',
    icon: MessageSquare,
  },
];

export function MikrotikDashboardSidebar({ routerId }: { routerId: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl">
            <Wifi className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-extrabold text-lg text-blue-400 tracking-wide">
              MEDIATEK
            </span>
            <span className="truncate text-xs text-zinc-400 font-medium uppercase">MIKROTIK</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {mikrotikMenu.map((item) => {
              const itemUrl = item.url.replace('[id]', routerId);
              const isActive = pathname === itemUrl;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={itemUrl}>
                      {item.icon && <item.icon className="mr-3 size-5" />}
                      <span className="flex-1 text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 space-y-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-center">
            <Button onClick={toggleTheme} variant="ghost" size="sm" className="w-full justify-start gap-2">
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Dark Mode</span>
                </>
              )}
            </Button>
          </div>

          {/* User Profile - Placeholder for now */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="flex size-8 items-center justify-center rounded-lg text-sm font-bold">
              A
            </div>
            <div className="grid flex-1 leading-tight">
              <div className="font-semibold text-sm">Admin User</div>
              <div className="text-xs text-muted-foreground">Administrator</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}