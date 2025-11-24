'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';

type AuthCallbacks = {
  onSuccess?: (userCredential: UserCredential) => void;
  onError?: (error: any) => void;
};

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth, callbacks?: AuthCallbacks): void {
  signInAnonymously(authInstance)
    .then(userCredential => {
      callbacks?.onSuccess?.(userCredential);
    })
    .catch(error => {
      callbacks?.onError?.(error);
    });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, callbacks?: AuthCallbacks): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      callbacks?.onSuccess?.(userCredential);
    })
    .catch(error => {
      callbacks?.onError?.(error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, callbacks?: AuthCallbacks): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      callbacks?.onSuccess?.(userCredential);
    })
    .catch(error => {
      callbacks?.onError?.(error);
    });
}
