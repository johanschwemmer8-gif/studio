

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import RetailerSidebar from '@/components/dashboard/retailer-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


export default function RetailerMvpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RetailerSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card h-16">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Retailer Dashboard</h1>
          </div>
          <Button asChild>
            <Link href="/dashboard/retailers-dashboards">
              <ArrowLeft />
              <span>Back to Retailer's Dashboard Management</span>
            </Link>
          </Button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
