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
import { Cog, FlaskConical, Rocket, DatabaseZap, UserCog, LogOut, Shield, BookOpen, QrCode, Globe, Store, Smartphone, DollarSign, Activity, Lightbulb, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
        <div className="relative w-32 h-16 group flex items-center justify-center">
            {logoUrl ? (
                <Image 
                    src={logoUrl} 
                    alt="iNteract AOE Logo" 
                    width={120} 
                    height={40}
                    className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
                    style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)/0.7))' }}
                />
            ) : (
                <span className="text-xl font-bold tracking-wider text-foreground transition-transform duration-300 group-hover:scale-105" style={{ textShadow: '0 0 8px hsl(var(--primary)/0.6)'}}>iNteract</span>
            )}
        </div>
    );

    return (
         <Link href="/dashboard" className="flex items-center justify-center p-2">
            <HolographicLogo />
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
          <SidebarMenu className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>Platform Governance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Platform Access Control">
                    <Link href="/create-admin"><UserCog /><span>Access Control</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Infrastructure Layer">
                    <Link href="/dashboard/core-integration"><DatabaseZap /><span>Infrastructure Layer</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Global Retailer Management">
                        <Link href="/dashboard/admin"><Cog /><span>Retailer Management</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />

             <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Global Economic ROI">
                    <Link href="/dashboard/executive-roi"><DollarSign /><span>Executive ROI</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Infrastructure Health">
                    <Link href="/dashboard/platform-security"><Activity /><span>Infrastructure Health</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Ecosystem Deployment">
                <Link href="/dashboard/retailers-dashboards">
                  <Rocket />
                  <span>Ecosystem Deployment</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Security & Ethics</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="AI Ethics & Governance">
                            <Link href="/dashboard/ai-policy"><Shield /><span>AI Ethics</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="GS1 Conformance Pack">
                            <Link href="/dashboard/gs1-conformance"><ShieldCheck /><span>GS1 Conformance</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="AOE Infrastructure Security">
                            <Link href="/dashboard/aoe-security"><Shield /><span>Infrastructure Security</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="External API Gateways">
                            <Link href="/dashboard/external-security-integrations"><Globe /><span>API Gateways</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
            
             <SidebarGroup>
                <SidebarGroupLabel>R&D and Validation</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="System Integration Sandbox">
                            <Link href="/dashboard/system-integration"><FlaskConical /><span>Integration Sandbox</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Infrastructure Training Hub">
                            <Link href="/dashboard/documentation"><BookOpen /><span>Training Hub</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Decision Intelligence Sandbox">
                        <Link href="/retailer-mvp/dashboard">
                          <Lightbulb />
                          <span>Intelligence Sandbox</span>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

          </SidebarMenu>
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
