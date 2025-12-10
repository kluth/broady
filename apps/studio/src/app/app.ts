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
  AnalyticsDashboardService,
  ClipCreatorService,
  TTSService,
  SoundAlertsService,
  StreamTemplatesService,
  ChromaKeyService,
  LowerThirdsService,
  NDIService,
  BackgroundRemovalService,
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
  protected activeTab = signal<
    'sources' | 'overlays' | 'multistream' | 'alerts' | 'chat' | 'stats' |
    'cloud' | 'ai' | 'music' | 'health' | 'engagement' | 'moderation' |
    'analytics' | 'clips' | 'tts' | 'sounds' | 'templates' | 'chroma' |
    'lowerthirds' | 'ndi' | 'aibackground'
  >('sources');

  // Inject core services
  protected firebase = inject(FirebaseService);
  protected ai = inject(AIService);
  protected music = inject(MusicLibraryService);

  // Inject Wave 1 feature services
  protected healthMonitor = inject(StreamHealthMonitorService);
  protected voiceCommands = inject(VoiceCommandsService);
  protected chatModeration = inject(ChatModerationService);
  protected donations = inject(DonationsService);
  protected socialMedia = inject(SocialMediaService);
  protected theme = inject(ThemeService);
  protected scheduler = inject(StreamSchedulerService);
  protected autoSwitcher = inject(AutoSceneSwitcherService);
  protected engagement = inject(ViewerEngagementService);

  // Inject Wave 2 feature services
  protected analytics = inject(AnalyticsDashboardService);
  protected clipCreator = inject(ClipCreatorService);
  protected tts = inject(TTSService);
  protected soundAlerts = inject(SoundAlertsService);
  protected templates = inject(StreamTemplatesService);
  protected chromaKey = inject(ChromaKeyService);
  protected lowerThirds = inject(LowerThirdsService);
  protected ndi = inject(NDIService);
  protected backgroundRemoval = inject(BackgroundRemovalService);

  // Core service state
  readonly isCloudConnected = this.firebase.isAuthenticated;
  readonly currentUser = this.firebase.currentUser;
  readonly isAIConfigured = this.ai.config;
  readonly currentTrack = this.music.currentTrack;
  readonly isPlaying = this.music.isPlaying;

  // Wave 1 feature state
  readonly streamHealth = this.healthMonitor.currentHealth;
  readonly healthScore = this.healthMonitor.healthScore;
  readonly isVoiceListening = this.voiceCommands.isListening;
  readonly pendingDonations = this.donations.pendingAlerts;
  readonly activePoll = this.engagement.activePoll;
  readonly activePrediction = this.engagement.activePrediction;
  readonly currentTheme = this.theme.currentTheme;
  readonly upcomingStream = this.scheduler.upcomingStream;

  // Wave 2 feature state
  readonly currentSession = this.analytics.currentSession;
  readonly analyticsMetrics = this.analytics.metrics;
  readonly clips = this.clipCreator.clips;
  readonly isTTSSpeaking = this.tts.isSpeaking;
  readonly ttsQueue = this.tts.queue;
  readonly pendingAlerts = this.soundAlerts.alerts;
  readonly availableTemplates = this.templates.templates;
  readonly chromaKeyEnabled = this.chromaKey.settings;
  readonly activeLowerThird = this.lowerThirds.activeLowerThird;
  readonly ndiSources = this.ndi.sources;
  readonly bgRemovalEnabled = this.backgroundRemoval.isEnabled;
  readonly personDetected = this.backgroundRemoval.personDetection;
  readonly bgRemovalFps = this.backgroundRemoval.performanceMetrics;
}
