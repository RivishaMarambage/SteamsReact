// Do NOT add 'use client' to this file
import * as admin from 'firebase-admin';

// This is a server-only file.

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // In a Google Cloud environment (like Firebase Functions or Cloud Run),
    // this will automatically use the runtime's service account credentials.
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    // For local development, you might need a service account file.
    // Make sure GOOGLE_APPLICATION_CREDENTIALS is set in your environment.
  }
}

const firestore = admin.firestore();
const auth = admin.auth();

// Export the initialized admin services
export { firestore, auth };
