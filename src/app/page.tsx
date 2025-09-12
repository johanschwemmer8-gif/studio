
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import QrScanner from '@/components/qr-scanner';
import Link from 'next/link';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function LandingPageLogo() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState<number>(128);
    const [logoAlign, setLogoAlign] = useState('flex-start');
    const [logoPadding, setLogoPadding] = useState(8);

    useEffect(() => {
        const savedLogo = localStorage.getItem('landing-page-logo');
        if (savedLogo) setLogoUrl(savedLogo);

        const savedWidth = localStorage.getItem('landing-page-logo-width');
        if (savedWidth) setLogoWidth(Number(savedWidth));
        
        const savedAlign = localStorage.getItem('landing-page-logo-align');
        if (savedAlign) setLogoAlign(savedAlign);

        const savedPadding = localStorage.getItem('landing-page-logo-padding');
        if (savedPadding) setLogoPadding(Number(savedPadding));

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'landing-page-logo') setLogoUrl(e.newValue);
            if (e.key === 'landing-page-logo-width') setLogoWidth(Number(e.newValue || 128));
            if (e.key === 'landing-page-logo-align') setLogoAlign(e.newValue || 'flex-start');
            if (e.key === 'landing-page-logo-padding') setLogoPadding(Number(e.newValue || 8));
        };
        
        const handleCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.key !== 'landing-page-logo') return;

            const updatedLogo = localStorage.getItem('landing-page-logo');
            setLogoUrl(updatedLogo);
            const updatedWidth = localStorage.getItem('landing-page-logo-width');
            setLogoWidth(Number(updatedWidth || 128));
            const updatedAlign = localStorage.getItem('landing-page-logo-align');
            setLogoAlign(updatedAlign || 'flex-start');
            const updatedPadding = localStorage.getItem('landing-page-logo-padding');
            setLogoPadding(Number(updatedPadding || 8));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleCustomEvent);
        };
    }, []);

    const logoContainerClass = cn('w-full px-4', {
        'text-left': logoAlign === 'flex-start',
        'text-center': logoAlign === 'center',
        'text-right': logoAlign === 'flex-end',
    });

    const headerStyle = {
      paddingTop: `${logoPadding}px`,
    };

    return (
        <header style={headerStyle} className="absolute top-0 left-0 right-0 flex justify-between items-center z-10">
            <div className={logoContainerClass}>
                <Link href="/" className="font-bold text-lg inline-block">
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt="iNteract AOE Logo"
                            width={logoWidth}
                            height={logoWidth / (128 / 50)} // Maintain aspect ratio
                            className="h-auto"
                            style={{ width: `${logoWidth}px` }}
                        />
                    ) : (
                        <span>iNteract AOE</span>
                    )}
                </Link>
            </div>
             <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="mr-4">iNteract Dashboard</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleLogin}>
                    <DialogHeader>
                        <DialogTitle>Admin Login</DialogTitle>
                        <DialogDescription>
                        Enter your credentials to access the iNteract Admin Panel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            defaultValue="admin@interact.io"
                            className="col-span-3"
                            required
                        />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            defaultValue="password"
                            className="col-span-3"
                            required
                        />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <div className="flex gap-2">
                            <Button type="button" variant="link" className="p-0 h-auto font-normal">Create new User</Button>
                            <Button type="button" variant="link" className="p-0 h-auto font-normal" onClick={handleForgotPassword}>Forgot password?</Button>
                        </div>
                        <Button type="submit">Log in</Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </header>
    );
}

// These state variables and handlers were moved from the main Home component
// to avoid prop-drilling into the LandingPageLogo component.
let isLoginOpen = false;
let setIsLoginOpen: (isOpen: boolean) => void;
let isRecoveryOpen = false;
let setIsRecoveryOpen: (isOpen: boolean) => void;
let router: any;
let toast: any;

const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginOpen(false);
    router.push('/dashboard/admin');
};

const handleForgotPassword = () => {
    setIsLoginOpen(false);
    setIsRecoveryOpen(true);
};

const handlePasswordRecovery = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRecoveryOpen(false);
    toast({
        title: "Recovery Email Sent",
        description: "If an account exists with that email, a recovery link has been sent.",
    });
};


export default function Home() {
  [isLoginOpen, setIsLoginOpen] = useState(false);
  [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  router = useRouter();
  ({ toast } = useToast());

  return (
    <div className="flex flex-col min-h-screen">
      <LandingPageLogo />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Shop Smarter, In-Store.
          </h2>
          <p className="max-w-xl mx-auto text-muted-foreground md:text-lg mb-8">
            Scan any product's QR code to get instant details, reviews, and
            AI-powered recommendations right on your phone.
          </p>
          <div className="max-w-xs mx-auto">
            <QrScanner />
          </div>
        </div>
      </main>

      {/* Password Recovery Dialog */}
       <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handlePasswordRecovery}>
              <DialogHeader>
                <DialogTitle>Password Recovery</DialogTitle>
                <DialogDescription>
                  Enter your email address below and we'll send you a link to reset your password.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recovery-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="name@example.com"
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsRecoveryOpen(false)}>Cancel</Button>
                <Button type="submit">Send Recovery Email</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
