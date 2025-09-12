
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Code, MessageCircle, Share2, Sparkles, ShieldCheck, RefreshCw, AlertTriangle, KeyRound, Server, Link, Power, PowerOff, User, Clock, Building2, MapPin, AlertCircle } from 'lucide-react';
import { dataSyncLogs, lastSyncStatus, moduleActivationLogs, scanErrorRate, scanFailuresLog, systemUptime } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import DataSynchronizationLogs from '@/components/dashboard/data-synchronization-logs';
import ModuleActivationLogs from '@/components/dashboard/module-activation-logs';
import ScanFailuresLog from '@/components/dashboard/scan-failures-log';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// This new component will ensure that date formatting only runs on the client
function ClientFormattedDate({ timestamp }: { timestamp: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code runs only on the client, after the component has mounted
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  // Return a placeholder or null on the server and initial client render
  if (!formattedDate) {
    return null; // or a loading skeleton
  }

  return <span>{formattedDate}</span>;
}


export default function SystemIntegrationPage() {
    
  const integrations = [
    { name: 'Point of Sale (POS)', apiKey: 'pos_sk_live_******************1234', status: 'Connected' as const },
    { name: 'Inventory Management', apiKey: 'inv_sk_live_******************5678', status: 'Connected' as const },
    { name: 'Customer Relationship Management (CRM)', apiKey: 'crm_sk_live_******************9012', status: 'Disconnected' as const },
  ];

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">System & Integration Management</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage your API credentials, view system health diagnostics, and see integration logs for the iNteract-AOE platform.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <KeyRound className="text-primary" /> API Integrations & Credentials
            </CardTitle>
            <CardDescription>
                Manage connections to your external systems like POS, inventory, and CRM.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {integrations.map(integration => (
                        <TableRow key={integration.name}>
                            <TableCell className="font-medium">{integration.name}</TableCell>
                            <TableCell><code className="font-mono text-sm bg-muted p-1 rounded">{integration.apiKey}</code></TableCell>
                            <TableCell>
                                <Badge variant={integration.status === 'Connected' ? 'default' : 'destructive'}>
                                    {integration.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                 <Button variant="outline" size="sm">
                                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Test Connection
                                </Button>
                                <Button variant="secondary" size="sm">
                                    Manage
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>


      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systemUptime.uptime}%</div>
            <p
              className={cn(
                'text-xs',
                systemUptime.status === 'Operational'
                  ? 'text-green-500'
                  : 'text-red-500'
              )}
            >
              {systemUptime.status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-xl font-bold", lastSyncStatus.status === 'Success' ? 'text-green-500' : 'text-red-500')}>{lastSyncStatus.status}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: <ClientFormattedDate timestamp={lastSyncStatus.timestamp} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate/Scan Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scanErrorRate.rate}%</div>
            <p className="text-xs text-muted-foreground">
              {scanErrorRate.failures} failures in the last 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>

      <ScanFailuresLog logs={scanFailuresLog} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <ModuleActivationLogs logs={moduleActivationLogs} />
        </div>
        <DataSynchronizationLogs logs={dataSyncLogs} />
      </div>

      <Separator />

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" /> MVP Security
          </CardTitle>
          <CardDescription>
            Overview of the security measures implemented to protect the Retailer MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
                The platform is protected by multiple layers of security to ensure data integrity and user safety. All systems are continuously monitored and synced with the central iNteract security system.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="font-semibold">End-to-End Encryption</p>
                        <p className="text-muted-foreground">Status: <span className="text-green-500 font-medium">Active</span></p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="font-semibold">Role-Based Access Control (RBAC)</p>
                        <p className="text-muted-foreground">Status: <span className="text-green-500 font-medium">Active</span></p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="font-semibold">Firewall & Intrusion Detection</p>
                        <p className="text-muted-foreground">Status: <span className="text-green-500 font-medium">Active & Synced</span></p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="font-semibold">Regular Security Audits</p>
                        <p className="text-muted-foreground">Status: <span className="text-green-500 font-medium">Scheduled</span></p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Generative AI Capabilities</h3>
        <p className="text-muted-foreground max-w-3xl">
          This section showcases the powerful Generative AI features integrated into the platform.
        </p>
      </div>


        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-accent" />
                    AI-Powered Cross-Sell Recommendations
                </CardTitle>
                <CardDescription>
                    Dynamically generate relevant product suggestions to increase basket size and enhance the customer's shopping journey.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="leading-relaxed">
                    When a customer scans a product's QR code, our AI engine analyzes its attributes (name, category, price) and instantly generates a list of complementary products. This goes beyond simple "frequently bought together" lists by providing a contextual reason for each recommendation, encouraging upsells and cross-sells.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                         <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="text-green-500" /> Key Features</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Real-time recommendation generation.</li>
                            <li>Contextual reasoning for each suggestion.</li>
                            <li>Seamless integration into the product details page.</li>
                            <li>Directly drives revenue uplift and bigger basket sizes.</li>
                         </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Share2 className="text-blue-500" /> Integration Points</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li><strong>Trigger:</strong> Customer scans a QR code.</li>
                            <li><strong>Input:</strong> Scanned product's data.</li>
                            <li><strong>AI Flow:</strong> `generateCrossSellRecommendations`</li>
                            <li><strong>Output:</strong> Displayed on product page (`/product/[id]`).</li>
                         </ul>
                    </div>
                </div>
                 <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    <code className="font-code">
{`// src/ai/flows/generate-cross-sell-recommendations.ts

const prompt = ai.definePrompt({
  name: 'generateCrossSellRecommendationsPrompt',
  prompt: \`You are an expert retail sales assistant. A customer has scanned a product.
  Based on the details of the scanned product, recommend other products that the customer may be interested in purchasing...
  
  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}\`
});`}
                    </code>
                </pre>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="text-accent" />
                    Conversational AI Chatbot
                </CardTitle>
                <CardDescription>
                    Engage customers with a friendly, knowledgeable AI assistant that can answer product-specific questions in real time.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="leading-relaxed">
                    Elevate the customer service experience by offering an AI-powered chatbot directly on the product page. Customers can ask anything from "Is this item waterproof?" to "What other colors does this come in?". The AI uses the product's information and a natural, conversational tone to provide instant, accurate answers, keeping customers engaged and informed.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                         <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="text-green-500" /> Key Features</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Answers natural language questions.</li>
                            <li>Maintains conversation history for context.</li>
                            <li>Acts as a 24/7 in-store sales assistant.</li>
                            <li>Reduces friction in the purchasing process.</li>
                         </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Share2 className="text-blue-500" /> Integration Points</h4>
                         <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                             <li><strong>Trigger:</strong> Customer clicks "Chat with an Assistant".</li>
                            <li><strong>Input:</strong> Product data and user's chat history.</li>
                            <li><strong>AI Flow:</strong> `productChat`</li>
                            <li><strong>Output:</strong> A conversational response in the chat UI.</li>
                         </ul>
                    </div>
                </div>
                 <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    <code className="font-code">
{`// src/ai/flows/product-chat-flow.ts

const llmResponse = await ai.generate({
    prompt: \`You are a friendly and helpful in-store sales assistant. Your goal is to answer the customer's questions about the product...

    Here is the product information:
    - Name: \${input.product.name}
    - Description: \${input.product.description}\`,
    history: chatHistory,
});`}
                    </code>
                </pre>
            </CardContent>
        </Card>

    </div>
  );
}
