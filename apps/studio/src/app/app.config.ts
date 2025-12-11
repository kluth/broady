import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { FirebaseService, FirebaseConfig } from '@org/streaming-core';

function initializeFirebaseFactory(firebaseService: FirebaseService) {
  return () => {
    // Try to load config from localStorage or env if available
    // For now, we won't crash if it's missing, allowing lazy init
    const storedConfig = localStorage.getItem('firebase_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig) as FirebaseConfig;
        firebaseService.initialize(config);
      } catch (e) {
        console.error('Failed to load stored Firebase config', e);
      }
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFirebaseFactory,
      deps: [FirebaseService],
      multi: true
    }
  ],
};
