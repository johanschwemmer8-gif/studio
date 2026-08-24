
'use client';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar';
import RetailerSidebar from '@/components/dashboard/retailer-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, ShieldCheck, ShieldAlert } from 'lucide-react';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';

const TEST_RETAILER_ID = 'interact-test-tenant';

function SidebarLogo() {
    const { logoUrl, logoWidth } = useTheme();

    return (
         <Link href="/retailer-mvp/dashboard" className="flex items-center justify-center gap-2 px-2 h-12">
            {logoUrl ? (
                <Image 
                    src={logoUrl} 
                    alt="Retailer Logo" 
                    width={logoWidth} 
                    height={logoWidth / (128/50)} // Maintain aspect ratio
                    className="h-auto"
                    style={{ width: `${logoWidth}px` }}
                />
            ) : (
                 <div className="w-32 h-12 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-sm text-muted-foreground font-bold">iNteract</span>
                </div>
            )}
        </Link>
    );
}

function RetailerMvpLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user } = useAuth();
    const isTestEnvironment = user?.retailerId === TEST_RETAILER_ID;
    const isPlatformAdmin = user?.role === 'admin';
    const isProvisioned = !!user?.retailerId || isPlatformAdmin;

    // GLOBAL IDENTITY GUARD
    // Prevents server flow failures by stopping unprovisioned users at the layout level.
    if (!isProvisioned) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-12 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-black uppercase tracking-tight">Identity Provisioning Required</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your account has not yet been associated with a specific retailer identity. 
                        Please contact your Platform Administrator to assign your <code className="text-xs">retailerId</code>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline">
                        <Link href="/create-admin">Open User Management</Link>
                    </Button>
                    <Button variant="ghost" onClick={() => window.location.reload()}>
                        Check Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <RetailerSidebar>
                <SidebarHeader>
                    <div className="p-2 border-b">
                        <SidebarLogo />
                        {isTestEnvironment && (
                            <div className="mt-2 px-2">
                                <Badge className="w-full justify-center gap-1.5 bg-accent text-accent-foreground border-none font-black uppercase text-[9px] tracking-widest py-1 animate-pulse">
                                    <FlaskConical className="h-3 w-3" />
                                    Test Environment
                                </Badge>
                            </div>
                        )}
                    </div>
                </SidebarHeader>
            </RetailerSidebar>
            <SidebarInset>
                <header className="flex items-center justify-between p-4 border-b bg-card h-16 gap-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold whitespace-nowrap tracking-tight">Retailer Dashboard</h1>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <SearchBar />
                </div>
                {isTestEnvironment && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                         <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-accent-foreground">Verified Test Mode Active</span>
                    </div>
                )}
                </header>
                <main className="p-4 sm:p-6 lg:p-8 bg-background flex-1">{children}</main>
                <footer className="p-4 text-center text-xs text-muted-foreground border-t">
                    <div className="flex items-center justify-center gap-2">
                        <span>Powered by iNteract AOE. Persistent Retail Intelligence.</span>
                    </div>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    )
}


export default function RetailerMvpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
        <RetailerMvpLayoutContent>{children}</RetailerMvpLayoutContent>
    </ThemeProvider>
  );
}
