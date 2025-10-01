'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail, // Added SidebarRail
} from '@/components/ui/sidebar';
import { LayoutGrid, Wifi, DollarSign, FileText, MessageSquare, Settings, Home, Users, Sun, Moon } from 'lucide-react'; // Added Sun, Moon
import { useTheme } from 'next-themes'; // Added useTheme
import { Button } from '@/components/ui/button'; // Added Button

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
  const { theme, setTheme } = useTheme(); // Get theme and setTheme

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar collapsible="icon" className="bg-gradient-to-b from-black to-zinc-950 border-r border-zinc-800 shadow-2xl">
      <SidebarHeader className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105">
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

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarMenu>
            {mikrotikMenu.map((item) => {
              const itemUrl = item.url.replace('[id]', routerId);
              const isActive = pathname === itemUrl;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`
                      relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                      ${isActive ? 'bg-blue-700 text-white font-semibold shadow-md' : 'text-zinc-300'}
                    `}
                  >
                    <Link href={itemUrl} className="flex items-center w-full px-3 py-2">
                      {item.icon && <item.icon className={`mr-3 size-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />}
                      <span className="flex-1 text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-800 pt-4">
        <div className="p-2 space-y-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-2 hover:bg-zinc-800 text-zinc-300 transition-colors rounded-lg"
            >
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
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 shadow-inner">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm">
              A
            </div>
            <div className="grid flex-1 leading-tight">
              <div className="font-semibold text-sm text-zinc-200">Admin User</div>
              <div className="text-xs text-zinc-400">Administrator</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}