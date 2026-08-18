'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { 
  Network, 
  QrCode, 
  BarChart2, 
  MonitorSmartphone, 
  Shield, 
  ShoppingCart, 
  ShieldCheck,
  DollarSign, 
  Zap, 
  Settings, 
  BookOpen, 
  Target, 
  LayoutDashboard
} from 'lucide-react';
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
          {/* Results & Insights Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Results & Insights</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Main Dashboard">
                    <Link href="/retailer-mvp/dashboard"><LayoutDashboard /><span>Overview</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Money Saved & Profit Uplift">
                    <Link href="/retailer-mvp/roi"><DollarSign /><span>Profit & ROI</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Customer Behavior Patterns">
                    <Link href="/retailer-mvp/decision-intelligence"><Target /><span>Shopper Behavior</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Scan History & Activity">
                    <Link href="/retailer-mvp/qr-analytics"><BarChart2 /><span>Scan Analytics</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator/>

          {/* Customer Experience Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Customer Experience</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {optionalModules.qrAiManagement && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Manage QR Code Points">
                      <Link href="/retailer-mvp/qr-management"><QrCode /><span>QR Codes</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Manage In-Store Screens">
                    <Link href="/retailer-mvp/in-store-display"><MonitorSmartphone /><span>Store Screens</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Connect with Registers">
                    <Link href="/retailer-mvp/pos-terminal"><ShoppingCart /><span>Checkout Sync</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Live Inventory Status">
                    <Link href="/retailer-mvp/real-time"><Zap /><span>Live Inventory</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="GS1 Data Compliance">
                    <Link href="/retailer-mvp/gs1-conformance"><ShieldCheck /><span>Data Standards</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator/>

          {/* Growth & Monetisation Group */}
          {optionalModules.retailMediaNetwork && (
            <SidebarGroup>
                <SidebarGroupLabel>Advertising</SidebarGroupLabel>
                <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Manage Sponsored Placements">
                          <Link href="/retailer-mvp/retail-media-network"><Network /><span>Ad Revenue</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarSeparator/>

          {/* Governance Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Rules for AI Behavior">
                    <Link href="/retailer-mvp/ai-policy"><Shield /><span>AI Rules</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="System Connections">
                    <Link href="/retailer-mvp/system-integration"><Settings /><span>App Connections</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Help & Training">
                    <Link href="/retailer-mvp/documentation"><BookOpen /><span>Help Center</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <LogoutButton />
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}