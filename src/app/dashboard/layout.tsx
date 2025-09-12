

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
import Image from 'next/image';
import SearchBar from '@/components/dashboard/search-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="https://placehold.co/150x50/475569/ffffff?text=AOE+Logo"
                alt="iNteract AOE Logo"
                width={128}
                height={32}
                className="w-32"
              />
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
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 900 600"
                    className="h-3 w-auto"
                >
                    <rect fill="#DE3831" width="900" height="600" />
                    <rect fill="#FFFFFF" y="200" width="900" height="200" />
                    <path
                        d="M0,200h900M0,400h900"
                        stroke="#002395"
                        strokeWidth="100"
                    />
                    <path
                        d="M0,0 L450,300 L0,600 z"
                        fill="#007A4D"
                    />
                    <path
                        d="M0,0 L450,300 L0,600"
                        stroke="#FFFFFF"
                        strokeWidth="66.6"
                        fill="none"
                    />
                     <path
                        d="M0,0 L450,300 L0,600"
                        stroke="#FFB612"
                        strokeWidth="40"
                        fill="none"
                    />
                     <path
                        d="M0,0 L450,300 L0,600"
                        stroke="#000000"
                        strokeWidth="20"
                        fill="none"
                    />
                </svg>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
