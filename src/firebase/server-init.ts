
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

/**
 * Initializes and returns the Firebase Admin SDK app.
 */
function getAdminApp() {
  if (getApps().length === 0) {
    // In many server environments, providing the projectId is enough
    // for the SDK to find service account credentials automatically.
    return initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  return getApp();
}

// Export pre-initialized admin services
export const adminDb = getFirestore(getAdminApp());
export const adminAuth = getAuth(getAdminApp());
