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
} from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/dashboard/logout-button';
import { useAuth } from '@/context/auth-context';
import {
  RETAILER_NAVIGATION,
  RETAILER_NAVIGATION_GROUPS,
  hasRetailerFunctionalAccess,
  type RetailerFunctionalArea,
} from '@/lib/retailer-navigation';

const iconByArea: Record<
  RetailerFunctionalArea,
  React.ComponentType<{ className?: string }>
> = {
  dashboard: LayoutDashboard,
  roi: DollarSign,
  products: ShoppingBasket,
  qrManagement: QrCode,
  uiManagement: Palette,
  aiConfiguration: Bot,
  retailMediaNetwork: Megaphone,
  retailMediaPartners: Building2,
  organization: Building2,
  systemIntegration: Settings,
  posTerminal: CreditCard,
  decisionIntelligence: Brain,
  visualsReporting: BarChart3,
  documentation: BookOpen,
};

const tooltipByArea: Partial<Record<RetailerFunctionalArea, string>> = {
  dashboard: 'Performance Overview',
  roi: 'Profit & ROI Audit',
  products: 'Manage your product catalog',
  qrManagement:
    'Create QR activations, generate QR codes and manage campaigns',
  uiManagement: 'Manage the customer-facing brand experience',
  aiConfiguration: 'Configure the Ari AI shopper experience',
  retailMediaNetwork: 'Retail Media Network',
  retailMediaPartners: 'Retail Media Partners',
  organization: 'Manage your retail network hierarchy',
  systemIntegration: 'Connect POS, PIM, CRM and other applications',
  posTerminal: 'Checkout terminal synchronisation',
  decisionIntelligence: 'Shopper decision journey intelligence',
};

export default function RetailerSidebar({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <Sidebar>
      {children}

      <SidebarContent>
        {RETAILER_NAVIGATION_GROUPS.map((group, groupIndex) => {
          const items = RETAILER_NAVIGATION.filter(
            (item) => item.group === group
          );

          return (
            <React.Fragment key={group}>
              {groupIndex > 0 && <SidebarSeparator />}

              <SidebarGroup>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>

                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => {
                      const Icon = iconByArea[item.id];

                      const allowed = hasRetailerFunctionalAccess(
                        user?.sidebarAccess,
                        item.id
                      );

                      const tooltip = allowed
                        ? tooltipByArea[item.id] ?? item.label
                        : 'Access not assigned. Contact your retailer administrator.';

                      return (
                        <SidebarMenuItem key={item.id}>
                          {allowed ? (
                            <SidebarMenuButton asChild tooltip={tooltip}>
                              <Link href={item.href}>
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              disabled
                              tooltip={tooltip}
                              className="cursor-not-allowed opacity-50"
                              aria-disabled="true"
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </React.Fragment>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
