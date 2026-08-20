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
  QrCode, 
  MonitorSmartphone, 
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
  ShoppingBasket
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
          {/* Insights & Results Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Insights & Results</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Performance Overview">
                    <Link href="/retailer-mvp/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Profit & ROI Audit">
                    <Link href="/retailer-mvp/roi">
                      <DollarSign className="h-4 w-4" />
                      <span>Profit & ROI</span>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
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

        <SidebarSeparator/>

          {/* Shopper Experience Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Shopper Experience</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="QR Activation Creator">
                    <Link href="/retailer-mvp/qr-management">
                      <QrCode className="h-4 w-4" />
                      <span>QR Activation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Brand & Landing Page Editor">
                    <Link href="/retailer-mvp/ui-management">
                      <Palette className="h-4 w-4" />
                      <span>Brand & Experience</span>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Ari (AI) Assistant Settings">
                    <Link href="/retailer-mvp/ai-configuration">
                      <Bot className="h-4 w-4" />
                      <span>Ari Experience</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        <SidebarSeparator/>

        {/* Network Setup Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Network Setup</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="My Retail Network Hierarchy">
                  <Link href="/retailer-mvp/organization">
                    <Building2 className="h-4 w-4" />
                    <span>My Retail Network</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage your product catalog">
                  <Link href="/retailer-mvp/products">
                    <ShoppingBasket className="h-4 w-4" />
                    <span>Product Catalog</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="App Connections & Data Sync">
                  <Link href="/retailer-mvp/system-integration">
                    <Settings className="h-4 w-4" />
                    <span>App Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Terminal Checkout Sync">
                  <Link href="/retailer-mvp/pos-terminal">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Checkout Sync (SIM)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Global Data Standards">
                  <Link href="/retailer-mvp/gs1-conformance">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Global Standards</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator/>

          {/* Management & Support Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
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
