
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  logoWidth: number;
  setLogoWidth: (width: number) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOGO_URL_KEY = 'retailer-mvp-logo';
const LOGO_WIDTH_KEY = 'retailer-mvp-logo-width';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [logoWidth, setLogoWidthState] = useState<number>(128);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after initial render
    const savedLogo = localStorage.getItem(LOGO_URL_KEY);
    const savedWidth = localStorage.getItem(LOGO_WIDTH_KEY);
    if (savedLogo) {
      setLogoUrlState(savedLogo);
    }
    if (savedWidth) {
      setLogoWidthState(Number(savedWidth));
    }
    setIsLoaded(true);
  }, []);

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
    if (url) {
      localStorage.setItem(LOGO_URL_KEY, url);
    } else {
      localStorage.removeItem(LOGO_URL_KEY);
    }
  };

  const setLogoWidth = (width: number) => {
    setLogoWidthState(width);
    localStorage.setItem(LOGO_WIDTH_KEY, String(width));
  };
  
  // Don't render children until the state has been loaded from localStorage
  // to prevent hydration mismatch.
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ logoUrl, setLogoUrl, logoWidth, setLogoWidth }}>
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
