

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import RetailerSidebar from '@/components/dashboard/retailer-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SearchBar from '@/components/dashboard/search-bar';


export default function RetailerMvpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RetailerSidebar />
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
