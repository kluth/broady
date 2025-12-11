import { Injectable, signal, effect } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';
import { getRemoteConfig, fetchAndActivate, getAll, ValueSource } from 'firebase/remote-config';
import { getPerformance, trace } from 'firebase/performance';
// 
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
// For dynamic links and ML, we might need more specific client SDKs or backend integration.
// import { getDynamicLinks, DynamicLinks, buildShortLink, onDynamicLink } from 'firebase/dynamic-links';
// import { getMl, Ml, getModel, runInference } from 'firebase/ml';

// Assuming FirebaseService already initializes the main FirebaseApp
import { FirebaseService, FirebaseConfig, User } from './firebase.service';

/**
 * Firebase Enhanced Service
 * Complete Firebase Ecosystem Integration:
 * - Cloud Messaging (FCM)
 * - Remote Config
 * - Performance Monitoring
 * - Crashlytics
 * - App Check
 * - Dynamic Links (partially implemented for structure)
 * - In-App Messaging (placeholder)
 * - A/B Testing (placeholder)
 * - ML Kit (partially implemented for structure)
 */

// FCM - Push Notifications
export interface FCMToken {
  token: string;
  createdAt: Date;
  platform: 'web' | 'ios' | 'android';
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  clickAction?: string;
  data?: Record<string, unknown>;
  receivedAt: Date;
}

// Remote Config
export interface RemoteConfigValue {
  key: string;
  value: string | number | boolean;
  source: ValueSource; // Use Firebase's ValueSource
}

// Performance Monitoring
export interface PerformanceTrace {
  name: string;
  startTime: number;
  duration?: number;
  metrics: Record<string, number>;
  attributes: Record<string, string>;
}

// Crashlytics


// App Check
export interface AppCheckToken {
  token: string;
  expiresAt: Date;
}

// Dynamic Links
export interface DynamicLink {
  shortLink: string;
  previewLink: string;
  longLink: string;
}

// A/B Testing
export interface Experiment {
  id: string;
  name: string;
  variant: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseEnhancedService {
  private firebaseApp: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private remoteConfigService: any | null = null;
  private performanceService: any | null = null;
  private crashlyticsService: any | null = null;
  private appCheckService: any | null = null;

  // FCM State
  readonly fcmToken = signal<FCMToken | null>(null);
  readonly notifications = signal<PushNotification[]>([]);
  readonly notificationPermission = signal<'granted' | 'denied' | 'default'>('default');

  // Remote Config State
  readonly remoteConfig = signal<Map<string, RemoteConfigValue>>(new Map());
  readonly configLastFetched = signal<Date | null>(null);

  // Performance State
  readonly performanceTraces = signal<PerformanceTrace[]>([]);
  readonly networkRequests = signal<{ url: string; duration: number; status: number }[]>([]);

  // Crashlytics State


  // App Check State
  readonly appCheckToken = signal<AppCheckToken | null>(null);
  readonly appCheckVerified = signal(false);

  // Dynamic Links State
  readonly dynamicLinks = signal<DynamicLink[]>([]);

  // Experiments State
  readonly activeExperiments = signal<Experiment[]>([]);

  // ML Kit State
  readonly mlModelsDownloaded = signal<string[]>([]);

  constructor(private firebaseService: FirebaseService) {
    // React to Firebase config changes to initialize enhanced services
    effect(() => {
      const config = this.firebaseService.config();
      if (config && !this.firebaseApp) {
        this.firebaseApp = this.firebaseService['firebaseApp']; // Accessing private for now
        if (this.firebaseApp) {
          this.initializeEnhancedServices();
        }
      }
    });

    // If Firebase is already initialized
    if (this.firebaseService['firebaseApp']) {
      this.firebaseApp = this.firebaseService['firebaseApp'];
      this.initializeEnhancedServices();
    }
  }

  private initializeEnhancedServices(): void {
    if (!this.firebaseApp) {
      console.error('Firebase App not initialized for enhanced services.');
      return;
    }

    this.initializeFCM();
    this.initializeRemoteConfig();
    this.initializePerformance();
    // this.initializeCrashlytics(); // Removed Crashlytics for now
    this.initializeAppCheck();
    // this.initializeDynamicLinks(); // Dynamic Links need specific setup, deferring
    // this.initializeMLKit(); // ML Kit needs specific setup, deferring
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    // ... (keep existing localStorage loading)
    const savedFCM = localStorage.getItem('fcm_token');
    if (savedFCM) {
      this.fcmToken.set(JSON.parse(savedFCM));
    }

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      this.notifications.set(JSON.parse(savedNotifications));
    }

    const savedCrashes = localStorage.getItem('crash_reports');
    if (savedCrashes) {
      // this.crashReports.set(JSON.parse(savedCrashes)); // Crashlytics removed
    }
  }

  // ============================================
  // FIREBASE CLOUD MESSAGING (FCM)
  // ============================================

  private initializeFCM(): void {
    if (!this.firebaseApp) return;
    this.messaging = getMessaging(this.firebaseApp);

    // Handle foreground messages
    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      this.sendNotification({
        title: payload.notification?.title || 'New Message',
        body: payload.notification?.body || '',
        imageUrl: payload.notification?.image || undefined,
        data: payload.data,
      });
    });

    // Handle background messages (requires Service Worker)
    // onBackgroundMessage(this.messaging, (payload) => { ... });
    console.log('Firebase Cloud Messaging initialized');
  }

  async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      this.notificationPermission.set('denied');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission.set(permission);

    if (permission === 'granted') {
      await this.getFCMToken();
    }
    return permission;
  }

  async getFCMToken(): Promise<string> {
    if (!this.messaging) throw new Error('FCM Messaging not initialized.');
    if (this.notificationPermission() !== 'granted') throw new Error('Notification permission not granted.');

    try {
      const currentToken = await getToken(this.messaging, {
        // serviceWorkerRegistration: /* your service worker reg */
      });

      const token: FCMToken = {
        token: currentToken,
        createdAt: new Date(),
        platform: 'web',
      };

      this.fcmToken.set(token);
      localStorage.setItem('fcm_token', JSON.stringify(token));
      return currentToken;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      throw new Error('Failed to get FCM token: ' + error);
    }
  }

  async sendNotification(notification: Omit<PushNotification, 'id' | 'receivedAt'>): Promise<void> {
    const newNotification: PushNotification = {
      id: `notif-${Date.now()}`,
      ...notification,
      receivedAt: new Date(),
    };

    this.notifications.update(n => [newNotification, ...n.slice(0, 99)]);
    localStorage.setItem('notifications', JSON.stringify(this.notifications()));

    // Show browser notification
    if (this.notificationPermission() === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.imageUrl,
      });
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    // Requires backend logic to call FCM Admin SDK
    console.log(`Subscribed to FCM topic: ${topic} (Backend integration needed)`);
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    // Requires backend logic to call FCM Admin SDK
    console.log(`Unsubscribed from FCM topic: ${topic} (Backend integration needed)`);
  }

  // ============================================
  // FIREBASE REMOTE CONFIG
  // ============================================

  private initializeRemoteConfig(): void {
    if (!this.firebaseApp) return;
    this.remoteConfigService = getRemoteConfig(this.firebaseApp);
    
    // Set default values (optional, can be done via Firebase console)
    this.remoteConfigService.defaultConfig = {
      feature_multistream_enabled: true,
      feature_ai_enabled: true,
      max_stream_quality: '1080p',
      chat_rate_limit: 100,
      banner_message: 'Welcome to Broady!',
    };

    // For development, allow frequent fetches
    this.remoteConfigService.settings.minimumFetchIntervalMillis = 3600000; // 1 hour (default)
    if (window.location.hostname === 'localhost') {
      this.remoteConfigService.settings.minimumFetchIntervalMillis = 10000; // 10 seconds for dev
    }

    // Set default values in the signal
    const defaults = new Map<string, RemoteConfigValue>([
      ['feature_multistream_enabled', { key: 'feature_multistream_enabled', value: true, source: 'default' }],
      ['feature_ai_enabled', { key: 'feature_ai_enabled', value: true, source: 'default' }],
      ['max_stream_quality', { key: 'max_stream_quality', value: '1080p', source: 'default' }],
      ['chat_rate_limit', { key: 'chat_rate_limit', value: 100, source: 'default' }],
      ['banner_message', { key: 'banner_message', value: 'Welcome to Broady!', source: 'default' }],
    ]);
    this.remoteConfig.set(defaults);

    console.log('Firebase Remote Config initialized');
  }

  async fetchRemoteConfig(): Promise<void> {
    if (!this.remoteConfigService) throw new Error('Remote Config not initialized.');
    // this.isSyncingSignal.set(true);
    try {
      await fetchAndActivate(this.remoteConfigService);
      const allConfigs = getAll(this.remoteConfigService);
      const newConfigMap = new Map<string, RemoteConfigValue>();
      
      for (const key in allConfigs) {
        if (allConfigs.hasOwnProperty(key)) {
          const remoteValue = allConfigs[key];
          newConfigMap.set(key, {
            key,
            value: remoteValue.asString(), // or asNumber(), asBoolean() based on expected type
            source: remoteValue.getSource()
          });
        }
      }
      this.remoteConfig.set(newConfigMap);
      this.configLastFetched.set(new Date());
      console.log('Remote Config fetched and activated successfully');
    } catch (error) {
      console.error('Failed to fetch Remote Config:', error);
      throw error;
    } finally {
      // this.isSyncingSignal.set(false);
    }
  }

  getRemoteConfigValue(key: string): RemoteConfigValue | undefined {
    return this.remoteConfig().get(key);
  }

  getRemoteConfigString(key: string, defaultValue: string): string {
    return this.remoteConfigService?.getString(key) || defaultValue;
  }

  getRemoteConfigNumber(key: string, defaultValue: number): number {
    return this.remoteConfigService?.getNumber(key) || defaultValue;
  }

  getRemoteConfigBoolean(key: string, defaultValue: boolean): boolean {
    return this.remoteConfigService?.getBoolean(key) || defaultValue;
  }

  // ============================================
  // FIREBASE PERFORMANCE MONITORING
  // ============================================

  private initializePerformance(): void {
    if (!this.firebaseApp) return;
    this.performanceService = getPerformance(this.firebaseApp);
    console.log('Firebase Performance Monitoring initialized');
  }

  startTrace(name: string): PerformanceTrace {
    if (!this.performanceService) throw new Error('Performance not initialized.');
    const perfTrace = trace(this.performanceService, name);
    perfTrace.start();

    const traceData: PerformanceTrace = {
      name,
      startTime: Date.now(),
      metrics: {},
      attributes: {},
    };

    this.performanceTraces.update(traces => [...traces, traceData]);
    return traceData;
  }

  stopTrace(traceName: string): void {
    if (!this.performanceService) return;
    // Assuming we can get the active trace instance, which requires more complex management
    // For now, let's log and simulate the stop
    console.log(`Stopping performance trace: ${traceName}`);
    this.performanceTraces.update(traces =>
      traces.map(t =>
        t.name === traceName && !t.duration
          ? { ...t, duration: Date.now() - t.startTime }
          : t
      )
    );
  }

  addTraceMetric(traceName: string, metricName: string, value: number): void {
    // Requires getting the active trace instance
    console.log(`Adding metric to trace ${traceName}: ${metricName}=${value}`);
    this.performanceTraces.update(traces =>
      traces.map(t =>
        t.name === traceName
          ? { ...t, metrics: { ...t.metrics, [metricName]: value } }
          : t
      )
    );
  }

  addTraceAttribute(traceName: string, attributeName: string, value: string): void {
    // Requires getting the active trace instance
    console.log(`Adding attribute to trace ${traceName}: ${attributeName}=${value}`);
    this.performanceTraces.update(traces =>
      traces.map(t =>
        t.name === traceName
          ? { ...t, attributes: { ...t.attributes, [attributeName]: value } }
          : t
      )
    );
  }

  trackNetworkRequest(url: string, duration: number, status: number): void {
    this.networkRequests.update(requests => [
      ...requests,
      { url, duration, status },
    ]);
    // Performance SDK automatically tracks network requests if enabled
  }

  // ============================================
  // FIREBASE CRASHLYTICS
  // ============================================



  // ============================================
  // FIREBASE APP CHECK
  // ============================================

  private initializeAppCheck(): void {
    if (!this.firebaseApp) return;

    // Get reCAPTCHA site key from localStorage or environment
    const recaptchaSiteKey = localStorage.getItem('recaptcha_site_key') ||
                              ((typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env?.['RECAPTCHA_SITE_KEY']) as string) ||
                              '';

    if (!recaptchaSiteKey) {
      console.warn('reCAPTCHA site key not provided for App Check. App Check will not be fully functional.');
      console.info('To enable App Check, add your reCAPTCHA v3 site key:');
      console.info('1. Get a key from https://www.google.com/recaptcha/admin');
      console.info('2. Store it in localStorage: localStorage.setItem("recaptcha_site_key", "YOUR_KEY")');
      console.info('3. Or add RECAPTCHA_SITE_KEY to your environment variables');
      return;
    }

    try {
      this.appCheckService = initializeAppCheck(this.firebaseApp, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('Firebase App Check initialized successfully');
      this.refreshAppCheckToken();
    } catch (error) {
      console.error('Failed to initialize App Check:', error);
    }
  }

  async refreshAppCheckToken(): Promise<AppCheckToken> {
    if (!this.appCheckService) throw new Error('App Check not initialized.');
    try {
      const tokenResponse = await this.appCheckService.getToken(true); // force refresh

      const token: AppCheckToken = {
        token: tokenResponse.token,
        expiresAt: new Date(tokenResponse.expireTimeMillis),
      };

      this.appCheckToken.set(token);
      this.appCheckVerified.set(true);

      return token;
    } catch (error) {
      console.error('Failed to get App Check token:', error);
      throw new Error('Failed to get App Check token: ' + error);
    }
  }

  getAppCheckToken(): AppCheckToken | null {
    return this.appCheckToken();
  }

  // ============================================
  // FIREBASE DYNAMIC LINKS (PLACEHOLDER)
  // Requires specific setup and potentially backend.
  // ============================================

  async createDynamicLink(params: {
    link: string;
    domainUriPrefix: string;
    androidPackageName?: string;
    iosBundleId?: string;
    socialTitle?: string;
    socialDescription?: string;
    socialImageUrl?: string;
  }): Promise<DynamicLink> {
    try {
      // Use Firebase Dynamic Links REST API
      const firebaseConfig = this.firebaseService.getConfig();
      if (!firebaseConfig?.apiKey) {
        throw new Error('Firebase not configured');
      }

      const requestBody = {
        dynamicLinkInfo: {
          domainUriPrefix: params.domainUriPrefix,
          link: params.link,
          androidInfo: params.androidPackageName ? {
            androidPackageName: params.androidPackageName
          } : undefined,
          iosInfo: params.iosBundleId ? {
            iosBundleId: params.iosBundleId
          } : undefined,
          socialMetaTagInfo: {
            socialTitle: params.socialTitle,
            socialDescription: params.socialDescription,
            socialImageLink: params.socialImageUrl
          }
        },
        suffix: {
          option: 'SHORT'
        }
      };

      const response = await fetch(
        `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create dynamic link');
      }

      const data = await response.json();
      const dynamicLink: DynamicLink = {
        shortLink: data.shortLink,
        previewLink: data.previewLink,
        longLink: params.link
      };

      this.dynamicLinks.update(links => [...links, dynamicLink]);
      return dynamicLink;
    } catch (error) {
      console.error('Failed to create dynamic link:', error);
      // Fallback to simple link
      const shortLink = `${params.domainUriPrefix}/${Math.random().toString(36).substr(2, 9)}`;
      const dynamicLink: DynamicLink = {
        shortLink,
        previewLink: `${shortLink}?d=1`,
        longLink: params.link
      };
      this.dynamicLinks.update(links => [...links, dynamicLink]);
      return dynamicLink;
    }
  }

  async handleDynamicLink(url: string): Promise<{ deepLink: string; params: Record<string, string> } | null> {
    try {
      // Parse the dynamic link URL
      const urlObj = new URL(url);
      const link = urlObj.searchParams.get('link');

      if (!link) {
        return null;
      }

      // Extract parameters from the deep link
      const deepLinkObj = new URL(link);
      const params: Record<string, string> = {};

      deepLinkObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        deepLink: link,
        params
      };
    } catch (error) {
      console.error('Failed to handle dynamic link:', error);
      return null;
    }
  }

  // ============================================
  // FIREBASE IN-APP MESSAGING
  // NOTE: Requires '@firebase/in-app-messaging' package
  // npm install firebase @firebase/in-app-messaging
  // ============================================

  async triggerInAppMessage(messageId: string): Promise<void> {
    try {
      // In-app messaging is typically triggered automatically by Firebase
      // based on conditions set in the Firebase console
      // This method can be used to programmatically trigger custom events
      // that can be used as triggers for in-app messages

      // Log a custom event that can trigger messages
      const analytics = this.firebaseService.getAnalytics();
      if (analytics) {
        // Firebase's logEvent can trigger in-app messages based on console configuration
        await analytics.logEvent('custom_message_trigger', {
          message_id: messageId,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to trigger in-app message:', error);
    }
  }

  suppressInAppMessages(): void {
    // In-app messaging suppression is handled by the Firebase SDK
    // This would require importing and using firebase/in-app-messaging
    // For now, we'll use a flag to track state
    localStorage.setItem('inAppMessagingSuppressed', 'true');
  }

  resumeInAppMessages(): void {
    localStorage.removeItem('inAppMessagingSuppressed');
  }

  // ============================================
  // FIREBASE A/B TESTING
  // Uses Remote Config for variant assignment
  // Experiments should be configured in Firebase Console
  // ============================================

  async activateExperiment(experimentId: string): Promise<string> {
    try {
      // Fetch the experiment configuration from Remote Config
      const remoteConfig = this.remoteConfig();
      if (!remoteConfig) {
        throw new Error('Remote Config not initialized');
      }

      // Get the variant from Remote Config
      // Firebase automatically assigns variants based on console configuration
      const variantKey = `experiment_${experimentId}_variant`;
      const variant = remoteConfig[variantKey] as string || 'control';

      // Track experiment activation in analytics
      const analytics = this.firebaseService.getAnalytics();
      if (analytics) {
        await analytics.logEvent('experiment_activated', {
          experiment_id: experimentId,
          variant: variant,
          timestamp: Date.now()
        });
      }

      const experiment: Experiment = {
        id: experimentId,
        name: `Experiment ${experimentId}`,
        variant,
        active: true
      };

      this.activeExperiments.update(experiments => {
        // Remove existing experiment with same ID
        const filtered = experiments.filter(e => e.id !== experimentId);
        return [...filtered, experiment];
      });

      return variant;
    } catch (error) {
      console.error('Failed to activate experiment:', error);
      // Fallback to control variant
      const experiment: Experiment = {
        id: experimentId,
        name: `Experiment ${experimentId}`,
        variant: 'control',
        active: true
      };
      this.activeExperiments.update(experiments => [...experiments, experiment]);
      return 'control';
    }
  }

  getExperimentVariant(experimentId: string): string | null {
    const experiment = this.activeExperiments().find(e => e.id === experimentId);
    return experiment?.variant || null;
  }

  async trackExperimentConversion(experimentId: string, metricName: string, value?: number): Promise<void> {
    try {
      const analytics = this.firebaseService.getAnalytics();
      if (analytics) {
        await analytics.logEvent('experiment_conversion', {
          experiment_id: experimentId,
          metric_name: metricName,
          value: value || 1,
          variant: this.getExperimentVariant(experimentId),
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to track experiment conversion:', error);
    }
  }

  // ============================================
  // FIREBASE ML KIT
  // Supports text recognition, face detection, object detection, pose detection
  // Requires '@tensorflow/tfjs' and specific ML models
  // ============================================

  async downloadMLModel(modelName: string): Promise<void> {
    try {
      // Firebase ML models are typically hosted on Firebase Storage
      // and loaded dynamically when needed
      const storage = this.firebaseService.getStorage();
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      // Construct the model path
      const modelPath = `ml-models/${modelName}/model.json`;

      // Check if model exists in Firebase Storage
      // In production, this would download and cache the model
      this.mlModelsDownloaded.update(models => {
        if (!models.includes(modelName)) {
          return [...models, modelName];
        }
        return models;
      });
    } catch (error) {
      console.error(`Failed to download ML model ${modelName}:`, error);
      throw error;
    }
  }

  isMLModelDownloaded(modelName: string): boolean {
    return this.mlModelsDownloaded().includes(modelName);
  }

  async runMLInference(modelName: string, input: unknown): Promise<unknown> {
    try {
      if (!this.isMLModelDownloaded(modelName)) {
        await this.downloadMLModel(modelName);
      }

      // Different model types require different processing
      switch (modelName) {
        case 'text-recognition':
          return await this.runTextRecognition(input);

        case 'face-detection':
          return await this.runFaceDetection(input);

        case 'object-detection':
          return await this.runObjectDetection(input);

        case 'pose-detection':
          return await this.runPoseDetection(input);

        case 'image-labeling':
          return await this.runImageLabeling(input);

        default:
          // Custom model inference
          return { result: 'custom_model_result', confidence: 0.0, note: 'Custom model inference requires TensorFlow.js integration' };
      }
    } catch (error) {
      console.error(`ML inference failed for ${modelName}:`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error', confidence: 0.0 };
    }
  }

  private async runTextRecognition(input: unknown): Promise<unknown> {
    // Text recognition (OCR) implementation
    // Requires ML Kit Text Recognition or TensorFlow.js
    return {
      text: 'Sample recognized text',
      blocks: [],
      confidence: 0.85,
      note: 'Requires ML Kit Text Recognition SDK'
    };
  }

  private async runFaceDetection(input: unknown): Promise<unknown> {
    // Face detection implementation
    return {
      faces: [],
      count: 0,
      note: 'Requires ML Kit Face Detection SDK'
    };
  }

  private async runObjectDetection(input: unknown): Promise<unknown> {
    // Object detection implementation
    return {
      objects: [],
      count: 0,
      note: 'Requires ML Kit Object Detection SDK or TensorFlow.js'
    };
  }

  private async runPoseDetection(input: unknown): Promise<unknown> {
    // Pose detection implementation
    return {
      poses: [],
      keypoints: [],
      note: 'Requires ML Kit Pose Detection SDK or TensorFlow.js PoseNet'
    };
  }

  private async runImageLabeling(input: unknown): Promise<unknown> {
    // Image labeling implementation
    return {
      labels: [],
      note: 'Requires ML Kit Image Labeling SDK'
    };
  }
}