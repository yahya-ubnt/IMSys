"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Building2, Home, Users, UserPlus, Settings, ChevronRight, LayoutGrid, Sun, Moon, Package, Wifi, DollarSign, Receipt, Wrench, MessageSquare, FileText, CreditCard, Server, HeartPulse, MessageCircle, Timer } from "lucide-react"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useSettings } from "@/hooks/use-settings"
import { useAuth } from "@/components/auth-provider";


import Link from "next/link" // ADD THIS IMPORT

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SubMenuItem {
  title: string;
  url?: string;
  items?: SubMenuItem[];
}

interface MenuItem {
  title: string;
  url?: string;
  icon?: React.ElementType;
  items?: SubMenuItem[];
}
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Menu items data
interface MenuCategory {
  label: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    label: "Main Navigation",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    label: "Network Management",
    items: [
      {
        title: "Routers",
        icon: Wifi,
        items: [
          {
            title: "All Mikrotiks",
            url: "/mikrotik/routers",
          },
          {
            title: "New Mikrotik",
            url: "/mikrotik/routers/new",
          },
        ],
      },
      {
        title: "Packages",
        icon: Package,
        items: [
          {
            title: "All Packages",
            url: "/mikrotik/packages",
          },
          {
            title: "New Package",
            url: "/mikrotik/packages/new",
          },
        ],
      },
      {
        title: "Users",
        icon: Users,
        items: [
          {
            title: "Add New User",
            url: "/mikrotik/users/new",
          },
          {
            title: "View All Users",
            url: "/mikrotik/users",
          },
        ],
      },
      {
        title: "Devices",
        icon: Server,
        items: [
          {
            title: "View All",
            url: "/devices",
          },
          {
            title: "Add New",
            url: "/devices/new",
          },
        ],
      },
      {
        title: "Hotspot",
        icon: Wifi, // You might want to change this icon
        items: [
          {
            title: "Plans",
            url: "/hotspot/plans",
          },
          {
            title: "Recurring Users",
            url: "/hotspot/users",
          },
          {
            title: "Vouchers",
            url: "/hotspot/vouchers",
          },
        ],
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        title: "SMS",
        icon: MessageSquare,
        items: [
          {
            title: "Compose",
            url: "/sms/compose",
          },
          {
            title: "Sent Log",
            url: "/sms/sent",
          },
          {
            title: "Expiry Schedules",
            url: "/sms/expiry",
          },
          {
            title: "Acknowledgements",
            url: "/sms/acknowledgements",
          },
          {
            title: "Templates",
            url: "/sms/templates",
          },
        ],
      },
      {
        title: "WhatsApp",
        icon: MessageCircle,
        items: [
          {
            title: "Templates",
            url: "/whatsapp/templates",
          },
          {
            title: "Compose",
            url: "/whatsapp/compose",
          },
          {
            title: "Sent Log",
            url: "/whatsapp/sent",
          },
        ],
      },
    ],
  },
  {
    label: "Core Management",
    items: [
      {
        title: "Leads",
        icon: UserPlus,
        items: [
          {
            title: "View All Leads",
            url: "/leads",
          },
          {
            title: "Add New Lead",
            url: "/leads/new",
          },
        ],
      },
      
    ],
  },
  {
    label: "Financials",
    items: [
      {
        title: "Transactions",
        icon: DollarSign,
        items: [
          {
            title: "Personal",
            url: "/transactions/personal",
          },
          {
            title: "Company",
            url: "/transactions/company",
          },
        ],
      },
      {
        title: "Recurring Bills",
        icon: Receipt,
        items: [
          {
            title: "Personal",
            url: "/bills/personal",
          },
          {
            title: "Company",
            url: "/bills/company",
          },
        ],
      },
      {
        title: "Expenses",
        icon: CreditCard, // Added icon
        items: [
          {
            title: "Expense Type",
            url: "/expenses/types",
          },
          {
            title: "All Expenses",
            url: "/expenses/all",
          },
        ],
      },
    ],
  },
  {
    label: "Payments",
    items: [
      {
        title: "Transaction Log",
        icon: FileText, 
        url: "/payments/transactions",
      },
      {
        title: "Wallet Transactions",
        icon: DollarSign, // Using DollarSign for now, can be changed
        url: "/payments/wallet-transactions",
      },
      {
        title: "Cash Purchase",
        icon: DollarSign,
        url: "/payments/cash-purchase",
      },
      {
        title: "STK Push",
        icon: CreditCard,
        url: "/payments/stk-push",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        title: "Reports",
        icon: FileText,
        items: [
          {
            title: "Delayed Payments",
            url: "/reports/delayed-payments",
          },
          {
            title: "Location Report",
            url: "/reports/location",
          },
          {
            title: "M-Pesa Alert",
            url: "/reports/mpesa-alert",
          },
          {
            title: "M-Pesa Report",
            url: "/reports/mpesa-report",
          },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Technician Activities",
        icon: Wrench,
        items: [
          {
            title: "Installations",
            url: "/technician-activities/installations",
          },
          {
            title: "Support",
            url: "/technician-activities/support",
          },
        ],
      },
      {
        title: "Tickets",
        icon: MessageSquare, // Using MessageSquare for now, can be changed
        items: [
          {
            title: "View All Tickets",
            url: "/tickets",
          },
          {
            title: "Create New Ticket",
            url: "/tickets/new",
          },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Accounts",
        icon: Settings,
        items: [
          {
            title: "Settings",
            url: "/settings",
          },
        ],
      },
      {
        title: "Scheduled Tasks",
        url: "/admin/scheduled-tasks",
        icon: Timer,
      },
    ],
  },
];

const superAdminMenuCategory: MenuCategory = {
  label: "Super Admin",
  items: [
    {
      title: "SA Dashboard",
      url: "/superadmin/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Tenants",
      url: "/superadmin/tenants",
      icon: Building2,
    },
  ],
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { settings } = useSettings();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)

  // Determine which menu should be open based on current pathname
  React.useEffect(() => {
    if (pathname.startsWith("/leads")) {
      setOpenMenu("Leads")
    
    } else if (pathname.startsWith("/transactions")) {
      setOpenMenu("Transactions")
    } else if (pathname.startsWith("/payments")) {
      setOpenMenu("Payments")
    } else if (pathname.startsWith("/bills")) {
      setOpenMenu("Recurring Bills")
    } else if (pathname.startsWith("/reports")) {
      setOpenMenu("Reports")
    } else if (pathname.startsWith("/technician-activities")) {
      setOpenMenu("Technician Activities")
    } else if (pathname.startsWith("/tickets")) { // ADD THIS LINE
      setOpenMenu("Tickets")
    } else if (pathname.startsWith("/sms")) {
      setOpenMenu("Communication")
    } else if (pathname.startsWith("/mikrotik/users")) {
      setOpenMenu("Network Management")
    } else if (pathname.startsWith("/devices")) {
      setOpenMenu("Network Management")
    } else if (pathname.startsWith("/hotspot")) {
      setOpenMenu("Hotspot")
    } else if (pathname.startsWith("/settings/mikrotik")) {
      setOpenMenu("Network Management")
    } else if (pathname.startsWith("/settings")) {
      setOpenMenu("Administration")
    } else {
      setOpenMenu(null)
    }
  }, [pathname])

  const handleMenuToggle = (menuTitle: string) => {
    setOpenMenu(openMenu === menuTitle ? null : menuTitle)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const allMenuCategories = user?.roles.includes('SUPER_ADMIN') 
    ? [superAdminMenuCategory, ...menuCategories] 
    : menuCategories;

  return (
    <Sidebar collapsible="none" {...props} className="bg-zinc-900 border-r border-zinc-800 shadow-2xl">
      <SidebarHeader className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105">
            {settings.logoIcon && settings.logoIcon.startsWith('/') ? (
              <Image src={settings.logoIcon} alt="Logo" width={20} height={20} className="size-5" />
            ) : (
              <Wifi className="size-5" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-extrabold text-lg text-blue-400 tracking-wide">
              {settings.appName}
            </span>
            <span className="truncate text-xs text-zinc-400 font-medium uppercase">{settings.slogan}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {allMenuCategories.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 py-2 border-b border-zinc-800 mb-2">
              {category.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {category.items.map((item) => {
                const isActive = item.url ? pathname === item.url : false
                const hasActiveChild = item.items?.some((subItem) => pathname === subItem.url)

                if (item.items) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      open={openMenu === item.title}
                      onOpenChange={() => handleMenuToggle(item.title)}
                    >
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className={`
                                relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                                ${hasActiveChild ? "bg-zinc-800 text-blue-400 font-semibold" : "text-zinc-300"}
                              `}
                            >
                              <CollapsibleTrigger className="flex items-center w-full px-3 py-2">
                                {item.icon && <item.icon className={`mr-3 size-5 ${hasActiveChild ? "text-blue-400" : "text-zinc-400"}`} />}
                                <span className="flex-1 text-sm">{item.title}</span>
                                <ChevronRight className={`ml-auto size-4 transition-transform duration-200 ${openMenu === item.title ? "rotate-90" : ""}`} />
                              </CollapsibleTrigger>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                        <CollapsibleContent className="ml-4 mt-1">
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              // Check if this subItem itself has nested items
                              if (subItem.items) {
                                const hasActiveNestedChild = subItem.items?.some((nestedSubItem) => pathname === nestedSubItem.url);
                                return (
                                  <Collapsible
                                    key={subItem.title}
                                    asChild
                                    open={openMenu === subItem.title}
                                    onOpenChange={() => handleMenuToggle(subItem.title)}
                                  >
                                    <SidebarMenuSubItem>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <SidebarMenuSubButton
                                            asChild
                                            className={`
                                              relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                                              ${hasActiveNestedChild ? "bg-zinc-800 text-blue-400 font-semibold" : "text-zinc-300"}
                                            `}
                                          >
                                            <CollapsibleTrigger className="flex items-center w-full px-3 py-2">
                                              <span className="flex-1 text-sm">{subItem.title}</span>
                                              <ChevronRight className={`ml-auto size-4 transition-transform duration-200 ${openMenu === subItem.title ? "rotate-90" : ""}`} />
                                            </CollapsibleTrigger>
                                          </SidebarMenuSubButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center">
                                          {subItem.title}
                                        </TooltipContent>
                                      </Tooltip>
                                      <CollapsibleContent className="ml-4 mt-1">
                                        <SidebarMenuSub>
                                          {subItem.items.map((nestedSubItem) => {
                                            const isNestedSubActive = pathname === nestedSubItem.url;
                                            return (
                                              <SidebarMenuSubItem key={nestedSubItem.title}>
                                                <SidebarMenuSubButton
                                                  asChild
                                                  className={`
                                                    relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                                                    ${isNestedSubActive ? "bg-blue-700 text-white font-semibold" : "text-zinc-300"}
                                                  `}
                                                >
                                                  <Link href={nestedSubItem.url || ''} className="flex items-center w-full px-3 py-2">
                                                    <span className="flex-1 text-sm">{nestedSubItem.title}</span>
                                                  </Link>
                                                </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                            );
                                          })}
                                        </SidebarMenuSub>
                                      </CollapsibleContent>
                                    </SidebarMenuSubItem>
                                  </Collapsible>
                                );
                              }

                              // Original rendering for direct links
                              const isSubActive = pathname === subItem.url
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    className={`
                                      relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                                      ${isSubActive ? "bg-blue-700 text-white font-semibold" : "text-zinc-300"}
                                    `}
                                  >
                                    <Link href={subItem.url || ''} className="flex items-center w-full px-3 py-2">
                                      <span className="flex-1 text-sm">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={`
                        relative transition-all duration-300 hover:bg-zinc-800 rounded-lg mx-2
                        ${isActive ? "bg-blue-700 text-white font-semibold shadow-md" : "text-zinc-300"}
                      `}
                    >
                      <Link href={item.url || ''} className="flex items-center w-full px-3 py-2">
                        {item.icon && <item.icon className={`mr-3 size-5 ${isActive ? "text-white" : "text-zinc-400"}`} />}
                        <span className="flex-1 text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
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
              {theme === "dark" ? (
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

          {/* User Profile */}
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
  )
}
