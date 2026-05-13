
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, QrCode, Monitor, User, Package, 
    ArrowRight, Loader2, CheckCircle2, ShieldCheck, 
    Smartphone, Banknote, CreditCard, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type BasketItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
};

type SyncedBasket = {
    id: string;
    shopperId: string;
    items: BasketItem[];
    total: number;
    status: 'active' | 'synced' | 'paid';
    terminalId?: string;
};

export default function PosTerminalSimulation() {
    const [syncedBasket, setSyncedBasket] = useState<SyncedBasket | null>(null);
    const [terminalId] = useState('register_001');
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!db) return;

        // Listen for baskets synced to THIS terminal
        const q = query(
            collection(db, 'baskets'), 
            where('terminalId', '==', terminalId),
            where('status', '==', 'synced')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSyncedBasket({ id: doc.id, ...doc.data() } as SyncedBasket);
                toast({ title: "Shopper Handshake Detected", description: "Mobile basket successfully transferred to terminal." });
            } else {
                setSyncedBasket(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [terminalId, toast]);

    const handleCompleteSale = async () => {
        if (!syncedBasket || !db) return;
        setIsProcessing(true);

        try {
            const transactionId = `txn_pos_${Date.now()}`;
            await addDoc(collection(db, 'transactions'), {
                transactionId,
                shopperId: syncedBasket.shopperId,
                retailerId: 'simulated-retailer-id',
                amount: syncedBasket.total,
                paymentMethod: 'POS Terminal Cash/Card',
                basketId: syncedBasket.id,
                terminalId: terminalId,
                timestamp: serverTimestamp()
            });

            const basketRef = doc(db, 'baskets', syncedBasket.id);
            await updateDoc(basketRef, { status: 'paid', updatedAt: serverTimestamp() });

            toast({ title: "Sale Completed", description: "POS transaction finalized." });
            setSyncedBasket(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!syncedBasket || !db) return;
        const basketRef = doc(db, 'baskets', syncedBasket.id);
        await updateDoc(basketRef, { status: 'active', terminalId: null });
        setSyncedBasket(null);
    };

    const terminalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${terminalId}&color=1a2238&bgcolor=ffffff`;

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Monitor className="text-primary h-8 w-8" />
                        POS Terminal Infrastructure
                    </h1>
                    <p className="text-muted-foreground max-w-3xl">
                        Simulate the physical point-of-sale handshake with the Virtual Smart Trolley.
                    </p>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Hardware-Independent POS
                </Badge>
            </div>

            <Separator />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* POS DISPLAY SECTION */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl bg-slate-900 text-white min-h-[500px] flex flex-col">
                        <CardHeader className="border-b border-white/10 flex flex-row justify-between items-center bg-slate-800/50">
                            <div>
                                <CardTitle className="text-xl font-black">Register #01</CardTitle>
                                <CardDescription className="text-slate-400">Store: Sandton City</CardDescription>
                            </div>
                            <Badge className="bg-green-500 text-white font-black border-none">SYSTEM READY</Badge>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0 flex">
                            {!syncedBasket ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 animate-pulse">
                                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                                        <ShoppingCart className="h-10 w-10 text-slate-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold">Awaiting Shopper Handshake...</h2>
                                        <p className="text-slate-400">Ask the shopper to scan the terminal QR code to transfer their trolley.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-6 bg-blue-600 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                                                <Smartphone className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest opacity-80">Mobile Basket Synced</p>
                                                <p className="font-bold text-lg">Shopper: {syncedBasket.shopperId.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black uppercase opacity-80">Transaction Total</p>
                                            <p className="text-3xl font-black">R{syncedBasket.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest text-left">
                                                    <th className="pb-4">Product Description</th>
                                                    <th className="pb-4 text-center">Qty</th>
                                                    <th className="pb-4 text-right">Price</th>
                                                    <th className="pb-4 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {syncedBasket.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="py-4 font-bold">{item.name}</td>
                                                        <td className="py-4 text-center font-mono">{item.quantity}</td>
                                                        <td className="py-4 text-right font-mono">R{item.price.toFixed(2)}</td>
                                                        <td className="py-4 text-right font-black">R{(item.price * item.quantity).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <CardFooter className="p-6 border-t border-white/10 bg-slate-800/30 flex gap-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={handleCancel}
                                            className="h-14 px-8 text-slate-300 hover:text-white hover:bg-white/10 font-bold"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                        </Button>
                                        <Button 
                                            onClick={handleCompleteSale}
                                            disabled={isProcessing}
                                            className="flex-1 h-14 bg-green-600 hover:bg-green-500 text-white font-black text-xl gap-3 shadow-2xl"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" /> : <Banknote className="h-6 w-6" />}
                                            Complete Cash/Card Sale
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* HANDSHAKE QR SECTION */}
                <div className="space-y-6">
                    <Card className="border-primary/20 bg-muted/30">
                        <CardHeader className="text-center">
                            <CardTitle className="text-lg flex items-center justify-center gap-2">
                                <QrCode className="text-primary h-5 w-5" />
                                Handshake Identity
                            </CardTitle>
                            <CardDescription>Shoppers scan this to sync their trolley.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-8 bg-white m-4 rounded-xl border shadow-inner">
                            <div className="relative group">
                                <Image src={terminalQrUrl} alt="Terminal Identity" width={250} height={250} className="rounded-md" />
                                <div className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                                    <p className="text-sm font-bold text-primary">Terminal ID: {terminalId}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/5 p-4 text-center">
                            <p className="text-[10px] font-black uppercase text-primary/60 w-full">Point-of-Sale Integration Hub</p>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" /> Infrastructure Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Active Handshakes:</span>
                                <span className="font-bold">{syncedBasket ? '1' : '0'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Avg. Sync Latency:</span>
                                <span className="font-bold text-green-600">0.8s</span>
                            </div>
                            <Separator />
                            <div className="p-3 bg-muted rounded-lg space-y-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Real-Time Event Stream</p>
                                {syncedBasket ? (
                                    <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                                        <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                        Mobile Trolley #821 Synced
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground italic">Awaiting events...</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
