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
  Home, Network, QrCode, Server, 
  TrendingUp, BarChart2, 
  MonitorSmartphone, Shield, Lightbulb, ShoppingCart, ShieldCheck
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
          {/* Decision Intelligence Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Decision Intelligence</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Intelligence Overview">
                    <Link href="/retailer-mvp/dashboard"><Home /><span>Intelligence Overview</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="ROI & Financial Impact">
                    <Link href="/retailer-mvp/roi"><TrendingUp /><span>ROI & Impact</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Behavioural Map">
                    <Link href="/retailer-mvp/decision-intelligence"><Lightbulb /><span>Behavioural Map</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Interaction Analytics">
                    <Link href="/retailer-mvp/qr-analytics"><BarChart2 /><span>Interaction Analytics</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator/>

          {/* Infrastructure Layer Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Infrastructure Layer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="POS Terminal (Simulation)">
                    <Link href="/retailer-mvp/pos-terminal"><ShoppingCart className="text-primary" /><span>POS Terminal Sync</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Real-Time Data Streams">
                    <Link href="/retailer-mvp/real-time"><Server /><span>Real-Time Data</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {optionalModules.qrAiManagement && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Activation Point Management">
                      <Link href="/retailer-mvp/qr-management"><QrCode /><span>Activation Points</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Display Infrastructure">
                    <Link href="/retailer-mvp/in-store-display"><MonitorSmartphone /><span>Display Infrastructure</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="GS1 Conformance Pack">
                    <Link href="/retailer-mvp/gs1-conformance"><ShieldCheck /><span>GS1 Conformance</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator/>

          {/* Growth & Monetisation Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Growth & Monetisation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {optionalModules.retailMediaNetwork && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Retail Media Network">
                      <Link href="/retailer-mvp/retail-media-network"><Network /><span>Media Network</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator/>

          {/* Governance Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Governance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Ethics Policy">
                    <Link href="/retailer-mvp/ai-policy"><Shield /><span>AI Ethics</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="System & API Integration">
                    <Link href="/retailer-mvp/system-integration"><Shield /><span>Core Integration</span></Link>
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