'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  QrCode,
  ShoppingCart,
  ShieldCheck,
  DollarSign,
  Settings,
  BookOpen,
  Target,
  LayoutDashboard,
  Building2,
  Bot,
  Palette,
  CreditCard,
  ShoppingBasket,
  BarChart2,
  Activity,
  BarChart3,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/dashboard/logout-button';

export default function RetailerSidebar({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <Sidebar>
      {children}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Network Overview">
                  <Link href="/retailer-mvp/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Shopper Experience</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Brand & Experience">
                  <Link href="/retailer-mvp/ui-management">
                    <Palette className="h-4 w-4" />
                    <span>Brand & Experience</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ari Assistant">
                  <Link href="/retailer-mvp/ai-configuration">
                    <Bot className="h-4 w-4" />
                    <span>Ari Experience</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Supplier Media">
                  <Link href="/retailer-mvp/brands">
                    <Video className="h-4 w-4" />
                    <span>Supplier Media</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Network & Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="My Retail Network">
                  <Link href="/retailer-mvp/organization">
                    <Building2 className="h-4 w-4" />
                    <span>My Retail Network</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="QR Activation">
                  <Link href="/retailer-mvp/qr-management">
                    <QrCode className="h-4 w-4" />
                    <span>QR Activation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Live Operations">
                  <Link href="/retailer-mvp/real-time">
                    <Activity className="h-4 w-4" />
                    <span>Live Operations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="App Connections">
                  <Link href="/retailer-mvp/system-integration">
                    <Settings className="h-4 w-4" />
                    <span>App Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Checkout Sync (SIM)">
                  <Link href="/retailer-mvp/pos-terminal">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Checkout Sync (SIM)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Products & Commerce</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Product Catalog">
                  <Link href="/retailer-mvp/products">
                    <ShoppingBasket className="h-4 w-4" />
                    <span>Product Catalog</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Insights & Results</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Scan Statistics">
                  <Link href="/retailer-mvp/qr-analytics">
                    <BarChart2 className="h-4 w-4" />
                    <span>Scan Statistics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profit & ROI Audit">
                  <Link href="/retailer-mvp/roi">
                    <DollarSign className="h-4 w-4" />
                    <span>Profit & ROI</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reporting">
                  <Link href="/retailer-mvp/visuals-reporting">
                    <BarChart3 className="h-4 w-4" />
                    <span>Reporting</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Shopper Behavior Patterns">
                  <Link href="/retailer-mvp/decision-intelligence">
                    <Target className="h-4 w-4" />
                    <span>Shopper Behavior</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Monetization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ad Monetization">
                  <Link href="/retailer-mvp/retail-media-network">
                    <BarChart3 className="h-4 w-4" />
                    <span>Ad Monetization</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Standards & Governance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Global Standards">
                  <Link href="/retailer-mvp/gs1-conformance">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Global Standards</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Subscription & Billing">
                  <Link href="/retailer-mvp/billing">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscription & Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help Center & Training">
                  <Link href="/retailer-mvp/documentation">
                    <BookOpen className="h-4 w-4" />
                    <span>Help Center</span>
                  </Link>
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