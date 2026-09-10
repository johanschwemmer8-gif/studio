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

/**
 * Platform operators are a completely separate authorization model from
 * retailer users (see firestore.rules: isPlatformOperator() is intentionally
 * independent of the retailer /users/{uid} profile).
 *
 * AuthUser.role therefore accepts either a retailer CanonicalRole OR the
 * literal 'platformOperator' role, and isPlatformOperator flags which case
 * applies so pages can branch on it if needed.
 */
type AuthUser = User & {
  retailerId?: string;
  role?: CanonicalRole | 'platformOperator';
  scope?: AuthorizationScope;
  permissions?: Permissions;
  isActive?: boolean;
  isPlatformOperator?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Platform operators are implicitly granted full functional permissions.
 * They are not tied to a retailer/network scope, so retailer-side
 * permission checks are not meaningful for them, but we populate a
 * fully-permissive object so any UI that reads user.permissions.* does
 * not unexpectedly break for an operator.
 */
const PLATFORM_OPERATOR_PERMISSIONS: Permissions = {
  dashboard: true,
  roi: true,
  visualsReporting: true,
  realTime: true,
  abTesting: true,
  systemIntegration: true,
  retailMediaNetwork: true,
  manageUsers: true,
  manageOrganization: true,
  approve: true,
  export: true,
};

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
          /*
           * No retailer-side profile. Before treating this as an
           * unauthenticated identity, check whether this is a platform
           * operator instead — a separate, independent authorization
           * model (see firestore.rules: isPlatformOperator()).
           */
          const operatorRef = doc(db, 'platformOperators', firebaseUser.uid);
          const operatorSnapshot = await getDoc(operatorRef);

          if (operatorSnapshot.exists()) {
            const operatorProfile = operatorSnapshot.data();

            if (
              operatorProfile.uid === firebaseUser.uid &&
              operatorProfile.role === 'platformOperator' &&
              operatorProfile.isActive === true
            ) {
              const operatorUser: AuthUser = Object.assign(firebaseUser, {
                role: 'platformOperator' as const,
                isActive: true,
                isPlatformOperator: true,
                permissions: PLATFORM_OPERATOR_PERMISSIONS,
              });

              setUser(operatorUser);
              setLoading(false);
              return;
            }

            console.error('[Auth] Invalid or inactive platform operator profile.');
            setUser(null);
            setLoading(false);
            return;
          }

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
          isPlatformOperator: false,
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
