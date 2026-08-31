'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Rocket, Upload, Edit, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
                Back to Retailers
            </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">
          Update Manager
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Centrally manage and deploy technical updates to all configured Retailer MVP dashboards.
        </p>
      </div>

      <Separator />

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="text-primary h-5 w-5" />
            Global Dashboard Updates
          </CardTitle>
          <CardDescription className="text-xs">
            Push new features, security fixes, or UI components to every active tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pushing an update will synchronize the latest production template with every retailer dashboard in the network. This operation is consequential and should only be performed after verifying changes in the sandbox.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive" disabled={isUpdating} className="font-black uppercase text-[10px] tracking-widest h-12 px-8">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Update in Progress...' : 'Update All Retailer Dashboards'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Global Deployment Confirmation
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    You are about to push technical updates to <strong>all active retailer dashboards</strong> simultaneously.
                    <br /><br />
                    This operation is consequential and irreversible. Ensure the current MVP production template has been verified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdateAll} className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest">
                    Confirm Global Update
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {isUpdating && (
                <div className="w-full sm:w-64 flex items-center gap-2">
                    <Progress value={progress} className="w-full h-2" />
                    <span className="text-[10px] font-black">{Math.round(progress)}%</span>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Edit className="text-primary h-5 w-5" />
            Template Editor
          </CardTitle>
          <CardDescription className="text-xs">
            Access the production template to perform bug fixes or test new features.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Modifications made in the editor are saved to the master template. These changes will not reach retailers until you execute a Global Update.
            </p>
            <Button asChild variant="outline" className="font-bold uppercase text-[10px] tracking-widest">
                <Link href="/retailer-mvp/dashboard">
                    Open Production Template
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
