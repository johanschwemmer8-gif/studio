
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Rocket, Upload, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function RetailersDashboardsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isUpdating && progress < 100) {
      timer = setTimeout(() => {
        setProgress(prev => prev + 1);
      }, 50); // Speed of the progress bar
    }
    if (progress === 100) {
        setIsUpdating(false);
        toast({
            title: "Update Complete!",
            description: "All retailer dashboards have been updated to the latest version."
        });
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isUpdating, progress, toast]);


  const handleUpdateAll = () => {
    if (isUpdating) return;
    setProgress(0);
    setIsUpdating(true);
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
          Retailer's Dashboard Management
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
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" onClick={handleUpdateAll} variant="destructive" disabled={isUpdating}>
              <Upload className="mr-2 h-4 w-4" />
              {isUpdating ? 'Updating...' : 'Update All Retailer Dashboards'}
            </Button>
            {isUpdating && (
                <div className="w-full sm:w-64 flex items-center gap-2">
                    <Progress value={progress} className="w-full" />
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
            )}
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
                <Link href="/retailer-mvp/dashboard">
                    Edit MVP Template
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
