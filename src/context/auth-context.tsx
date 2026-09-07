'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  AuthorizationScope,
  CanonicalRole,
  Permissions,
} from '@/lib/auth-types';

type AuthUser = User & {
  retailerId?: string;
  role?: CanonicalRole;
  scope?: AuthorizationScope;
  permissions?: Permissions;
  isActive?: boolean;
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
      console.warn('[Auth] Firebase services are not initialized.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
          console.error('[Auth] Authoritative user profile not found.');
          setUser(null);
          setLoading(false);
          return;
        }

        const profile = profileSnapshot.data();

        if (
          profile.uid !== firebaseUser.uid ||
          typeof profile.retailerId !== 'string' ||
          typeof profile.role !== 'string' ||
          !profile.scope ||
          !profile.permissions ||
          profile.isActive !== true
        ) {
          console.error('[Auth] Invalid or inactive authoritative user profile.');
          setUser(null);
          setLoading(false);
          return;
        }

        const authUser: AuthUser = Object.assign(firebaseUser, {
          retailerId: profile.retailerId as string,
          role: profile.role as CanonicalRole,
          scope: profile.scope as AuthorizationScope,
          permissions: profile.permissions as Permissions,
          isActive: profile.isActive as boolean,
        });

        setUser(authUser);
      } catch (error) {
        console.error('[Auth] Failed to load authoritative user profile:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
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
