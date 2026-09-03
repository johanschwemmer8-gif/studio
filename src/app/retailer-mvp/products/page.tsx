'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { addCanonicalProduct } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    PlusCircle, ShoppingBasket, Loader2, Trash2, 
    Barcode, Info, CheckCircle2, QrCode, AlertTriangle, Pencil, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Product = {
    gtin: string;
    name: string;
    description: string;
    category: string;
    price: number;
    imageUrl: string;
};

export default function ProductCatalogPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State for Add
    const [formData, setFormData] = useState({
        gtin: '',
        name: '',
        description: '',
        category: 'General',
        price: '',
        imageUrl: ''
    });

    const retailerId = user?.retailerId || 'unknown';

    useEffect(() => {
        if (!db || retailerId === 'unknown') {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'products'), where('retailerId', '==', retailerId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Product[] = snapshot.docs.map(doc => doc.data() as Product);
            setProducts(fetched);
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast({ title: "Error", description: "Could not load catalog.", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [retailerId, toast]);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (retailerId === 'unknown' || !user) {
            toast({
                title: "Authentication Required",
                description: "Your account is not linked to a retailer.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);

        try {
            const idToken = await user.getIdToken();

            const result = await addCanonicalProduct(
                {
                    gtin: formData.gtin,
                    retailerId,
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    price: parseFloat(formData.price),
                    imageUrl: formData.imageUrl,
                    source: 'MANUAL'
                },
                idToken
            );

            if (!result.success) {
                toast({
                    title: "Save Failed",
                    description: result.error,
                    variant: "destructive"
                });
                return;
            }

            toast({
                title: "Product Added",
                description: `"${formData.name}" added successfully.`
            });

            setIsAddModalOpen(false);
            setFormData({
                gtin: '',
                name: '',
                description: '',
                category: 'General',
                price: '',
                imageUrl: ''
            });
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error?.message || "Unable to add product.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingProduct) return;

        setIsSaving(true);
        try {
            const productRef = doc(db, 'products', editingProduct.gtin);
            await updateDoc(productRef, {
                name: editingProduct.name,
                description: editingProduct.description,
                category: editingProduct.category,
                price: parseFloat(editingProduct.price.toString()) || 0,
                imageUrl: editingProduct.imageUrl,
                updatedAt: serverTimestamp()
            });

            toast({ title: "Product Updated", description: "Changes saved to Firestore." });
            setEditingProduct(null);
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (gtin: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'products', gtin));
            toast({ title: "Product Removed", description: "Record deleted." });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Retrieving Catalog...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
                        <ShoppingBasket className="text-primary h-8 w-8" />
                        Product Catalog
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-sm">
                        Manage your participating pilot inventory. Products listed here are available for immediate QR Activation.
                    </p>
                </div>

                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl">
                            <PlusCircle className="h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleAddProduct}>
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                                <DialogDescription>Register a new item in your digital catalog.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-6">
                                <div className="space-y-2">
                                    <Label htmlFor="gtin" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Barcode</Label>
                                    <Input id="gtin" placeholder="e.g. 6001234567890" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} required className="h-11 font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</Label>
                                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (R)</Label>
                                        <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                                        <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-11" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Textarea id="desc" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSaving} className="w-full h-12 font-black uppercase text-[10px] tracking-widest">
                                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                    Save to Catalog
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleUpdateProduct}>
                        <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>Modify details for barcode: <span className="font-mono text-primary">{editingProduct?.gtin}</span></DialogDescription>
                        </DialogHeader>
                        {editingProduct && (
                            <div className="grid gap-5 py-6">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</Label>
                                    <Input id="edit-name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required className="h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-price" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (R)</Label>
                                        <Input id="edit-price" type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} required className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                                        <Input id="edit-category" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="h-11" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Textarea id="edit-desc" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-image" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Image URL</Label>
                                    <Input id="edit-image" value={editingProduct.imageUrl} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} placeholder="https://..." className="h-11" />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving} className="w-full h-12 font-black uppercase text-[10px] tracking-widest">
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {products.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center gap-4">
                        <ShoppingBasket className="h-12 w-12 text-muted-foreground/30" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold uppercase tracking-tight">Your catalog is empty</h3>
                            <p className="text-sm text-muted-foreground">Add products to begin generating digital links.</p>
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} variant="secondary" className="mt-4 font-bold px-8">Add First Product</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="text-[10px] font-black uppercase tracking-widest">
                                <TableHead className="w-[300px]">Product</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((p) => (
                                <TableRow key={p.gtin} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div>
                                            <p className="font-bold text-sm">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{p.category}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-primary font-medium">{p.gtin}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-0.5 text-[9px] font-black uppercase">
                                            <CheckCircle2 className="h-3 w-3" /> Ready to Activate
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button asChild variant="outline" size="sm" className="font-bold text-[10px] uppercase tracking-widest h-8 px-3">
                                                <Link href={`/retailer-mvp/qr-management?gtin=${p.gtin}`}>
                                                    <QrCode className="h-3.5 w-3.5 mr-1.5" /> Activate
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setEditingProduct(p)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteProduct(p.gtin)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
