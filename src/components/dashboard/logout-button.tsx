
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOut } from 'lucide-react';
import { Suspense } from 'react';


function LogoutButtonComponent() {
    const searchParams = useSearchParams();
    const retailer = searchParams.get('retailer');
    const logoutHref = retailer ? `/retailer/${retailer}` : '/';

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Log Out">
                <Link href={logoutHref}>
                    <LogOut />
                    <span>Log Out</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function LogoutButton() {
    return (
        <Suspense fallback={null}>
            <LogoutButtonComponent />
        </Suspense>
    )
}
