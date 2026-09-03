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
  LayoutDashboard,
  Building2,
  Bot,
  Palette,
  CreditCard,
  ShoppingBasket,
  Megaphone,
  FlaskConical,
  Activity,
  Brain,
  BarChart3,
  Monitor,
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

        {/* OVERVIEW */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
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
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* CATALOG & PRODUCTS */}
        <SidebarGroup>
          <SidebarGroupLabel>Catalog & Products</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage your product catalog">
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

        {/* SHOPPER EXPERIENCE */}
        <SidebarGroup>
          <SidebarGroupLabel>Shopper Experience</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Create and manage QR activations">
                  <Link href="/retailer-mvp/qr-management">
                    <QrCode className="h-4 w-4" />
                    <span>QR Activation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage the customer-facing brand experience">
                  <Link href="/retailer-mvp/ui-management">
                    <Palette className="h-4 w-4" />
                    <span>Brand & Experience</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Configure the Ari AI shopper experience">
                  <Link href="/retailer-mvp/ai-configuration">
                    <Bot className="h-4 w-4" />
                    <span>Ari Experience</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* RETAIL MEDIA */}
        <SidebarGroup>
          <SidebarGroupLabel>Retail Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Retail Media Network">
                  <Link href="/retailer-mvp/retail-media-network">
                    <Megaphone className="h-4 w-4" />
                    <span>Retail Media Network</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="A/B Testing & Experimentation">
                  <Link href="/retailer-mvp/ab-testing">
                    <FlaskConical className="h-4 w-4" />
                    <span>A/B Testing & Experimentation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* OPERATIONS & INTEGRATIONS */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations & Integrations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage your retail network hierarchy">
                  <Link href="/retailer-mvp/organization">
                    <Building2 className="h-4 w-4" />
                    <span>My Retail Network</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Connect POS, PIM, CRM and other applications">
                  <Link href="/retailer-mvp/system-integration">
                    <Settings className="h-4 w-4" />
                    <span>App Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Checkout terminal synchronisation">
                  <Link href="/retailer-mvp/pos-terminal">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Checkout Sync</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage in-store digital experiences and displays">
                  <Link href="/retailer-mvp/in-store-display">
                    <Monitor className="h-4 w-4" />
                    <span>In-Store Display</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* INTELLIGENCE */}
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Real-time shopper and operational intelligence">
                  <Link href="/retailer-mvp/real-time">
                    <Activity className="h-4 w-4" />
                    <span>Real-Time Intelligence</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Shopper decision journey intelligence">
                  <Link href="/retailer-mvp/decision-intelligence">
                    <Brain className="h-4 w-4" />
                    <span>Decision Intelligence</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Visual reporting and performance analysis">
                  <Link href="/retailer-mvp/visuals-reporting">
                    <BarChart3 className="h-4 w-4" />
                    <span>Visuals & Reporting</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* STANDARDS */}
        <SidebarGroup>
          <SidebarGroupLabel>Standards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Global Standards and GS1">
                  <Link href="/retailer-mvp/gs1-conformance">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Global Standards / GS1</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ADMINISTRATION */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Subscription and billing">
                  <Link href="/retailer-mvp/billing">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscription & Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help Center and training">
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
