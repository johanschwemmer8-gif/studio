'use client';

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
import { BarChart, Beaker, Blocks, Home, Network, QrCode, Server, TrendingUp, UserCog, BookOpen, BarChart2, CreditCard, MonitorSmartphone, Settings, BrainCircuit, Palette, Video, Shield, MessageSquare, Lightbulb, Fingerprint } from 'lucide-react';
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

            {/* Decision Intelligence Group */}
            <SidebarGroup>
              <SidebarGroupLabel>Decision Intelligence</SidebarGroupLabel>
              <SidebarGroupContent>
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Performance Hub">
                    <Link href="/retailer-mvp/ai-performance"><BrainCircuit /><span>AI Performance</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator/>

            {/* Infrastructure Layer Group */}
            <SidebarGroup>
              <SidebarGroupLabel>Infrastructure Layer</SidebarGroupLabel>
              <SidebarGroupContent>
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
                 {optionalModules.retailerAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Platform Controls">
                      <Link href="/retailer-mvp/admin"><UserCog /><span>Platform Controls</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Intelligence Config">
                    <Link href="/retailer-mvp/ai-content"><MessageSquare /><span>Intelligence Config</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Brand Identity">
                    <Link href="/retailer-mvp/brands"><Palette /><span>Brand Identity</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Experience Designer">
                    <Link href="/retailer-mvp/ui-management"><Palette /><span>Experience Designer</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Display Infrastructure">
                    <Link href="/retailer-mvp/in-store-display"><MonitorSmartphone /><span>Display Infrastructure</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator/>

            {/* Growth & Monetisation Group */}
            <SidebarGroup>
              <SidebarGroupLabel>Growth & Monetisation</SidebarGroupLabel>
              <SidebarGroupContent>
                {optionalModules.abTesting && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Behavioural A/B Testing">
                      <Link href="/retailer-mvp/ab-testing"><Beaker /><span>A/B Testing</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {optionalModules.retailMediaNetwork && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Retail Media Network">
                      <Link href="/retailer-mvp/retail-media-network"><Network /><span>Media Network</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator/>

            {/* Governance Group */}
            <SidebarGroup>
              <SidebarGroupLabel>Governance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Subscription & Billing">
                    <Link href="/retailer-mvp/billing"><CreditCard /><span>Billing</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Ethics Policy">
                    <Link href="/retailer-mvp/ai-policy"><Shield /><span>AI Ethics</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="System & API Integration">
                        <Link href="/retailer-mvp/system-integration"><Blocks /><span>Core Integration</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Training & Documentation">
                    <Link href="/retailer-mvp/documentation"><BookOpen /><span>Training Hub</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <LogoutButton />
        </SidebarFooter>
      </Sidebar>
  );
}
