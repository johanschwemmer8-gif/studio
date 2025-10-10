
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "#solution", label: "Solution" },
  { href: "#why-interact", label: "Why iNteract" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

function LandingLogo() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState<number>(128);

    useEffect(() => {
        const savedLogo = localStorage.getItem('interact-aoe-logo');
        if (savedLogo) {
            setLogoUrl(savedLogo);
        }
        const savedWidth = localStorage.getItem('interact-aoe-logo-width');
        if (savedWidth) {
            setLogoWidth(Number(savedWidth));
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'interact-aoe-logo') {
                setLogoUrl(e.newValue);
            }
             if (e.key === 'interact-aoe-logo-width') {
                setLogoWidth(Number(e.newValue || 128));
            }
        };

        const handleCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.key !== 'interact-aoe-logo' && detail.key !== 'interact-aoe-logo-width') return;
            
            const updatedLogo = localStorage.getItem('interact-aoe-logo');
            setLogoUrl(updatedLogo);
            const updatedWidth = localStorage.getItem('interact-aoe-logo-width');
            setLogoWidth(Number(updatedWidth || 128));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleCustomEvent);
        };
    }, []);

    return (
        <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
                <Image 
                    src={logoUrl} 
                    alt="iNteract AOE Logo" 
                    width={logoWidth} 
                    height={logoWidth / (128/40)}
                    className="h-auto"
                    style={{ width: `${logoWidth}px` }}
                />
            ) : (
                <span className="text-xl font-bold text-primary">iNteract AOE</span>
            )}
        </Link>
    );
}


export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <LandingLogo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/login">Log In</Link>
          </Button>
          <Button>Request a Demo</Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium">
                <LandingLogo />
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
