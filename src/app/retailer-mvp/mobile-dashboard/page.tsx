
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, QrCode, BarChart2, Users, Settings, PlusCircle, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Reusable Components for the Mobile Dashboard ---

function BottomNavBar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'QR Manager', icon: QrCode },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Customers', icon: Users },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => (
          <Button
            key={item.name}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-full w-full rounded-none space-y-1",
              activeTab === item.name ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setActiveTab(item.name)}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function DashboardTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Performance</CardTitle>
          <CardDescription>A summary of your key metrics for today.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
           <Card className="p-4"><CardTitle className="text-base">Scans</CardTitle><p className="text-2xl font-bold">1,204</p></Card>
           <Card className="p-4"><CardTitle className="text-base">Conversions</CardTitle><p className="text-2xl font-bold">87</p></Card>
        </CardContent>
      </Card>
      <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
              <Button variant="outline" className="h-auto flex-col p-2 space-y-1"><QrCode className="h-5 w-5"/> <span className="text-xs">Generate</span></Button>
              <Button variant="outline" className="h-auto flex-col p-2 space-y-1"><Users className="h-5 w-5"/> <span className="text-xs">Customers</span></Button>
              <Button variant="outline" className="h-auto flex-col p-2 space-y-1"><Sun className="h-5 w-5"/> <span className="text-xs">Suggestions</span></Button>
          </CardContent>
      </Card>
      <Card>
          <CardHeader><CardTitle>Recent Scan Activity</CardTitle></CardHeader>
          <CardContent>
              <p className="text-muted-foreground text-center py-4">Live activity feed will appear here.</p>
          </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-16">
                    {title} features will be available here.
                </p>
            </CardContent>
        </Card>
    )
}


export default function MobileDashboardPage() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardTab />;
      case 'QR Manager':
        return <PlaceholderTab title="QR Manager" />;
       case 'Analytics':
        return <PlaceholderTab title="Analytics" />;
      case 'Customers':
        return <PlaceholderTab title="Customers" />;
      case 'Settings':
        return <PlaceholderTab title="Settings" />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      <div className="max-w-md mx-auto bg-background min-h-screen pb-20">
         {/* Top Header */}
        <header className="p-4 border-b">
            <h1 className="text-xl font-bold text-center">{activeTab}</h1>
        </header>

        {/* Main Content */}
        <main className="p-4">
          {renderContent()}
        </main>
      </div>

      {/* Bottom Navigation */}
      <div className="max-w-md mx-auto">
          <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
