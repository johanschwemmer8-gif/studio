

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
import theme from '@/config/theme.json';
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
            <Link href="/" className="font-bold text-lg flex items-center gap-2">
               {theme.logoUrl ? (
                  <Image src={theme.logoUrl} alt="Logo" width={24} height={24} className="rounded-full" />
               ) : (
                'iNteract AOE'
               )}
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
        <footer className="p-4 text-center text-xs text-muted-foreground border-t relative">
             <div className="flex items-center justify-center gap-2">
                <span>Powered by iNteract AOE. Made in South Africa.</span>
            </div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 900 600"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-4 opacity-20"
                style={{ zIndex: -1 }}
            >
                <rect fill="#DE3831" width="900" height="600" />
                <rect fill="#FFFFFF" y="200" width="900" height="200" />
                <rect fill="#002395" y="250" width="900" height="100" />
                <path
                d="M0,0 L300,300 L0,600 z"
                fill="#007A4D"
                />
                <path
                d="M0,40 L240,300 L0,560 M-20,0 L220,300 L-20,600"
                stroke="#FFFFFF"
                strokeWidth="66.6"
                />
                <path
                d="M0,0 L300,300 L0,600"
                fill="none"
                stroke="#FFB612"
                strokeWidth="40"
                />
                <path d="M0,0 L300,300 L0,600" stroke="#000000" strokeWidth="20" fill="none" />
            </svg>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
