// This is a server-only file.
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

/**
 * Robustly initializes the Firebase Admin SDK for server-side usage.
 * It uses a singleton pattern to ensure initializeApp is only called once.
 */
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Initialize with the project ID from the shared config.
  // In most cloud environments (like App Hosting), this will automatically find 
  // the necessary service account credentials.
  return admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const app = getAdminApp();
const firestore = app.firestore();
const auth = app.auth();

export { firestore, auth };
