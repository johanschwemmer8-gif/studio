
'use client';

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Cog, FlaskConical, Rocket, DatabaseZap, UserCog, LogOut, Shield, BookOpen, QrCode, Globe, Store } from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { useState, useEffect } from 'react';

function SidebarLogo() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        // This effect runs only on the client side
        const savedLogo = localStorage.getItem('interact-aoe-logo');
        if (savedLogo) {
            setLogoUrl(savedLogo);
        }
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'interact-aoe-logo') {
                setLogoUrl(e.newValue);
            }
        };

        const handleCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.key !== 'interact-aoe-logo') return;

            const updatedLogo = localStorage.getItem('interact-aoe-logo');
            setLogoUrl(updatedLogo);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleCustomEvent);


        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleCustomEvent);
        };
    }, []);

    const HolographicLogo = () => (
        <div className="relative w-32 h-16 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-purple rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse-slow"></div>
            <div className="relative w-full h-full flex items-center justify-center rounded-lg">
                {logoUrl ? (
                    <Image 
                        src={logoUrl} 
                        alt="iNteract AOE Logo" 
                        width={120} 
                        height={40}
                        className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <span className="text-xl font-bold tracking-wider text-foreground transition-transform duration-300 group-hover:scale-105">iNteract</span>
                )}
            </div>
        </div>
    );

    return (
         <Link href="/dashboard" className="flex items-center justify-center p-4">
            <HolographicLogo />
        </Link>
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b bg-sidebar-header mb-2">
            <SidebarLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>Platform Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="iNteract Admin Panel">
                    <Link href="/dashboard/admin"><Cog /><span>Admin Panel</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="User Admin">
                    <Link href="/dashboard/user-admin"><UserCog /><span>User Admin</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Core Integration">
                    <Link href="/dashboard/core-integration"><DatabaseZap /><span>Core Integration</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Retailer Management">
                <Link href="/dashboard/retailer-management">
                  <Store />
                  <span>Retailer Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Retailer's Dashboard Management">
                <Link href="/dashboard/retailers-dashboards">
                  <Rocket />
                  <span>Retailer Dashboards</span>
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
            
            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Security</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="AI Policy & Compliance">
                            <Link href="/dashboard/ai-policy"><Shield /><span>AI Policy</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Platform Security">
                            <Link href="/dashboard/platform-security"><Shield /><span>Platform Security</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="AOE Security">
                            <Link href="/dashboard/aoe-security"><Shield /><span>AOE Security</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="External Security & Integrations">
                            <Link href="/dashboard/external-security-integrations"><Globe /><span>External Security</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
            
             <SidebarGroup>
                <SidebarGroupLabel>Development & Testing</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="System Integration & Testing">
                            <Link href="/dashboard/system-integration"><FlaskConical /><span>System Integration</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Documentation & Training Modules">
                            <Link href="/dashboard/documentation"><BookOpen /><span>Documentation</span></Link>
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
                </SidebarGroupContent>
            </SidebarGroup>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu className="px-2">
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
        <header className="flex items-center justify-between p-4 border-b bg-card/60 backdrop-blur-xl h-16 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">iNteract Admin Panel</h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <SearchBar />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
        <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            <div className="flex items-center justify-center gap-2">
                <span>Powered by iNteract AOE. Made in South Africa.</span>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
