'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, DocumentData } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// Internal state for user authentication and data
interface UserState {
  user: User | null;
  userDoc: DocumentData | null; // To store user data from Firestore
  isLoading: boolean;
  error: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  
  // User authentication and data state
  user: User | null;
  userDoc: DocumentData | null;
  isLoading: boolean; // Combined loading state for auth and user data
  error: Error | null; // Error from auth or data fetching
}

// Return type for useFirebase() - now includes userDoc
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userDoc: DocumentData | null;
  isLoading: boolean;
  error: Error | null;
}

// Return type for useUser() - more comprehensive
export interface UserHookResult {
  user: User | null;
  userDoc: DocumentData | null;
  isLoading: boolean;
  error: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserState>({
    user: null,
    userDoc: null,
    isLoading: true, // Start loading until initial auth check and data fetch is complete
    error: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserState({ user: null, userDoc: null, isLoading: false, error: new Error("Auth or Firestore service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUserState(prevState => ({ ...prevState, isLoading: true, error: null })); // Start loading on any auth change
      if (firebaseUser) {
        // User is signed in, fetch their document from Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserState({ user: firebaseUser, userDoc: docSnap.data(), isLoading: false, error: null });
          } else {
            // This is a critical state. The user is authenticated but has no data record.
            // This can happen briefly during signup. Treat it as an error/unauthorized state for login.
             console.error("User document not found for authenticated user:", firebaseUser.uid);
             setUserState({ user: firebaseUser, userDoc: null, isLoading: false, error: new Error("User data not found. Please try again.") });
          }
        } catch (e) {
          console.error("FirebaseProvider: Error fetching user document:", e);
          setUserState({ user: firebaseUser, userDoc: null, isLoading: false, error: e as Error });
        }
      } else {
        // User is signed out
        setUserState({ user: null, userDoc: null, isLoading: false, error: null });
      }
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserState({ user: null, userDoc: null, isLoading: false, error });
    });

    return () => unsubscribe(); // Cleanup
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userState.user,
      userDoc: userState.userDoc,
      isLoading: userState.isLoading,
      error: userState.error,
    };
  }, [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user state.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    userDoc: context.userDoc,
    isLoading: context.isLoading,
    error: context.error,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state, including their Firestore document.
 */
export const useUser = (): UserHookResult => {
  const { user, userDoc, isLoading, error } = useFirebase();
  return { user, userDoc, isLoading, error };
};

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  }
  
  type UserProviderProps = {
    children: ReactNode;
  };