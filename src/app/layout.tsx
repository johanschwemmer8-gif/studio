'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <title>iNteract AOE - Persistent Retail Intelligence Infrastructure</title>
        <meta name="description" content="AI-powered in-store decision intelligence platform and behavioural analytics ecosystem for physical retail." />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
            {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
