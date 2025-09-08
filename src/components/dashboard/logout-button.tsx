
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOut } from 'lucide-react';
import { Suspense } from 'react';


function LogoutButtonComponent() {
    const searchParams = useSearchParams();
    const retailer = searchParams.get('retailer');
    // If a retailer query param exists (e.g., 'woolworths'), the link will be '/retailer/woolworths'
    // Otherwise, it defaults to the main iNteract homepage '/'.
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

// useSearchParams requires a Suspense boundary to work correctly during server rendering.
export default function LogoutButton() {
    return (
        <Suspense fallback={<SidebarMenuItem><SidebarMenuButton disabled><LogOut /><span>Log Out</span></SidebarMenuButton></SidebarMenuItem>}>
            <LogoutButtonComponent />
        </Suspense>
    )
}
