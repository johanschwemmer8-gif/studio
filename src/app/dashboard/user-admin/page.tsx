
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function UserAdminPage() {

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="-ml-4 mb-4">
            <Link href="/dashboard/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to iNteract Admin Panel
            </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          iNteract User Administration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage platform administrators, retailer users, and their associated permissions.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            This section is under construction. Features for adding, editing, and assigning roles to users will be available here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User (Coming Soon)
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
