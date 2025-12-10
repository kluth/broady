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
  StreamHealthMonitorService,
  VoiceCommandsService,
  ChatModerationService,
  DonationsService,
  SocialMediaService,
  ThemeService,
  StreamSchedulerService,
  AutoSceneSwitcherService,
  ViewerEngagementService,
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
  protected title = 'Broady - Professional Streaming Platform';
  protected activeTab = signal<'sources' | 'overlays' | 'multistream' | 'alerts' | 'chat' | 'stats' | 'cloud' | 'ai' | 'music' | 'health' | 'engagement' | 'moderation'>('sources');

  // Inject core services
  protected firebase = inject(FirebaseService);
  protected ai = inject(AIService);
  protected music = inject(MusicLibraryService);

  // Inject new feature services
  protected healthMonitor = inject(StreamHealthMonitorService);
  protected voiceCommands = inject(VoiceCommandsService);
  protected chatModeration = inject(ChatModerationService);
  protected donations = inject(DonationsService);
  protected socialMedia = inject(SocialMediaService);
  protected theme = inject(ThemeService);
  protected scheduler = inject(StreamSchedulerService);
  protected autoSwitcher = inject(AutoSceneSwitcherService);
  protected engagement = inject(ViewerEngagementService);

  // Core service state
  readonly isCloudConnected = this.firebase.isAuthenticated;
  readonly currentUser = this.firebase.currentUser;
  readonly isAIConfigured = this.ai.config;
  readonly currentTrack = this.music.currentTrack;
  readonly isPlaying = this.music.isPlaying;

  // New feature state
  readonly streamHealth = this.healthMonitor.currentHealth;
  readonly healthScore = this.healthMonitor.healthScore;
  readonly isVoiceListening = this.voiceCommands.isListening;
  readonly pendingDonations = this.donations.pendingAlerts;
  readonly activePoll = this.engagement.activePoll;
  readonly activePrediction = this.engagement.activePrediction;
  readonly currentTheme = this.theme.currentTheme;
  readonly upcomingStream = this.scheduler.upcomingStream;
}
