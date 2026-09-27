
'use client';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar';
import RetailerSidebar from '@/components/dashboard/retailer-sidebar';
import Link from 'next/link';
import { FlaskConical, ShieldCheck, Loader2 } from 'lucide-react';
import SearchBar from '@/components/dashboard/search-bar';
import Image from 'next/image';
import { ThemeProvider } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const TEST_RETAILER_ID = 'interact-test-tenant';

function SidebarLogo() {
    const { user } = useAuth();
    const [retailerLogoUrl, setRetailerLogoUrl] = useState('');

    useEffect(() => {
        if (!user?.retailerId || !db) {
            setRetailerLogoUrl('');
            return;
        }

        const docRef = doc(db, 'configurations', `${user.retailerId}_org`);

        return onSnapshot(docRef, (docSnap) => {
            const logoUrl = docSnap.exists()
                ? docSnap.data()?.data?.retailerLogoUrl
                : '';

            setRetailerLogoUrl(
                typeof logoUrl === 'string' ? logoUrl : ''
            );
        });
    }, [user?.retailerId]);

    return (
        <Link
            href="/retailer-mvp/dashboard"
            className="flex h-12 items-center justify-center gap-2 px-2"
        >
            {retailerLogoUrl ? (
                <Image
                    src={retailerLogoUrl}
                    alt="Retailer Logo"
                    width={160}
                    height={50}
                    className="max-h-10 w-auto max-w-[160px] object-contain"
                />
            ) : (
                <div className="flex h-12 w-32 items-center justify-center rounded-md bg-muted">
                    <span className="text-sm font-bold text-muted-foreground">
                        iNteract
                    </span>
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
    const { user, loading, accessType } = useAuth();
    const router = useRouter();

    const isRetailerAuthorized =
        !!user &&
        accessType === 'retailer' &&
        !!user.retailerId &&
        user.isActive === true;

    const isTestEnvironment =
        isRetailerAuthorized &&
        user.retailerId === TEST_RETAILER_ID;

    useEffect(() => {
        if (!loading && !isRetailerAuthorized) {
            router.replace('/');
        }
    }, [loading, isRetailerAuthorized, router]);

    if (loading || !isRetailerAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
