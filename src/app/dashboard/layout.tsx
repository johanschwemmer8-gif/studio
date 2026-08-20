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
  Building2,
  BarChart3
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
            <SidebarGroupLabel>Network Control</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Retailer Management">
                    <Link href="/dashboard/admin">
                      <Database className="h-4 w-4" />
                      <span>Retailers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Global ROI Dashboard">
                    <Link href="/dashboard/executive-roi">
                      <BarChart3 className="h-4 w-4" />
                      <span>Portfolio ROI</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Update Manager">
                    <Link href="/dashboard/retailers-dashboards">
                      <Rocket className="h-4 w-4" />
                      <span>Update Manager</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Infrastructure</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="System Connections">
                    <Link href="/dashboard/core-integration">
                      <Settings className="h-4 w-4" />
                      <span>System Connections</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Platform Health">
                    <Link href="/dashboard/platform-security">
                      <Activity className="h-4 w-4" />
                      <span>Platform Health</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Test Laboratory">
                    <Link href="/dashboard/system-integration">
                      <FlaskConical className="h-4 w-4" />
                      <span>Test Laboratory</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Governance & Standards</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Governance Rules">
                    <Link href="/dashboard/ai-policy">
                      <Shield className="h-4 w-4" />
                      <span>AI Rules</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Global Standards">
                    <Link href="/dashboard/gs1-conformance">
                      <FileCheck className="h-4 w-4" />
                      <span>Global Standards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
          
          <SidebarGroup>
            <SidebarGroupLabel>Platform Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="User Access">
                    <Link href="/create-admin">
                      <Users className="h-4 w-4" />
                      <span>User Access</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Help Center">
                    <Link href="/dashboard/documentation">
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
