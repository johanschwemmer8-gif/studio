
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Rocket, Upload, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RetailersDashboardsPage() {

  const handleUpdateAll = () => {
    // In a real scenario, this would trigger a backend process.
    // For now, we can just show a confirmation.
    alert('Update process for all retailers has been initiated!');
  };

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
          Retailers' Dashboards Management
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Centrally manage and deploy updates to all configured Retailer MVP dashboards.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="text-primary" />
            Global Dashboard Updates
          </CardTitle>
          <CardDescription>
            Push new features, bug fixes, or UI changes to all retailer dashboards simultaneously.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clicking the button below will start the process of updating every retailer's dashboard to the latest version of the MVP. This action is powerful and should be used after thorough testing.
          </p>
          <div className="flex gap-2">
            <Button size="lg" onClick={handleUpdateAll} variant="destructive">
              <Upload className="mr-2 h-4 w-4" />
              Update All Retailer Dashboards
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="text-primary" />
            Retailer MVP Edit
          </CardTitle>
          <CardDescription>
            Access the live Retailer MVP template to make changes, test new features, and perform bug fixes before deploying updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                Clicking the button below will take you to the live, editable version of the Retailer Dashboard. All changes made there will be reflected in the template that gets deployed to all retailers.
            </p>
            <Button asChild size="lg">
                <Link href="/dashboard/dashboard">
                    Edit MVP Template
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
