
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { BarChart, Beaker, Blocks, Home, Network, Server, TrendingUp, UserCog } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/dashboard/logout-button';
import theme from '@/config/theme.json';

export default function RetailerSidebar() {
  const { optionalModules } = theme;

  return (
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Link href="/" className="font-bold text-lg">
               Retailer MVP
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/retailer-mvp/dashboard">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Retailer ROI">
                <Link href="/retailer-mvp/roi">
                  <TrendingUp />
                  <span>Retailer ROI</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Visuals & Reporting">
                <Link href="/retailer-mvp/visuals-reporting">
                  <BarChart />
                  <span>Visuals & Reporting</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Real-Time Data">
                <Link href="/retailer-mvp/real-time">
                  <Server />
                  <span>Real-Time Data</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {optionalModules.abTesting && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="A/B Testing">
                  <Link href="/retailer-mvp/ab-testing">
                    <Beaker />
                    <span>A/B Testing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="System & Integration Configuration">
                <Link href="/retailer-mvp/system-integration">
                  <Blocks />
                  <span>System & Integration</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {optionalModules.retailMediaNetwork && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Retail Media Network">
                  <Link href="/retailer-mvp/retail-media-network">
                    <Network />
                    <span>Retail Media Network</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {optionalModules.retailerAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Retailer Admin Panel">
                  <Link href="/retailer-mvp/admin">
                    <UserCog />
                    <span>Retailer Admin Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <LogoutButton />
        </SidebarFooter>
      </Sidebar>
  );
}
