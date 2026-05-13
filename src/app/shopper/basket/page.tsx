
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, Trash2, Plus, Minus, QrCode, CreditCard, 
    ArrowLeft, Loader2, Sparkles, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import PhoneMockup from '@/components/dashboard/phone-mockup';
import QrScannerCamera from '@/components/qr-scanner-camera';

type BasketItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    addedAt: string;
};

type Basket = {
    basketId: string;
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
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const basketRef = doc(db, 'baskets', `basket_${user.uid}`);
        const unsubscribe = onSnapshot(basketRef, (doc) => {
            if (doc.exists()) {
                setBasket(doc.data() as Basket);
            } else {
                setBasket(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleUpdateQuantity = async (productId: string, delta: number) => {
        if (!user || !basket || !db) return;
        const basketRef = doc(db, 'baskets', basket.basketId);
        
        const updatedItems = basket.items.map(item => {
            if (item.productId === productId) {
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

    const handleRemoveItem = async (productId: string) => {
        if (!user || !basket || !db) return;
        const basketRef = doc(db, 'baskets', basket.basketId);
        
        const updatedItems = basket.items.filter(item => item.productId !== productId);
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
        // data would be "terminal_001" or similar from the Terminal QR
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
            description: "Your digital trolley is now visible on the terminal. You can pay there or on your phone.",
        });
    };

    const handleSimulatePayment = async () => {
        setIsPaying(true);
        setTimeout(async () => {
            if (!user || !basket || !db) return;
            
            const transactionId = `txn_${Date.now()}`;
            const txnRef = doc(db, 'transactions', transactionId);
            
            await setDoc(txnRef, {
                transactionId,
                shopperId: user.uid,
                retailerId: 'simulated-retailer-id',
                amount: basket.total,
                paymentMethod: 'In-App Mobile POS',
                basketId: basket.basketId,
                timestamp: serverTimestamp()
            });

            const basketRef = doc(db, 'baskets', basket.basketId);
            await updateDoc(basketRef, { status: 'paid', updatedAt: serverTimestamp() });

            setIsPaying(false);
            setIsPaid(true);
            toast({ title: "Payment Successful", description: "Your receipt has been saved to your profile." });
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
                    <h1 className="text-2xl font-bold">Virtual Smart Trolley</h1>
                    <p className="text-muted-foreground">Identify yourself to build your digital basket while you shop.</p>
                </div>
                <Button asChild className="w-full max-w-xs h-14 rounded-xl text-lg font-bold">
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
                    <h1 className="text-3xl font-black">Purchase Complete!</h1>
                    <p className="text-muted-foreground">Your transaction was successful. You can now leave the store with your items. Digital receipt is in your profile.</p>
                </div>
                <Button asChild variant="outline" className="w-full max-w-xs h-14 rounded-xl font-bold">
                    <Link href="/">Return to Shopping</Link>
                </Button>
            </div>
        );
    }

    if (!basket || basket.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <header className="p-4 border-b flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/"><ArrowLeft /></Link></Button>
                    <h1 className="text-xl font-bold">My Smart Trolley</h1>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Your trolley is empty</h2>
                        <p className="text-muted-foreground">Scan products in-store to add them here.</p>
                    </div>
                    <Button asChild variant="secondary" className="w-full max-w-xs h-14 rounded-xl font-bold">
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
                    <Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/"><ArrowLeft /></Link></Button>
                    <h1 className="text-xl font-black tracking-tight">Virtual Trolley</h1>
                </div>
                <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase tracking-widest text-[9px] px-2">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Persistent Basket
                </Badge>
            </header>

            <main className="flex-1 p-4 space-y-4 pb-48">
                {isScanning && (
                    <Card className="border-accent bg-accent/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><QrCode className="h-4 w-4" /> Sync with Terminal</CardTitle>
                            <CardDescription>Scan the QR code on the register terminal to transfer your basket.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QrScannerCamera onScan={handleScanPos} />
                            <Button variant="ghost" onClick={() => setIsScanning(false)} className="w-full mt-4">Cancel Sync</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    {basket.items.map((item) => (
                        <Card key={item.productId} className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-4 flex gap-4">
                                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <p className="text-primary font-black text-lg">R{item.price.toFixed(2)}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-full" 
                                                onClick={() => handleUpdateQuantity(item.productId, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="font-bold text-sm">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => handleUpdateQuantity(item.productId, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.productId)}>
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
                        <p className="text-xs font-medium">Add a <strong>Reusable Tote</strong>? It pairs well with your items.</p>
                    </CardContent>
                </Card>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-50">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Estimated Total</span>
                        <span className="text-4xl font-black">R{basket.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="h-14 rounded-2xl flex-1 font-bold gap-2"
                            onClick={() => setIsScanning(true)}
                        >
                            <QrCode className="h-5 w-5" /> Sync with POS
                        </Button>
                        <Button 
                            className="h-14 rounded-2xl flex-[2] font-black text-lg gap-2 shadow-xl"
                            onClick={handleSimulatePayment}
                            disabled={isPaying}
                        >
                            {isPaying ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="h-6 w-6" />}
                            Mobile Checkout
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
