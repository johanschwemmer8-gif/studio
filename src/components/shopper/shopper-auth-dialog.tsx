
'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    OAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Smartphone, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShopperAuthDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function ShopperAuthDialog({ isOpen, onOpenChange, onSuccess }: ShopperAuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleAuthSuccess = async (user: any) => {
    const shopperRef = doc(db, 'shoppers', user.uid);
    await setDoc(shopperRef, {
      uid: user.uid,
      email: user.email || '',
      phone: user.phoneNumber || '',
      displayName: user.displayName || 'Smart Shopper',
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    onSuccess();
    onOpenChange(false);
    toast({
      title: "Profile Synced",
      description: "Your preferences and recommendations are now securely saved.",
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your phone for the code." });
    } catch (error: any) {
      toast({ title: "OTP Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handleAuthSuccess(result.user);
    } catch (error: any) {
      toast({ title: "Invalid Code", description: "The OTP you entered is incorrect.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-accent" />
              Smart Shopping Profile
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-base">
              Save your preferences and AI recommendations for a personalized journey across all iNteract stores.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 gap-2" onClick={() => handleSocialAuth('google')} disabled={isLoading}>
              <Chrome className="h-5 w-5" /> Google
            </Button>
            <Button variant="outline" className="h-12 gap-2" onClick={() => handleSocialAuth('apple')} disabled={isLoading}>
              <Smartphone className="h-5 w-5" /> Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              <span className="bg-background px-3">Or choose a secure method</span>
            </div>
          </div>

          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="phone" className="rounded-lg gap-2"><Phone className="h-4 w-4"/> Phone</TabsTrigger>
              <TabsTrigger value="email" className="rounded-lg gap-2"><Mail className="h-4 w-4"/> Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="phone" className="mt-4 space-y-4">
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input id="phone" type="tel" placeholder="+27 00 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send One-Time PIN'}
                  </Button>
                  <div id="recaptcha-container"></div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-center">
                    <Label htmlFor="otp">Enter 6-digit Code</Label>
                    <Input id="otp" type="text" placeholder="000 000" value={otp} onChange={(e) => setOtp(e.target.value)} required className="h-14 text-center text-2xl tracking-[0.5em] rounded-xl" maxLength={6} />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Sign In'}
                  </Button>
                  <button type="button" onClick={() => setIsOtpSent(false)} className="w-full text-xs text-muted-foreground hover:underline">Change phone number</button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'Create Profile' : 'Sign In')}
                </Button>
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs text-muted-foreground hover:underline">
                  {isSignUp ? 'Already have a profile? Sign In' : 'New here? Create a Smart Profile'}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
