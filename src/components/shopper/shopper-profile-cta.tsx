
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Loader2, BookmarkCheck } from 'lucide-react';
import ShopperAuthDialog from './shopper-auth-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/data';

type ShopperProfileCtaProps = {
  product: Product;
};

export default function ShopperProfileCta({ product }: ShopperProfileCtaProps) {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const handleSaveToProfile = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const savedRef = doc(db, 'shoppers', user.uid, 'savedProducts', product.id);
      await setDoc(savedRef, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category,
        retailerId: 'simulated-retailer-id',
        savedAt: serverTimestamp(),
      });
      
      // Log interaction
      const eventRef = doc(db, 'shoppers', user.uid, 'interactions', `save_${Date.now()}`);
      await setDoc(eventRef, {
        shopperId: user.uid,
        productId: product.id,
        retailerId: 'simulated-retailer-id',
        eventType: 'save',
        timestamp: serverTimestamp(),
      });

      setIsSaved(true);
      toast({
        title: "Product Saved",
        description: "You can find this in your smart shopping profile.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="border-accent/50 bg-accent/5 overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-sm">Persistent Shopping Memory</p>
              <p className="text-xs text-muted-foreground">Save this product to your profile for comparisons and guidance.</p>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveToProfile} 
            disabled={isSaving || isSaved}
            variant={isSaved ? "secondary" : "default"}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="mr-2 h-4 w-4" />
            ) : (
              <Heart className="mr-2 h-4 w-4" />
            )}
            {isSaved ? 'Saved to Profile' : 'Save to Smart Profile'}
          </Button>
        </CardContent>
      </Card>

      <ShopperAuthDialog 
        isOpen={isAuthOpen} 
        onOpenChange={setIsAuthOpen} 
        onSuccess={handleSaveToProfile}
      />
    </>
  );
}
