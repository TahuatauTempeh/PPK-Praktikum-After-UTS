import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { getFirebaseAuth } from '@/lib/firebase/auth';
import { setAuditActor } from '@/lib/firebase/audit';
import { toUserProfile } from '@/lib/firebase/converters';
import { mapFirebaseError, type AppError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import type { RegisterInput, UserProfile } from '@/types';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'profile-missing'
  | 'error';

interface AuthContextValue {
  status: AuthStatus;
  profile: UserProfile | null;
  profileError: AppError | null;
  isAdmin: boolean;
  signIn(email: string, password: string): Promise<void>;
  registerPraktikan(input: RegisterInput): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<AppError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const pendingProfile = useRef(false);

  useEffect(() => {
    let firebaseAuth: ReturnType<typeof getFirebaseAuth>;

    try {
      firebaseAuth = getFirebaseAuth();
    } catch (error) {
      setProfileError(mapFirebaseError(error));
      setStatus('error');
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        unsubscribeProfile?.();
        unsubscribeProfile = undefined;

        if (cancelled) return;

        if (!user) {
          pendingProfile.current = false;
          setProfile(null);
          setProfileError(null);
          setAuditActor(null);
          setStatus('unauthenticated');
          return;
        }

        setStatus('loading');
        setProfileError(null);

        unsubscribeProfile = onSnapshot(
          doc(getDb(), COLLECTIONS.users, user.uid),
          (snapshot) => {
            if (cancelled) return;

            if (snapshot.exists()) {
              const nextProfile = toUserProfile(snapshot);
              pendingProfile.current = false;
              setProfile(nextProfile);
              setAuditActor({ uid: nextProfile.id, role: nextProfile.role });
              setProfileError(null);
              setStatus('authenticated');
              return;
            }

            if (pendingProfile.current) return;

            setProfile(null);
            setAuditActor(null);
            setStatus('profile-missing');
          },
          (error) => {
            if (cancelled) return;
            setProfile(null);
            setAuditActor(null);
            setProfileError(mapFirebaseError(error));
            setStatus('error');
          }
        );
      },
      (error) => {
        if (cancelled) return;
        setProfileError(mapFirebaseError(error));
        setStatus('error');
      }
    );

    return () => {
      cancelled = true;
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, [refreshKey]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim().toLowerCase(),
      password
    );
  }, []);

  const registerPraktikan = useCallback(async (input: RegisterInput) => {
    pendingProfile.current = true;
    let createdUser: FirebaseUser | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        input.email.trim().toLowerCase(),
        input.password
      );
      createdUser = credential.user;

      await setDoc(doc(getDb(), COLLECTIONS.users, createdUser.uid), {
        name: input.name.trim(),
        nim: input.nim.trim(),
        email: input.email.trim().toLowerCase(),
        role: 'praktikan',
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      pendingProfile.current = false;
      if (createdUser) {
        await deleteUser(createdUser).catch(() => undefined);
      }
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const refreshProfile = useCallback(async () => {
    setRefreshKey((value) => value + 1);
  }, []);

  const isAdmin = profile?.isAdmin === true;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      profileError,
      isAdmin,
      signIn,
      registerPraktikan,
      signOut: handleSignOut,
      refreshProfile,
    }),
    [status, profile, profileError, isAdmin, signIn, registerPraktikan, handleSignOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return value;
}
