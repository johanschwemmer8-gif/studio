'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type ThemeContextType = {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  logoWidth: number;
  setLogoWidth: (width: number) => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [logoWidth, setLogoWidthState] = useState<number>(128);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.retailerId || !db) {
        setIsLoading(false);
        return;
    }

    const docRef = doc(db, 'configurations', `${user.retailerId}_brand`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const config = docSnap.data().data;
            setLogoUrlState(config.logoUrl);
            setLogoWidthState(config.logoWidth || 128);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId]);

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
  };

  const setLogoWidth = (width: number) => {
    setLogoWidthState(width);
  };

  return (
    <ThemeContext.Provider value={{ logoUrl, setLogoUrl, logoWidth, setLogoWidth, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}