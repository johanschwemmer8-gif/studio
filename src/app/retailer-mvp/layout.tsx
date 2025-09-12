

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
         <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            <div className="flex items-center justify-center gap-2">
                <span>Powered by iNteract AOE. Made in South Africa.</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="12" viewBox="0 0 900 600">
                    <rect width="900" height="600" fill="#DE3831"/>
                    <rect width="900" height="300" y="300" fill="#002395"/>
                    <path d="M0 0L450 300L0 600V0Z" fill="#007A4D"/>
                    <path d="M-10 0L440 300L-10 600a120 120 0 0 1 0-600z" fill="#FFB612"/>
                    <path d="M-20 0L430 300L-20 600a120 120 0 0 1 0-600z" fill="#fff"/>
                    <path d="M0 120L300 300L0 480V120Z" fill="#000"/>
                </svg>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
