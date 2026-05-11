
'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    OAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone } from 'lucide-react';

type ShopperAuthDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function ShopperAuthDialog({ isOpen, onOpenChange, onSuccess }: ShopperAuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleAuthSuccess = async (user: any) => {
    // Initialize/Update persistent profile in Firestore
    const shopperRef = doc(db, 'shoppers', user.uid);
    await setDoc(shopperRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(), // Will merge if exists
    }, { merge: true });

    onSuccess();
    onOpenChange(false);
    toast({
      title: "Profile Synced",
      description: "This item is now saved to your smart shopping profile.",
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await handleAuthSuccess(result.user);
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (providerName: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (error: any) {
      toast({
        title: "Social Auth Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Smart Profile' : 'Access Your Profile'}</DialogTitle>
          <DialogDescription>
            Save products, view comparisons, and get personalized guidance across all iNteract stores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleSocialAuth('google')} disabled={isLoading}>
              Google
            </Button>
            <Button variant="outline" onClick={() => handleSocialAuth('apple')} disabled={isLoading}>
              Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button 
                type="button" 
                className="text-primary hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have a profile? Sign in' : 'No profile? Create one now'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
