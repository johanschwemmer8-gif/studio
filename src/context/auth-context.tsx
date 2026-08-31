
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type AuthUser = User & {
    retailerId?: string;
    role?: 'admin' | 'retailer';
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth is not initialized. Skipping auth state changes.");
        setLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const claims = tokenResult.claims;

        console.log("[AUTH DEBUG] Firebase user:", firebaseUser.email);
        console.log("[AUTH DEBUG] Firebase UID:", firebaseUser.uid);
        console.log("[AUTH DEBUG] Firebase claims:", claims);
        console.log("[AUTH DEBUG] retailerId claim:", claims.retailerId);
        console.log("[AUTH DEBUG] role claim:", claims.role);
        
        const authUser: AuthUser = Object.assign(firebaseUser, {
            retailerId: claims.retailerId as string | undefined,
            role: claims.role as 'admin' | 'retailer' | undefined,
        });

        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
