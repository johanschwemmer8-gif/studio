

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
            <div className="absolute inset-0 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 9 6" className="opacity-20">
                    <path fill="#DE3831" d="M0 0h9v3H0z"/>
                    <path fill="#002395" d="M0 3h9v3H0z"/>
                    <path fill="#FFF" d="M0 2h9v2H0z"/>
                    <path d="M0 0v6l4.5-3z" fill="#007A4D"/>
                    <path d="M0 0v6l3-3z" fill="#FFB612"/>
                    <path d="M0 1.2V4.8L1.8 3zM3 3L0 0h1.5L4.5 3 1.5 6H0z" fill="#000"/>
                </svg>
            </div>
            <span className="relative">Powered by iNteract AOE. Made in South Africa</span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
