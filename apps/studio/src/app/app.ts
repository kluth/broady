import { Component, signal, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  SceneListComponent,
  StreamingControlsComponent,
  VideoPreviewComponent,
  AudioMixerComponent,
  SourcesManagerComponent,
  ChatIntegration,
  AlertsSystem,
  OverlaysManager,
  Multistream,
  StatsDashboardComponent,
  SettingsDialogComponent,
  CloudSync,
  FirebaseService,
  AIService,
  MusicLibraryService,
} from '@org/streaming-core';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    SceneListComponent,
    StreamingControlsComponent,
    VideoPreviewComponent,
    AudioMixerComponent,
    SourcesManagerComponent,
    ChatIntegration,
    AlertsSystem,
    OverlaysManager,
    Multistream,
    StatsDashboardComponent,
    SettingsDialogComponent,
    CloudSync,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'OBS Studio Pro - Built with Angular 20 + AI + Firebase';
  protected activeTab = signal<'sources' | 'overlays' | 'multistream' | 'alerts' | 'chat' | 'stats' | 'cloud' | 'ai' | 'music'>('sources');

  // Inject services
  protected firebase = inject(FirebaseService);
  protected ai = inject(AIService);
  protected music = inject(MusicLibraryService);

  // Service state
  readonly isCloudConnected = this.firebase.isAuthenticated;
  readonly currentUser = this.firebase.currentUser;
  readonly isAIConfigured = this.ai.config;
  readonly currentTrack = this.music.currentTrack;
  readonly isPlaying = this.music.isPlaying;
}
