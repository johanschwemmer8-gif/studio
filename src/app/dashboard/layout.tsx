

import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Cog, FlaskConical, Rocket, DatabaseZap, UserCog, LogOut, Brush, Shield, BookOpen, QrCode, MonitorSmartphone, Globe } from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="p-2">
             <Link href="/dashboard" className="flex items-center gap-2 px-2">
                {/* This is where you can add your logo image */}
                 <div className="w-32 h-12 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Logo</span>
                </div>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="iNteract User Admin">
                <Link href="/dashboard/user-admin">
                  <UserCog />
                  <span>iNteract User Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="iNteract Core Integration">
                <Link href="/dashboard/core-integration">
                  <DatabaseZap />
                  <span>iNteract Core Integration</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Retailer's Dashboard Management">
                <Link href="/dashboard/retailers-dashboards">
                  <Rocket />
                  <span>Retailer's Dashboard Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="QR & AI Management">
                    <Link href="/dashboard/qr-ai-management">
                        <QrCode />
                        <span>QR & AI Management</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Platform Security">
                    <Link href="/dashboard/platform-security">
                        <Shield />
                        <span>Platform Security</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="External Security & Integrations">
                    <Link href="/dashboard/external-security-integrations">
                        <Globe />
                        <span>External Security & Integrations</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="UI/UX Development">
                    <Link href="/dashboard/ui-ux-development">
                        <Brush />
                        <span>UI/UX Development</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation & Training Modules">
                    <Link href="/dashboard/documentation">
                        <BookOpen />
                        <span>Documentation & Training</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Test MVP">
                <Link href="/retailer-mvp/dashboard">
                  <FlaskConical />
                  <span>Test MVP</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Log Out">
                        <Link href="/">
                            <LogOut />
                            <span>Log Out</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card h-16">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">iNteract Admin Panel</h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <SearchBar />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background flex-1">{children}</main>
        <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            <div className="flex items-center justify-center gap-2">
                <span>Powered by iNteract AOE. Made in South Africa.</span>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
