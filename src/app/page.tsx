
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

export default function Home() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real application, you'd handle authentication here.
    // For this prototype, we'll just redirect.
    setOpen(false);
    router.push('/dashboard/admin');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link href="/" className="font-bold text-lg">
          iNteract AOE
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
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
                    <Button type="button" variant="link" className="p-0 h-auto font-normal">Forgot password?</Button>
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
    </div>
  );
}
