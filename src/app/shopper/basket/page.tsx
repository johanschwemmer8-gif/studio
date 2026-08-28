'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, Trash2, Plus, Minus, QrCode, CreditCard, 
    Loader2, Sparkles, ShieldCheck, CheckCircle2, Barcode, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import QrScannerCamera from '@/components/qr-scanner-camera';
import { BackButton } from '@/components/ui/back-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ARCHITECTURAL RULE (TRANSACTION LAYER):
 * Basket items MUST be keyed by GTIN. 
 * This ensures end-to-end identifier integrity from scan to POS.
 */
type BasketItem = {
    gtin: string; // Mandatory GS1 Global identifier
    name: string;
    price: number;
    quantity: number;
    addedAt: string;
};

type Basket = {
    basketId: string;
    sessionId: string; // Mandatory authoritative journey anchor
    retailerId: string;
    shopperId: string;
    items: BasketItem[];
    total: number;
    status: 'active' | 'synced' | 'paid';
};

export default function VirtualSmartTrolleyPage() {
    const { user } = useAuth();
    const [basket, setBasket] = useState<Basket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [integrityError, setIntegrityError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const basketRef = doc(db, 'baskets', `basket_${user.uid}`);
        const unsubscribe = onSnapshot(basketRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as Basket;
                // Architecture check: Does the basket have the authoritative sessionId?
                if (!data.sessionId || !data.retailerId) {
                    setIntegrityError("Journey lineage missing. Please scan a product to re-initialize your session.");
                } else {
                    setIntegrityError(null);
                }
                setBasket(data);
            } else {
                setBasket(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleUpdateQuantity = async (gtin: string, delta: number) => {
        if (!user || !basket || !db) return;
        const basketRef = doc(db, 'baskets', basket.basketId);
        
        const updatedItems = basket.items.map(item => {
            if (item.gtin === gtin) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        });

        const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        await updateDoc(basketRef, {
            items: updatedItems,
            total: newTotal,
            updatedAt: serverTimestamp()
        });
    };

    const handleRemoveItem = async (gtin: string) => {
        if (!user || !basket || !db) return;
        const basketRef = doc(db, 'baskets', basket.basketId);
        
        const updatedItems = basket.items.filter(item => item.gtin !== gtin);
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        if (updatedItems.length === 0) {
            await deleteDoc(basketRef);
        } else {
            await updateDoc(basketRef, {
                items: updatedItems,
                total: newTotal,
                updatedAt: serverTimestamp()
            });
        }
    };

    const handleScanPos = (data: string) => {
        if (!user || !basket || !db) return;
        
        setIsScanning(false);
        const basketRef = doc(db, 'baskets', basket.basketId);
        
        updateDoc(basketRef, {
            status: 'synced',
            terminalId: data,
            updatedAt: serverTimestamp()
        });

        toast({
            title: "Basket Synced with POS",
            description: "Global identifiers and sessionId transferred to physical terminal.",
        });
    };

    const handleSimulatePayment = async () => {
        if (!user || !basket || !db) return;
        
        // Data Integrity Gate
        if (!basket.sessionId || !basket.retailerId) {
            toast({ 
                title: "Data Integrity Error", 
                description: "Cannot archive transaction without authoritative journey sessionId.",
                variant: "destructive"
            });
            return;
        }

        setIsPaying(true);
        setTimeout(async () => {
            const transactionId = `gs1_txn_${crypto.randomUUID()}`;
            const txnRef = doc(db, 'transactions', transactionId);
            
            await setDoc(txnRef, {
                transactionId,
                sessionId: basket.sessionId, // Inherited from authoritative journey
                basketId: basket.basketId,
                retailerId: basket.retailerId, // Inherited from authoritative context
                shopperId: user.uid,
                amount: basket.total,
                paymentMethod: 'In-App Mobile POS',
                items: basket.items,
                timestamp: serverTimestamp(),
                dataStatus: 'VERIFIED' // Lineage exists
            });

            const basketRef = doc(db, 'baskets', basket.basketId);
            await updateDoc(basketRef, { status: 'paid', updatedAt: serverTimestamp() });

            setIsPaying(false);
            setIsPaid(true);
            toast({ title: "Payment Successful", description: "Transaction finalized and archived via sessionId lineage." });
        }, 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight">Smart Trolley</h1>
                    <p className="text-muted-foreground">Identify yourself to build a persistent digital basket.</p>
                </div>
                <Button asChild className="w-full max-w-xs h-14 rounded-2xl text-lg font-bold">
                    <Link href="/">Back to Scan</Link>
                </Button>
            </div>
        );
    }

    if (isPaid) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-500">
                    <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">Transaction Complete</h1>
                    <p className="text-muted-foreground font-medium">Digital receipt archived via GS1 identifiers.</p>
                </div>
                <Button asChild variant="outline" className="w-full max-w-xs h-14 rounded-2xl font-bold">
                    <Link href="/">Return to Shopping</Link>
                </Button>
            </div>
        );
    }

    if (!basket || basket.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <header className="p-4 border-b flex items-center gap-4">
                    <BackButton fallback="/" label="Back to Shopping" className="mb-0" />
                    <h1 className="text-xl font-black">My Trolley</h1>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Trolley is empty</h2>
                        <p className="text-muted-foreground">Initialize a session by scanning product Digital Links.</p>
                    </div>
                    <Button asChild variant="secondary" className="w-full max-w-xs h-14 rounded-2xl font-bold">
                        <Link href="/">Start Scanning</Link>
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <header className="p-4 bg-background border-b flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <BackButton fallback="/" label="Back" className="mb-0" />
                    <h1 className="text-xl font-black tracking-tight">Virtual Trolley</h1>
                </div>
                <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase tracking-widest text-[9px] px-2">
                    <ShieldCheck className="h-3 w-3 mr-1" /> GS1 ALIGNED
                </Badge>
            </header>

            <main className="flex-1 p-4 space-y-4 pb-48">
                {integrityError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Lineage Error</AlertTitle>
                        <AlertDescription>{integrityError}</AlertDescription>
                    </Alert>
                )}

                {isScanning && (
                    <Card className="border-accent bg-accent/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><QrCode className="h-4 w-4" /> Sync with Terminal</CardTitle>
                            <CardDescription>Handshake with the POS terminal to transfer identifiers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QrScannerCamera onScan={handleScanPos} />
                            <Button variant="ghost" onClick={() => setIsScanning(false)} className="w-full mt-4">Cancel Sync</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    {basket.items.map((item) => (
                        <Card key={item.gtin} className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-4 flex gap-4">
                                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <div className="flex items-center gap-1.5 opacity-50"><Barcode className="h-2.5 w-2.5" /><span className="text-[8px] font-mono font-bold">{item.gtin}</span></div>
                                    <p className="text-primary font-black text-lg">R{item.price.toFixed(2)}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-full" 
                                                onClick={() => handleUpdateQuantity(item.gtin, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="font-bold text-sm">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => handleUpdateQuantity(item.gtin, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.gtin)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Continuity Suggestion */}
                <Card className="border-accent/20 bg-accent/5">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Sparkles className="h-5 w-5 text-accent" />
                        <p className="text-xs font-medium">Building a persistent journey. Your trolley data is secured via GS1 standards.</p>
                    </CardContent>
                </Card>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-50">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Value</span>
                        <span className="text-4xl font-black tracking-tighter">R{basket.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="h-14 rounded-2xl flex-1 font-bold gap-2"
                            onClick={() => setIsScanning(true)}
                            disabled={!!integrityError}
                        >
                            <QrCode className="h-5 w-5" /> Sync Terminal
                        </Button>
                        <Button 
                            className="h-14 rounded-2xl flex-[2] font-black text-lg gap-2 shadow-xl"
                            onClick={handleSimulatePayment}
                            disabled={isPaying || !!integrityError}
                        >
                            {isPaying ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="h-6 w-6" />}
                            Checkout
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
