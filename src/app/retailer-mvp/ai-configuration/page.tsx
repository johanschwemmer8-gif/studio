
'use client';

import AIConfigurationPanel from "@/components/dashboard/ai-configuration-panel";
import { Separator } from "@/components/ui/separator";
import { HubNav } from "@/components/dashboard/hub-nav";

export default function AIConfigurationPage() {
  const aiHubItems = [
    { label: "Settings", href: "/retailer-mvp/ai-configuration" },
    { label: "Welcome & Content", href: "/retailer-mvp/ai-content" },
    { label: "Performance Audit", href: "/retailer-mvp/ai-performance" },
    { label: "Ethics & Policy", href: "/retailer-mvp/ai-policy" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Ari Experience</h1>
        <p className="text-muted-foreground mt-2">
            Configure how your AI Assistant behaves and appears to customers in-store.
        </p>
      </div>
      
      <HubNav items={aiHubItems} />
      <Separator />
      
      <AIConfigurationPanel />
    </div>
  );
}
