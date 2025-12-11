import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

export class FirebaseAdminService {
  private static instance: FirebaseAdminService;
  private app: admin.app.App | null = null;

  private constructor() {
    // Initialize Firebase Admin SDK
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set. Firebase Admin SDK will not be initialized.');
      return;
    }

    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      this.app = null;
    }
  }

  public static getInstance(): FirebaseAdminService {
    if (!FirebaseAdminService.instance) {
      FirebaseAdminService.instance = new FirebaseAdminService();
    }
    return FirebaseAdminService.instance;
  }

  public getAuth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized.');
    }
    return this.app.auth();
  }

  public getFirestore(): admin.firestore.Firestore {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized.');
    }
    return this.app.firestore();
  }

  public getStorage(): admin.storage.Storage {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized.');
    }
    return this.app.storage();
  }

  // Add more methods as needed for other Firebase services
}
