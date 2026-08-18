'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  Rocket, 
  Database, 
  LogOut, 
  Shield, 
  BookOpen, 
  DollarSign, 
  Activity, 
  Loader2,
  Users,
  Settings,
  FileCheck,
  PlayCircle,
  FlaskConical,
  Lock,
  Globe,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

function SidebarLogo() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
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
            if (detail && detail.key === 'interact-aoe-logo') {
                const updatedLogo = localStorage.getItem('interact-aoe-logo');
                setLogoUrl(updatedLogo);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleCustomEvent);
        };
    }, []);

    return (
         <Link href="/dashboard" className="flex items-center justify-center p-2">
            <div className="relative w-32 h-16 group flex items-center justify-center">
                {logoUrl ? (
                    <Image 
                        src={logoUrl} 
                        alt="iNteract AOE Logo" 
                        width={120} 
                        height={40}
                        className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
                        style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.2))' }}
                    />
                ) : (
                    <span className="text-xl font-bold tracking-wider text-foreground transition-transform duration-300 group-hover:scale-105">iNteract</span>
                )}
            </div>
        </Link>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b !bg-card/70 mb-2">
            <SidebarLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Core Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="User Management">
                    <Link href="/create-admin"><Users /><span>User Access</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="System Connections">
                    <Link href="/dashboard/core-integration"><Settings /><span>System Connections</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Retailer List">
                        <Link href="/dashboard/admin">
                          <Database className="h-4 w-4" />
                          <span>Retailer List</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Manage Retail Hierarchy">
                    <Link href="/retailer-mvp/organization"><Building2 /><span>Network Structure</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Business Performance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Global ROI Dashboard">
                    <Link href="/dashboard/executive-roi"><DollarSign /><span>Global ROI</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Platform Health">
                    <Link href="/dashboard/platform-security"><Activity /><span>Platform Health</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Ecosystem Deployment">
                    <Link href="/dashboard/retailers-dashboards">
                      <Rocket />
                      <span>Push Updates</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Compliance & Security</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Governance Rules">
                    <Link href="/dashboard/ai-policy"><Shield /><span>AI Rules</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="GS1 Product Standards">
                    <Link href="/dashboard/gs1-conformance"><FileCheck /><span>GS1 Standards</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Data Security">
                    <Link href="/dashboard/aoe-security"><Lock /><span>Data Security</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="API Key Management">
                    <Link href="/dashboard/external-security-integrations"><Globe /><span>API Access</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
          
          <SidebarGroup>
            <SidebarGroupLabel>Resources & Lab</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Integration Testing">
                    <Link href="/dashboard/system-integration"><FlaskConical /><span>Test Environment</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Documentation Center">
                    <Link href="/dashboard/documentation"><BookOpen /><span>Help Center</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="MVP Simulator">
                    <Link href="/retailer-mvp/dashboard">
                      <PlayCircle />
                      <span>MVP Simulator</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu className="px-2">
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={signOut} tooltip="Log Out">
                        <LogOut />
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card h-16 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-bold tracking-tight">iNteract Decision Intelligence Hub</h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <SearchBar />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
        <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            <div className="flex items-center justify-center gap-2">
                <span>© iNteract AOE. Persistent Retail Intelligence Infrastructure.</span>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
