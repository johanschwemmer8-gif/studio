
'use client';

import { useState, useEffect } from 'react';
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
import { CheckCircle, CreditCard, Download, Star, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';


type Invoice = {
    id: string;
    invoiceId: string;
    date: Timestamp;
    amount: number;
    status: 'Paid' | 'Pending' | 'Failed';
    pdfUrl?: string;
};

type Subscription = {
    retailerId: string;
    planId: string;
    status: 'active' | 'trial' | 'canceled';
    nextBillingDate: Timestamp;
    paymentMethod: {
        cardType: string;
        last4: string;
    };
    stripeCustomerId: string;
};

const subscriptionPlans = [
    { id: 'basic', name: 'Basic', price: 'R499', features: ['Up to 1,000 QRs', 'Basic Analytics', 'Email Support'] },
    { id: 'pro', name: 'Pro', price: 'R1,250', features: ['Up to 10,000 QRs', 'Advanced Analytics', 'AI Recommendations', 'Phone Support'], current: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited QRs', 'Dedicated Account Manager', 'Custom Integrations', 'SLA'] },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const { toast } = useToast();

  const retailerId = user?.retailerId || 'unknown';

  useEffect(() => {
    if (!db || retailerId === 'unknown') {
        setLoading(false);
        return;
    }

    const subDocRef = doc(db, 'subscriptions', retailerId);
    const unsubscribeSub = onSnapshot(subDocRef, (doc) => {
        if (doc.exists()) {
            setSubscription(doc.data() as Subscription);
        } else {
            console.warn(`Subscription for retailer ${retailerId} not found.`);
        }
    }, (error) => {
        console.error("Error fetching subscription: ", error);
        toast({ title: 'Error', description: 'Could not fetch subscription data.', variant: 'destructive'});
    });
    
    const invoicesQuery = query(collection(db, `subscriptions/${retailerId}/invoices`), orderBy('date', 'desc'));
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
        const fetchedInvoices: Invoice[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        setInvoices(fetchedInvoices);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching invoices: ", error);
        toast({ title: 'Error', description: 'Could not fetch invoice history.', variant: 'destructive'});
        setLoading(false);
    });


    return () => {
        unsubscribeSub();
        unsubscribeInvoices();
    };
  }, [toast, retailerId]);
  
  const currentPlan = subscriptionPlans.find(p => p.id.toLowerCase() === subscription?.planId?.toLowerCase()) || subscriptionPlans[1];

  const handlePlanChange = async (newPlanId: string) => {
      setIsChangingPlan(true);
      try {
          toast({ title: "Redirecting to Checkout", description: "Stripe integration is currently disabled. This is a placeholder action." });
          console.log(`(Simulation) Would redirect to Stripe Checkout for plan ${newPlanId} for retailer ${retailerId}`);
          setIsPlanModalOpen(false);
      } catch(error: any) {
          toast({ title: "Plan Change Failed", description: error.message || 'Could not initiate plan change.', variant: "destructive" });
      } finally {
          setIsChangingPlan(false);
      }
  };

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
             {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                </div>
            ) : subscription ? (
                <>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h3 className="text-lg font-semibold text-primary capitalize">{subscription.planId.replace('_', ' ')}</h3>
                        <p className="text-muted-foreground">
                            Renews on: {new Date(subscription.nextBillingDate.toDate()).toLocaleDateString()}
                        </p>
                    </div>
                    <p className="text-3xl font-bold">{currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </>
             ) : (
                <p className="text-muted-foreground text-sm italic">Initializing subscription record...</p>
             )}
          </CardContent>
          <CardFooter>
             <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogTrigger asChild>
                    <Button disabled={!subscription}>Change Plan</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Choose Your Plan</DialogTitle>
                        <DialogDescription>Select the plan that best fits your business needs.</DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-3 gap-6 py-4">
                        {subscriptionPlans.map(plan => (
                            <Card key={plan.name} className={plan.id === currentPlan.id ? 'border-primary ring-2 ring-primary' : ''}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        {plan.name}
                                        {plan.id === currentPlan.id && <Star className="h-5 w-5 text-primary" />}
                                    </CardTitle>
                                    <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-xs text-muted-foreground">
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className="w-full text-xs font-bold uppercase tracking-widest" 
                                        disabled={plan.id === currentPlan.id || isChangingPlan} 
                                        onClick={() => handlePlanChange(plan.id)}
                                    >
                                        {isChangingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {plan.id === currentPlan.id ? 'Current Plan' : 'Select Plan'}
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
                 {loading ? <Skeleton className="h-16 w-full" /> : subscription?.paymentMethod ? (
                     <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">{subscription.paymentMethod.cardType} ending in {subscription.paymentMethod.last4}</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                        </div>
                    </div>
                 ) : (
                     <p className="text-muted-foreground text-sm italic">No payment method on file.</p>
                 )}
            </CardContent>
             <CardFooter>
                <Button variant="outline" disabled={!subscription}>Update Payment Method</Button>
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
              {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">No invoices generated yet.</TableCell></TableRow>
              ) : (
                invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.invoiceId}</TableCell>
                    <TableCell>{new Date(invoice.date.toDate()).toLocaleDateString()}</TableCell>
                    <TableCell>R{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className={invoice.status === 'Paid' ? "bg-green-500/10 text-green-700 border-green-200" : ""}>
                        {invoice.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled={!invoice.pdfUrl} className="text-xs">
                        <Download className="mr-2 h-3.5 w-3.5" />
                        PDF
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
