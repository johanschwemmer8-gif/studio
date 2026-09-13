'use client';

import React, { useEffect } from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
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
  Activity, 
  Loader2,
  Users,
  Settings,
  FileCheck,
  BarChart3,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * iNteract Platform Control Plane Layout
 * Protected: Access restricted to 'admin' role only.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
        router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!user) return null;

  // IDENTITY GUARD: Handle users who are logged in but not provisioned as admins
  if (user.role !== 'admin') {
      return (
          <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center space-y-8 animate-in fade-in duration-500">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20 mx-auto">
                  <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Control Plane Access Denied</h1>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                      Your identity <span className="text-foreground font-black">({user.email})</span> is verified in Auth, but you have not been provisioned with Platform Administrator permissions.
                  </p>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest bg-muted p-2 rounded-lg border">
                      Provisioning Status: Pending Administrative Action
                  </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button variant="outline" className="h-12 px-8 font-black uppercase tracking-widest text-[10px]" onClick={() => signOut()}>
                      Switch Identity
                  </Button>
                  {user.retailerId && (
                      <Button asChild className="h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                          <Link href="/retailer-mvp/dashboard">Enter Retailer Portal</Link>
                      </Button>
                  )}
              </div>
          </div>
      );
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b !bg-card/70 mb-2">
             <div className="flex items-center justify-center p-4">
                <span className="text-xl font-black tracking-tighter uppercase">iNteract</span>
            </div>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Governance</SidebarGroupLabel>
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
            <SidebarGroupLabel>Identity & Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Identity Registry">
                    <Link href="/dashboard/identity-registry">
                      <Users className="h-4 w-4" />
                      <span>Identity Registry</span>
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
                    <SidebarMenuButton onClick={signOut} tooltip="Log Out" className="text-destructive hover:text-destructive">
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
            <h1 className="text-xl font-bold tracking-tight">Decision Intelligence Hub</h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <SearchBar />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
        <footer className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t bg-muted/10">
            © iNteract AOE. Persistent Retail Intelligence Infrastructure.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
