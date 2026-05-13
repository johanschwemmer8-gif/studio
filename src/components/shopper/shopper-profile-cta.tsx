
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Loader2, BookmarkCheck, ShieldCheck } from 'lucide-react';
import ShopperAuthDialog from './shopper-auth-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/data';
import { cn } from '@/lib/utils';

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
      <Card className={cn(
        "border-2 transition-all duration-500 overflow-hidden",
        isSaved ? "border-green-500/50 bg-green-50/50" : "border-accent/50 bg-accent/5"
      )}>
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-500",
              isSaved ? "bg-green-100" : "bg-accent/20"
            )}>
              {isSaved ? <ShieldCheck className="h-6 w-6 text-green-600" /> : <Sparkles className="h-6 w-6 text-accent" />}
            </div>
            <div>
              <p className="font-bold text-base">
                {isSaved ? 'Identity Secure & Synced' : 'Persistent Shopping Memory'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSaved ? 'This product is saved to your profile across all stores.' : 'Save your preferences and AI recommendations?'}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveToProfile} 
            disabled={isSaving || isSaved}
            variant={isSaved ? "secondary" : "default"}
            size="lg"
            className={cn(
                "w-full sm:w-auto h-12 px-8 rounded-xl font-bold transition-all duration-300",
                isSaved && "bg-green-100 text-green-700 hover:bg-green-100 border-none"
            )}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="mr-2 h-5 w-5" />
            ) : (
              <Heart className="mr-2 h-5 w-5 fill-current" />
            )}
            {isSaved ? 'Saved to Profile' : 'Save Recommendations'}
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
