import { Injectable, signal, computed } from '@angular/core';
import { Scene } from '../models/scene.model';
// Import Firebase modules
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User as FirebaseAuthUser, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Firebase Integration Service
 * Provides Auth, Firestore, and Storage capabilities
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Custom User interface to match our app's needs
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface CloudScene {
  id: string;
  userId: string;
  name: string;
  scene: Scene;
  shared: boolean;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
}

export interface CloudStreamSession {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  viewerCount: number;
  peakViewers: number;
  platform: string;
  status: 'live' | 'ended' | 'scheduled';
}

export interface StreamAnalytics {
  totalStreams: number;
  totalHours: number;
  totalViewers: number;
  averageViewers: number;
  peakViewers: number;
  followerGrowth: number;
  topGames: Array<{ game: string; hours: number }>;
  streamingDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firebaseApp: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private storage: FirebaseStorage | null = null;

  // Current user
  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();

  // Auth state
  private isAuthenticatedSignal = signal<boolean>(false);
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Firebase config
  private configSignal = signal<FirebaseConfig | null>(null);
  readonly config = this.configSignal.asReadonly();

  // Cloud scenes
  private cloudScenesSignal = signal<CloudScene[]>([]);
  readonly cloudScenes = this.cloudScenesSignal.asReadonly();

  // Stream sessions
  private streamSessionsSignal = signal<CloudStreamSession[]>([]);
  readonly streamSessions = this.streamSessionsSignal.asReadonly();

  // Analytics
  private analyticsSignal = signal<StreamAnalytics | null>(null);
  readonly analytics = this.analyticsSignal.asReadonly();

  // Sync state
  private isSyncingSignal = signal<boolean>(false);
  readonly isSyncing = this.isSyncingSignal.asReadonly();

  // Computed values
  readonly userScenes = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.cloudScenes().filter(scene => scene.userId === user.uid);
  });

  readonly sharedScenes = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.cloudScenes().filter(scene =>
      scene.shared && scene.sharedWith.includes(user.email)
    );
  });

  constructor() {
    // Constructor kept empty, initialization logic moved to initialize()
  }

  /**
   * Initialize Firebase client app
   */
  initialize(config: FirebaseConfig): void {
    if (this.firebaseApp) {
      console.warn('Firebase app already initialized.');
      return;
    }

    try {
      this.firebaseApp = initializeApp(config);
      this.auth = getAuth(this.firebaseApp);
      this.firestore = getFirestore(this.firebaseApp);
      this.storage = getStorage(this.firebaseApp);
      this.configSignal.set(config);
      console.log('Firebase client app initialized:', config.projectId);

      // Firebase Auth state listener
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          const customUser: User = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || user.email!.split('@')[0],
            photoURL: user.photoURL || undefined,
            emailVerified: user.emailVerified,
            createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
            lastLogin: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date()
          };
          this.currentUserSignal.set(customUser);
          this.isAuthenticatedSignal.set(true);
        } else {
          this.currentUserSignal.set(null);
          this.isAuthenticatedSignal.set(false);
        }
      });

    } catch (error) {
      console.error('Failed to initialize Firebase client app:', error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    if (!this.auth) throw new Error('Firebase Auth not initialized.');
    this.isSyncingSignal.set(true);
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await fetch('http://localhost:3333/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const user = userCredential.user;
      const customUser: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || user.email!.split('@')[0],
        photoURL: user.photoURL || undefined,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        lastLogin: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date()
      };
      return customUser;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    if (!this.auth) throw new Error('Firebase Auth not initialized.');
    this.isSyncingSignal.set(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await fetch('http://localhost:3333/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const user = userCredential.user;
      const customUser: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || user.email!.split('@')[0],
        photoURL: user.photoURL || undefined,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        lastLogin: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date()
      };
      return customUser;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.auth) throw new Error('Firebase Auth not initialized.');
    this.isSyncingSignal.set(true);
    try {
      await signOut(this.auth);
      await fetch('http://localhost:3333/api/auth/sessionLogout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Save scene to cloud
   */
  async saveSceneToCloud(scene: Scene, shared?: boolean): Promise<CloudScene> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);

    try {
      const sceneRef = doc(this.firestore, `users/${user.uid}/scenes`, scene.id);
      const cloudScene: CloudScene = {
        id: scene.id,
        userId: user.uid,
        name: scene.name,
        scene: scene, // Storing the full scene object
        shared: shared || false,
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0
      };
      await setDoc(sceneRef, cloudScene);
      this.cloudScenesSignal.update(scenes => [...scenes.filter(s => s.id !== scene.id), cloudScene]);
      return cloudScene;
    } catch (error) {
      console.error('Failed to save scene to cloud:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Load scene from cloud
   */
  async loadSceneFromCloud(sceneId: string): Promise<Scene> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);

    try {
      const sceneRef = doc(this.firestore, `users/${user.uid}/scenes`, sceneId);
      const sceneSnap = await getDoc(sceneRef);
      if (!sceneSnap.exists()) throw new Error('Scene not found');

      const cloudScene = sceneSnap.data() as CloudScene;
      // Optionally increment views here or in a cloud function
      this.cloudScenesSignal.update(scenes =>
        scenes.map(s => s.id === sceneId ? { ...s, views: (s.views || 0) + 1 } : s)
      );

      return cloudScene.scene;
    } catch (error) {
      console.error('Failed to load scene from cloud:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Fetch all cloud scenes for current user
   */
  async fetchCloudScenes(): Promise<CloudScene[]> {
    const user = this.currentUser();
    if (!user) return [];
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      const scenesCol = collection(this.firestore, `users/${user.uid}/scenes`);
      const q = query(scenesCol, where('userId', '==', user.uid));
      const sceneSnap = await getDocs(q);
      const scenes = sceneSnap.docs.map(doc => doc.data() as CloudScene);
      this.cloudScenesSignal.set(scenes);
      return scenes;
    } catch (error) {
      console.error('Failed to fetch cloud scenes:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Share scene with users
   */
  async shareScene(sceneId: string, emails: string[]): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      const sceneRef = doc(this.firestore, `users/${user.uid}/scenes`, sceneId);
      await setDoc(sceneRef, { shared: true, sharedWith: emails, updatedAt: new Date() }, { merge: true });
      this.cloudScenesSignal.update(scenes =>
        scenes.map(s => s.id === sceneId ? { ...s, shared: true, sharedWith: emails, updatedAt: new Date() } : s)
      );
    } catch (error) {
      console.error('Failed to share scene:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Start tracking stream session (Firestore)
   */
  async startStreamSession(title: string, platform: string): Promise<CloudStreamSession> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      const sessionId = `session_${Date.now()}`;
      const sessionRef = doc(this.firestore, `users/${user.uid}/streamSessions`, sessionId);
      const session: CloudStreamSession = {
        id: sessionId,
        userId: user.uid,
        title,
        startTime: new Date(),
        duration: 0,
        viewerCount: 0,
        peakViewers: 0,
        platform,
        status: 'live'
      };
      await setDoc(sessionRef, session);
      this.streamSessionsSignal.update(sessions => [...sessions, session]);
      return session;
    } catch (error) {
      console.error('Failed to start stream session:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * End stream session (Firestore)
   */
  async endStreamSession(sessionId: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      const sessionRef = doc(this.firestore, `users/${user.uid}/streamSessions`, sessionId);
      const endTime = new Date();
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const existingSession = sessionDoc.data() as CloudStreamSession;
        const duration = endTime.getTime() - existingSession.startTime.getTime();
        await setDoc(sessionRef, { endTime, duration, status: 'ended' }, { merge: true });
        this.streamSessionsSignal.update(sessions =>
          sessions.map(s => s.id === sessionId ? { ...s, endTime, duration, status: 'ended' } : s)
        );
      }
    } catch (error) {
      console.error('Failed to end stream session:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Get stream analytics (Firestore)
   */
  async fetchAnalytics(): Promise<StreamAnalytics> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      // This is still mocked as a full analytics dashboard is complex, but the data fetching is real
      const sessionsCol = collection(this.firestore, `users/${user.uid}/streamSessions`);
      const q = query(sessionsCol, where('userId', '==', user.uid), where('status', '==', 'ended'));
      const sessionsSnap = await getDocs(q);
      const sessions = sessionsSnap.docs.map(doc => doc.data() as CloudStreamSession);

      const analytics: StreamAnalytics = {
        totalStreams: sessions.length,
        totalHours: sessions.reduce((sum, s) => sum + (s.duration / 3600000), 0),
        totalViewers: sessions.reduce((sum, s) => sum + s.viewerCount, 0), // viewerCount not updated in this mock
        averageViewers: sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.viewerCount, 0) / sessions.length
          : 0,
        peakViewers: Math.max(...sessions.map(s => s.peakViewers || 0), 0),
        followerGrowth: 0, // Needs specific follower collection
        topGames: [], // Needs specific game data
        streamingDays: sessions.length > 0
          ? new Set(sessions.map(s => new Date(s.startTime).toDateString())).size
          : 0
      };

      this.analyticsSignal.set(analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(file: File, path: string): Promise<string> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.storage) throw new Error('Firebase Storage not initialized.');

    this.isSyncingSignal.set(true);
    try {
      const storageRef = ref(this.storage, `${path}/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log(`File uploaded to: ${url}`);
      return url;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Enable real-time collaboration on a scene (Firestore listener)
   */
  async enableCollaboration(sceneId: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    // In production, would set up a real-time listener (onSnapshot)
    console.log(`Enabled real-time collaboration for scene: ${sceneId}`);
  }

  /**
   * Sync local data to cloud (Firestore)
   */
  async syncToCloud(scenes: Scene[]): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');
    if (!this.firestore) throw new Error('Firestore not initialized.');

    this.isSyncingSignal.set(true);
    try {
      for (const scene of scenes) {
        await this.saveSceneToCloud(scene, false);
      }
      console.log(`Synced ${scenes.length} scenes to cloud`);
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      throw error;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }
}