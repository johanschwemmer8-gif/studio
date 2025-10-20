
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, FlaskConical, PlayCircle, Bot, Database, Server, UserCheck, ShieldCheck, Rocket } from 'lucide-react';
import ScanFailuresLog from '@/components/dashboard/scan-failures-log';
import ModuleActivationLogs from '@/components/dashboard/module-activation-logs';
import { scanFailuresLog, moduleActivationLogs } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';


const TestModuleCard = ({ title, description, status }: { title: string, description: string, status: 'Passing' | 'Failing' | 'Not Run' }) => {
    const { toast } = useToast();
    const [isTesting, setIsTesting] = useState(false);

    const getStatusIndicator = () => {
        switch(status) {
            case 'Passing': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Failing': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <FlaskConical className="h-5 w-5 text-muted-foreground" />;
        }
    }

    const handleRunTest = () => {
        setIsTesting(true);
        toast({
            title: `Testing: ${title}`,
            description: "Running automated tests...",
        });

        setTimeout(() => {
            setIsTesting(false);
            const isSuccess = status !== 'Failing';
            toast({
                title: isSuccess ? 'Test Passed' : 'Test Failed',
                description: `${title} tests completed.`,
                variant: isSuccess ? 'default' : 'destructive',
            });
        }, 2000 + Math.random() * 1500);
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {getStatusIndicator()}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleRunTest} disabled={isTesting}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {isTesting ? 'Running...' : 'Run Tests'}
                </Button>
            </CardContent>
        </Card>
    );
};


export default function SystemIntegrationTestPage() {

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          System Integration & Testing Dashboard
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          A centralized dashboard for validating all components of the iNteract-AOE MVP, from backend APIs to end-user interactions.
        </p>
      </div>

      <Separator />

       <Card>
          <CardHeader>
              <CardTitle>Overall System Health</CardTitle>
              <CardDescription>A real-time overview of all major system components.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-green-100/50 rounded-lg"><p className="font-semibold text-green-800">QR Generation: Operational</p></div>
                <div className="p-4 bg-green-100/50 rounded-lg"><p className="font-semibold text-green-800">AI Services: Operational</p></div>
                <div className="p-4 bg-green-100/50 rounded-lg"><p className="font-semibold text-green-800">Database: Operational</p></div>
                <div className="p-4 bg-red-100/50 rounded-lg"><p className="font-semibold text-red-800">Third-Party APIs: Degraded</p></div>
          </CardContent>
      </Card>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <ScanFailuresLog logs={scanFailuresLog} />
        <ModuleActivationLogs logs={moduleActivationLogs} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Component Testing Modules</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestModuleCard 
                title="QR Generation"
                description="Validate bulk creation, readability, styling, and error handling for QR codes."
                status="Passing"
            />
            <TestModuleCard 
                title="AI Interactions"
                description="Test conversation flows, response accuracy, and performance under load."
                status="Passing"
            />
            <TestModuleCard 
                title="Database Integrity"
                description="Verify data consistency, backups, performance, and security rules."
                status="Passing"
            />
             <TestModuleCard 
                title="API Suite"
                description="Run functional, auth, rate limiting, and error handling tests on all endpoints."
                status="Failing"
            />
             <TestModuleCard 
                title="User Acceptance (UAT)"
                description="Simulate retailer and customer workflows across different devices and browsers."
                status="Not Run"
            />
             <TestModuleCard 
                title="Deployment Validation"
                description="Check production environment, security certificates, and monitoring setup."
                status="Not Run"
            />
        </div>
      </div>
      
       <Card>
            <CardHeader>
                <CardTitle>Performance & Load Testing</CardTitle>
                <CardDescription>
                    Monitor real-time system metrics and run simulated load tests.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                 <Button asChild variant="outline">
                    <Link href="/dashboard/system-integration/performance">View Performance Dashboard</Link>
                 </Button>
            </CardContent>
        </Card>

    </div>
  );
}
