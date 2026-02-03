import { getApps, initializeApp, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

/**
 * Robustly initializes the Firebase Admin SDK for server-side usage.
 * Uses modular imports which are more reliable in Next.js App Router environments.
 */
function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Initialize with the project ID from the shared config.
  // In most cloud environments (like App Hosting), this will automatically find 
  // the necessary service account credentials.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const app = getAdminApp();
const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { firestore, auth, app };
