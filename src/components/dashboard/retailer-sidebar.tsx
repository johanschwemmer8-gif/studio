
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
import { BarChart, Beaker, Blocks, Home, Network, QrCode, Server, TrendingUp, UserCog, BookOpen, BarChart2, CreditCard, MonitorSmartphone, Settings, BrainCircuit, Palette } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/dashboard/logout-button';
import theme from '@/config/theme.json';

export default function RetailerSidebar({
    children,
}: {
    children?: React.ReactNode;
}) {
  const { optionalModules } = theme;

  return (
      <Sidebar>
        {children}
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
              <SidebarMenuButton asChild tooltip="Scan Analytics">
                <Link href="/retailer-mvp/qr-analytics">
                  <BarChart2 />
                  <span>Scan Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="AI Performance">
                <Link href="/retailer-mvp/ai-performance">
                  <BrainCircuit />
                  <span>AI Performance</span>
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
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="QR Management">
                    <Link href="/retailer-mvp/qr-management">
                        <QrCode />
                        <span>QR Management</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Brands">
                    <Link href="/retailer-mvp/brands">
                        <Palette />
                        <span>Brands</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="In-Store Display">
                  <Link href="/retailer-mvp/in-store-display">
                    <MonitorSmartphone />
                    <span>In-Store Display</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Mobile App">
                  <Link href="/retailer-mvp/mobile-dashboard">
                    <MonitorSmartphone />
                    <span>Mobile App</span>
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
                <SidebarMenuButton asChild tooltip="Subscription & Billing">
                    <Link href="/retailer-mvp/billing">
                        <CreditCard />
                        <span>Billing</span>
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
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation & Training Modules">
                    <Link href="/retailer-mvp/documentation">
                        <BookOpen />
                        <span>Documentation & Training</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
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
