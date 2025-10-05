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
import { Separator } from '@/components/ui/separator';
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
    <Sidebar className="bg-zinc-900/50 backdrop-blur-lg border-r border-zinc-700">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
            <Wifi className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">
              Router Control
            </span>
            <span className="truncate text-xs text-zinc-500">MIKROTIK</span>
          </div>
        </div>
        <Separator className="bg-zinc-700" />
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarMenu>
            {mikrotikMenu.map((item) => {
              const itemUrl = item.url.replace('[id]', routerId);
              const isActive = pathname === itemUrl;
              return (
                <SidebarMenuItem key={item.title} className="relative">
                  {isActive && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_theme('colors.cyan.400')]" />
                  )}
                  <SidebarMenuButton asChild isActive={isActive} className="hover:bg-zinc-700/50 data-[active=true]:bg-zinc-700">
                    <Link href={itemUrl}>
                      {item.icon && <item.icon className={`mr-3 size-5 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />}
                      <span className={`flex-1 text-sm ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator className="bg-zinc-700 my-2" />
        <div className="p-2 space-y-2">
          <Button onClick={toggleTheme} variant="ghost" size="sm" className="w-full justify-start gap-2 text-zinc-400 hover:bg-zinc-700/50 hover:text-white">
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-sm font-bold">
              A
            </div>
            <div className="grid flex-1 leading-tight">
              <div className="font-semibold text-sm text-white">Admin User</div>
              <div className="text-xs text-zinc-400">Administrator</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}