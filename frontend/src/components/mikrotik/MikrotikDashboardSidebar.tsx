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
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, DollarSign, FileText, MessageSquare, Settings, Home, Users, Network, Sun, Moon } from 'lucide-react';
import MikrotikRouterIcon from '@/components/icons/MikrotikRouterIcon';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const mikrotikMenu: MenuItem[] = [
  { title: 'Overview', url: '/mikrotik/routers/[id]/dashboard/overview', icon: Home },
  { title: 'Interfaces', url: '/mikrotik/routers/[id]/dashboard/interfaces', icon: Network },
  { title: 'PPPoE', url: '/mikrotik/routers/[id]/dashboard/pppoe', icon: Users },
  { title: 'Queues', url: '/mikrotik/routers/[id]/dashboard/queues', icon: LayoutGrid },
  { title: 'Firewall', url: '/mikrotik/routers/[id]/dashboard/firewall', icon: Settings },
  { title: 'DHCP Leases', url: '/mikrotik/routers/[id]/dashboard/dhcp-leases', icon: DollarSign },
  { title: 'Logs', url: '/mikrotik/routers/[id]/dashboard/logs', icon: FileText },
  { title: 'Terminal', url: '/mikrotik/routers/[id]/dashboard/terminal', icon: MessageSquare },
];

export function MikrotikDashboardSidebar({ routerId }: { routerId: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Sidebar className="bg-zinc-900/50 backdrop-blur-lg border-r border-zinc-700">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
            <MikrotikRouterIcon className="size-5" />
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
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-lg border border-cyan-400/50 shadow-[0_0_15px_theme('colors.cyan.400/50')]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="bg-transparent hover:bg-zinc-700/50 data-[active=true]:bg-transparent">
                    <Link href={itemUrl}>
                      {item.icon && <item.icon className={`mr-3 size-5 transition-colors ${isActive ? 'text-cyan-300' : 'text-zinc-400'}`} />}
                      <span className={`flex-1 text-sm transition-colors ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.title}</span>
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