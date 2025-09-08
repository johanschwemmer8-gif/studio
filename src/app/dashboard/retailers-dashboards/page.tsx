
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Rocket, Upload } from 'lucide-react';

export default function RetailersDashboardsPage() {
  const handleUpdateAll = () => {
    // Logic to trigger updates for all retailers will be implemented here.
    alert('Update process for all retailers has been initiated!');
  };

  return (
    <div className="space-y-8">
      <div>
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
            Push new features, bug fixes, or UI changes to all retailer dashboards simultaneously. This ensures consistency and rapid deployment across your entire partner network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            Clicking the button below will start the process of updating every retailer's dashboard to the latest version of the MVP. This action is powerful and should be used after thorough testing.
          </p>
          <Button size="lg" onClick={handleUpdateAll}>
            <Upload className="mr-2 h-4 w-4" />
            Update All Retailer Dashboards
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
