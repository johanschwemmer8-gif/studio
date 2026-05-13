
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, Monitor, Loader2, ShieldCheck, 
    Smartphone, Banknote, RotateCcw, Barcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type BasketItem = {
    gtin: string;
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
        const q = query(collection(db, 'baskets'), where('terminalId', '==', terminalId), where('status', '==', 'synced'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSyncedBasket({ id: doc.id, ...doc.data() } as SyncedBasket);
                toast({ title: "GS1 Handshake Detected", description: "Global identifiers transferred to terminal." });
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
            await addDoc(collection(db, 'transactions'), {
                transactionId: `gs1_txn_${Date.now()}`,
                shopperId: syncedBasket.shopperId,
                retailerId: 'simulated-retailer-id',
                amount: syncedBasket.total,
                paymentMethod: 'POS Terminal Cash/Card',
                items: syncedBasket.items,
                timestamp: serverTimestamp()
            });
            await updateDoc(doc(db, 'baskets', syncedBasket.id), { status: 'paid', updatedAt: serverTimestamp() });
            toast({ title: "Sale Completed", description: "Transaction archived via GTIN logging." });
            setSyncedBasket(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Monitor className="text-primary h-8 w-8" />
                        GS1 Compliant POS Infrastructure
                    </h1>
                    <p className="text-muted-foreground max-w-3xl">
                        Simulating the physical point-of-sale handshake using global trade identifiers.
                    </p>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" /> GS1 Global Standards Active
                </Badge>
            </div>

            <Separator />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl bg-slate-900 text-white min-h-[500px] flex flex-col">
                        <CardHeader className="border-b border-white/10 flex flex-row justify-between items-center bg-slate-800/50">
                            <div><CardTitle className="text-xl font-black">Register #01</CardTitle><CardDescription className="text-slate-400">Sync: GLN 6001234567890</CardDescription></div>
                            <Badge className="bg-green-500 text-white font-black border-none">GS1 READY</Badge>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0 flex">
                            {!syncedBasket ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center"><ShoppingCart className="h-10 w-10 text-slate-500" /></div>
                                    <h2 className="text-2xl font-bold">Awaiting GS1 Identity...</h2>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="p-6 bg-blue-600 flex items-center justify-between">
                                        <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"><Smartphone className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase opacity-80">GTIN Data Received</p><p className="font-bold text-lg">Shopper: {syncedBasket.shopperId.substring(0, 8)}</p></div></div>
                                        <div className="text-right"><p className="text-xs font-black uppercase opacity-80">Total</p><p className="text-3xl font-black">R{syncedBasket.total.toFixed(2)}</p></div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest text-left"><th className="pb-4">Standard Identifiers</th><th className="pb-4 text-center">Qty</th><th className="pb-4 text-right">Price</th></tr></thead>
                                            <tbody className="divide-y divide-white/5">
                                                {syncedBasket.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="py-4">
                                                            <p className="font-bold">{item.name}</p>
                                                            <div className="flex items-center gap-1.5 opacity-50"><Barcode className="h-3 w-3" /><span className="text-[9px] font-mono">GTIN: {item.gtin}</span></div>
                                                        </td>
                                                        <td className="py-4 text-center font-mono">{item.quantity}</td>
                                                        <td className="py-4 text-right font-mono font-black">R{item.price.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <CardFooter className="p-6 border-t border-white/10 bg-slate-800/30 flex gap-4">
                                        <Button variant="ghost" onClick={() => setSyncedBasket(null)} className="h-14 px-8 text-slate-300 font-bold"><RotateCcw /> Reset</Button>
                                        <Button onClick={handleCompleteSale} disabled={isProcessing} className="flex-1 h-14 bg-green-600 text-white font-black text-xl gap-3">
                                            {isProcessing ? <Loader2 className="animate-spin" /> : <Banknote />} Complete Final Sale
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-muted/30">
                        <CardHeader className="text-center"><CardTitle className="text-lg">Terminal Digital Link</CardTitle><CardDescription>Standardized GS1 identification.</CardDescription></CardHeader>
                        <CardContent className="flex justify-center p-8 bg-white m-4 rounded-xl shadow-inner">
                            <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://id.interact.io/414/register_001`} alt="GS1 GLN Code" width={250} height={250} />
                        </CardContent>
                        <CardFooter className="bg-primary/5 p-4 text-center"><p className="text-[10px] font-black uppercase text-primary/60 w-full">GLN: 6001234567890</p></CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
