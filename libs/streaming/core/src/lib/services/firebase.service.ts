import { Injectable, signal, computed } from '@angular/core';
import { Scene } from '../models/scene.model';
import { Source } from '../models/source.model';

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

export interface StreamSession {
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
  private streamSessionsSignal = signal<StreamSession[]>([]);
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
    // Try to restore session
    this.restoreSession();
  }

  /**
   * Initialize Firebase
   */
  initialize(config: FirebaseConfig): void {
    this.configSignal.set(config);
    console.log('Firebase initialized with config:', config.projectId);
    // In production, would initialize Firebase SDK here
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      // Simulate Firebase auth
      await this.delay(1000);

      const user: User = {
        uid: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);

      // Save session
      localStorage.setItem('firebase_user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Simulate Google OAuth
      await this.delay(1500);

      const user: User = {
        uid: `google_${Date.now()}`,
        email: 'user@gmail.com',
        displayName: 'Stream User',
        photoURL: 'https://via.placeholder.com/150',
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
      localStorage.setItem('firebase_user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    localStorage.removeItem('firebase_user');
  }

  /**
   * Save scene to cloud
   */
  async saveSceneToCloud(scene: Scene, shared: boolean = false): Promise<CloudScene> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    this.isSyncingSignal.set(true);

    try {
      await this.delay(1000);

      const cloudScene: CloudScene = {
        id: `cloud_${Date.now()}`,
        userId: user.uid,
        name: scene.name,
        scene: scene,
        shared: shared,
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0
      };

      this.cloudScenesSignal.update(scenes => [...scenes, cloudScene]);

      return cloudScene;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Load scene from cloud
   */
  async loadSceneFromCloud(sceneId: string): Promise<Scene> {
    this.isSyncingSignal.set(true);

    try {
      await this.delay(800);

      const cloudScene = this.cloudScenes().find(s => s.id === sceneId);
      if (!cloudScene) throw new Error('Scene not found');

      // Increment view count
      this.cloudScenesSignal.update(scenes =>
        scenes.map(s => s.id === sceneId ? { ...s, views: s.views + 1 } : s)
      );

      return cloudScene.scene;
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

    this.cloudScenesSignal.update(scenes =>
      scenes.map(scene => {
        if (scene.id === sceneId && scene.userId === user.uid) {
          return {
            ...scene,
            shared: true,
            sharedWith: [...scene.sharedWith, ...emails],
            updatedAt: new Date()
          };
        }
        return scene;
      })
    );
  }

  /**
   * Start tracking stream session
   */
  async startStreamSession(title: string, platform: string): Promise<StreamSession> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    const session: StreamSession = {
      id: `session_${Date.now()}`,
      userId: user.uid,
      title,
      startTime: new Date(),
      duration: 0,
      viewerCount: 0,
      peakViewers: 0,
      platform,
      status: 'live'
    };

    this.streamSessionsSignal.update(sessions => [...sessions, session]);

    return session;
  }

  /**
   * End stream session
   */
  async endStreamSession(sessionId: string): Promise<void> {
    this.streamSessionsSignal.update(sessions =>
      sessions.map(session => {
        if (session.id === sessionId) {
          const endTime = new Date();
          const duration = endTime.getTime() - session.startTime.getTime();
          return {
            ...session,
            endTime,
            duration,
            status: 'ended' as const
          };
        }
        return session;
      })
    );
  }

  /**
   * Get stream analytics
   */
  async fetchAnalytics(): Promise<StreamAnalytics> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    this.isSyncingSignal.set(true);

    try {
      await this.delay(1500);

      const sessions = this.streamSessions().filter(s => s.userId === user.uid);

      const analytics: StreamAnalytics = {
        totalStreams: sessions.length,
        totalHours: sessions.reduce((sum, s) => sum + (s.duration / 3600000), 0),
        totalViewers: sessions.reduce((sum, s) => sum + s.viewerCount, 0),
        averageViewers: sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.viewerCount, 0) / sessions.length
          : 0,
        peakViewers: Math.max(...sessions.map(s => s.peakViewers), 0),
        followerGrowth: 125, // Mock data
        topGames: [
          { game: 'Just Chatting', hours: 45.5 },
          { game: 'Valorant', hours: 32.3 },
          { game: 'League of Legends', hours: 28.7 }
        ],
        streamingDays: sessions.length > 0
          ? new Set(sessions.map(s => s.startTime.toDateString())).size
          : 0
      };

      this.analyticsSignal.set(analytics);

      return analytics;
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

    this.isSyncingSignal.set(true);

    try {
      await this.delay(2000);

      // Simulate upload
      const url = `https://storage.googleapis.com/${path}/${file.name}`;
      console.log(`File uploaded to: ${url}`);

      return url;
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Enable real-time collaboration on a scene
   */
  async enableCollaboration(sceneId: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    // In production, would set up Firestore real-time listeners
    console.log(`Enabled real-time collaboration for scene: ${sceneId}`);
  }

  /**
   * Sync local data to cloud
   */
  async syncToCloud(scenes: Scene[]): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    this.isSyncingSignal.set(true);

    try {
      await this.delay(1500);

      for (const scene of scenes) {
        await this.saveSceneToCloud(scene, false);
      }

      console.log(`Synced ${scenes.length} scenes to cloud`);
    } finally {
      this.isSyncingSignal.set(false);
    }
  }

  /**
   * Restore user session from localStorage
   */
  private restoreSession(): void {
    const savedUser = localStorage.getItem('firebase_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
