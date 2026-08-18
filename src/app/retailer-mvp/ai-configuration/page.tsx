
'use client';

import AIConfigurationPanel from "@/components/dashboard/ai-configuration-panel";
import { Separator } from "@/components/ui/separator";

export default function AIConfigurationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant Configuration</h1>
        <p className="text-muted-foreground mt-2">
            Customize how your AI Assistant behaves and appears to customers in-store.
        </p>
      </div>
      <Separator />
      <AIConfigurationPanel />
    </div>
  );
}
