
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Download, Star } from 'lucide-react';

const invoiceHistory = [
  { id: 'INV-2024-005', date: '2024-05-01', amount: 'R1,250.00', status: 'Paid' },
  { id: 'INV-2024-004', date: '2024-04-01', amount: 'R1,250.00', status: 'Paid' },
  { id: 'INV-2024-003', date: '2024-03-01', amount: 'R1,250.00', status: 'Paid' },
  { id: 'INV-2024-002', date: '2024-02-01', amount: 'R1,250.00', status: 'Paid' },
];

const subscriptionPlans = [
    { name: 'Basic', price: 'R499', features: ['Up to 1,000 QRs', 'Basic Analytics', 'Email Support'] },
    { name: 'Pro', price: 'R1,250', features: ['Up to 10,000 QRs', 'Advanced Analytics', 'AI Recommendations', 'Phone Support'], current: true },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited QRs', 'Dedicated Account Manager', 'Custom Integrations', 'SLA'] },
];

export default function BillingPage() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const currentPlan = subscriptionPlans.find(p => p.current) || subscriptionPlans[1];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Subscription & Billing</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage your subscription plan, payment methods, and view your invoice history.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your current subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="text-lg font-semibold text-primary">{currentPlan.name} Plan</h3>
                <p className="text-muted-foreground">Renews on: June 1, 2025</p>
            </div>
            <p className="text-3xl font-bold">{currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
          </CardContent>
          <CardFooter>
             <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogTrigger asChild>
                    <Button>Change Plan</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Choose Your Plan</DialogTitle>
                        <DialogDescription>Select the plan that best fits your business needs.</DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-3 gap-6 py-4">
                        {subscriptionPlans.map(plan => (
                            <Card key={plan.name} className={plan.current ? 'border-primary ring-2 ring-primary' : ''}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {plan.name}
                                        {plan.current && <Star className="h-5 w-5 text-primary" />}
                                    </CardTitle>
                                    <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" disabled={plan.current}>
                                        {plan.current ? 'Current Plan' : 'Select Plan'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
             </Dialog>
          </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>The card used for your subscription payments.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Visa ending in 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button variant="outline">Update Payment Method</Button>
            </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            A record of all your past payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceHistory.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className="bg-green-500/20 text-green-700">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

