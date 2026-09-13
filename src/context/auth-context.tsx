'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export type AuthUser = User & {
  retailerId?: string;
  role?: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst';
  isActive?: boolean;
  isPendingProvisioning?: boolean;
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
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Live subscription to user profile
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
              const profile = docSnap.data();
              const authUser: AuthUser = Object.assign(firebaseUser, {
                  retailerId: profile.retailerId,
                  role: profile.role,
                  isActive: profile.isActive,
                  isPendingProvisioning: false
              });
              setUser(authUser);
          } else {
              // Graceful Handling: User exists in Auth but not in Firestore yet
              const authUser: AuthUser = Object.assign(firebaseUser, {
                  isPendingProvisioning: true,
                  role: undefined,
                  retailerId: undefined
              });
              setUser(authUser);
          }
          setLoading(false);
      }, (error) => {
          console.error('[Auth] Profile sync error:', error);
          setLoading(false);
      });

      return () => unsubProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
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
