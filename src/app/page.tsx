
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import QrScanner from '@/components/qr-scanner';
import Link from 'next/link';
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

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real application, you'd handle authentication here.
    // For this prototype, we'll just redirect.
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link href="/" className="font-bold text-lg">
          iNteract AOE
        </Link>
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost">iNteract Dashboard</Button>
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
