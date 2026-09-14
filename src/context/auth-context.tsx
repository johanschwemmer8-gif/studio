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

export type AccessType = 'platform' | 'retailer' | null;

type AuthUser = User & {
  accessType?: Exclude<AccessType, null>;
  retailerId?: string;
  role?: CanonicalRole | 'platformOperator';
  scope?: AuthorizationScope;
  permissions?: Permissions;
  isActive?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  accessType: AccessType;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessType, setAccessType] = useState<AccessType>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth || !db) {
      console.warn('[Auth] Firebase services are not initialized.');
      setUser(null);
      setAccessType(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setAccessType(null);
        setLoading(false);
        return;
      }

      try {
        /**
         * PLATFORM AUTHORIZATION
         *
         * Firebase Authentication establishes identity.
         * /platformOperators/{uid} establishes iNteract platform authorization.
         *
         * Platform authorization is deliberately separate from retailer
         * authorization and does not require a retailerId.
         */
        const platformRef = doc(db, 'platformOperators', firebaseUser.uid);
        const platformSnapshot = await getDoc(platformRef);

        if (platformSnapshot.exists()) {
          const operator = platformSnapshot.data();

          if (
            operator.uid === firebaseUser.uid &&
            operator.role === 'platformOperator' &&
            operator.isActive === true
          ) {
            const platformUser: AuthUser = Object.assign(firebaseUser, {
              accessType: 'platform' as const,
              role: 'platformOperator' as const,
              isActive: true,
            });

            setUser(platformUser);
            setAccessType('platform');
            return;
          }

          console.error('[Auth] Invalid or inactive platform operator record.');
          setUser(null);
          setAccessType(null);
          return;
        }

        /**
         * RETAILER AUTHORIZATION
         *
         * /users/{uid} is the authoritative retailer authorization profile.
         */
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
          console.error('[Auth] No authoritative authorization profile found.');
          setUser(null);
          setAccessType(null);
          return;
        }

        const profile = profileSnapshot.data();

        if (
          profile.uid !== firebaseUser.uid ||
          typeof profile.retailerId !== 'string' ||
          profile.retailerId === '' ||
          typeof profile.role !== 'string' ||
          !profile.scope ||
          !profile.permissions ||
          profile.isActive !== true
        ) {
          console.error('[Auth] Invalid or inactive retailer authorization profile.');
          setUser(null);
          setAccessType(null);
          return;
        }

        const retailerUser: AuthUser = Object.assign(firebaseUser, {
          accessType: 'retailer' as const,
          retailerId: profile.retailerId as string,
          role: profile.role as CanonicalRole,
          scope: profile.scope as AuthorizationScope,
          permissions: profile.permissions as Permissions,
          isActive: true,
        });

        setUser(retailerUser);
        setAccessType('retailer');
      } catch (error) {
        console.error('[Auth] Failed to resolve authoritative authorization:', error);
        setUser(null);
        setAccessType(null);
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
    setAccessType(null);
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
    <AuthContext.Provider value={{ user, loading, accessType, signOut }}>
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
