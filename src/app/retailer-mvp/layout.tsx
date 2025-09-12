
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
import { ArrowLeft } from 'lucide-react';
import SearchBar from '@/components/dashboard/search-bar';
import { useState, useEffect } from 'react';
import Image from 'next/image';

function SidebarLogo() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState<number>(128);

    useEffect(() => {
        const savedLogo = localStorage.getItem('interact-aoe-logo');
        if (savedLogo) {
            setLogoUrl(savedLogo);
        }
        const savedWidth = localStorage.getItem('interact-aoe-logo-width');
        if (savedWidth) {
            setLogoWidth(Number(savedWidth));
        }
        
        const handleStorageChange = () => {
            const updatedLogo = localStorage.getItem('interact-aoe-logo');
            setLogoUrl(updatedLogo);
            const updatedWidth = localStorage.getItem('interact-aoe-logo-width');
            setLogoWidth(Number(updatedWidth || 128));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleStorageChange);


        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleStorageChange);
        };
    }, []);

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
                    <span className="text-sm text-muted-foreground">Logo</span>
                </div>
            )}
        </Link>
    );
}


export default function RetailerMvpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
       <RetailerSidebar>
         <SidebarHeader>
            <div className="p-2">
                <SidebarLogo />
            </div>
        </SidebarHeader>
       </RetailerSidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card h-16 gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold whitespace-nowrap">Retailer Dashboard</h1>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <SearchBar />
          </div>
          <Button asChild>
            <Link href="/dashboard/retailers-dashboards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Back to Admin</span>
            </Link>
          </Button>
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
