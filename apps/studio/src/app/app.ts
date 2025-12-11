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
  AutomationService,
  ScriptingService,
  WorkflowBuilderComponent,
  ScriptEditorComponent,
  GameDetectionService,
  GameAPIService,
  GameOverlayService,
  GameIntegrationComponent,
  BettingService,
  BettingSystemComponent,
  SubscriptionService,
  PaymentService,
  MarketplaceService,
  LicensingService,
  StreamDeckService,
  AudioHardwareService,
  SmartLightingService,
  HardwareControlService,
  HardwareIntegrationService,
  CaptureDeviceService,
  RGBPeripheralsService,
  ProductionHardwareService,
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
    WorkflowBuilderComponent,
    ScriptEditorComponent,
    GameIntegrationComponent,
    BettingSystemComponent,
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
    'lowerthirds' | 'ndi' | 'aibackground' | 'automation' | 'scripting' | 'games' | 'betting' |
    'subscription' | 'marketplace' | 'billing'
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

  // Wave 3 feature services (Automation)
  protected automation = inject(AutomationService);
  protected scripting = inject(ScriptingService);

  // Wave 4 feature services (Game Integration)
  protected gameDetection = inject(GameDetectionService);
  protected gameAPI = inject(GameAPIService);
  protected gameOverlay = inject(GameOverlayService);

  // Wave 5 feature services (Betting System)
  protected betting = inject(BettingService);

  // Monetization services
  protected subscription = inject(SubscriptionService);
  protected payment = inject(PaymentService);
  protected marketplace = inject(MarketplaceService);
  protected licensing = inject(LicensingService);

  // Hardware integration services
  protected streamDeck = inject(StreamDeckService);
  protected audioHardware = inject(AudioHardwareService);
  protected smartLighting = inject(SmartLightingService);
  protected hardwareControl = inject(HardwareControlService);
  protected hardwareIntegration = inject(HardwareIntegrationService);
  protected captureDevice = inject(CaptureDeviceService);
  protected rgbPeripherals = inject(RGBPeripheralsService);
  protected productionHardware = inject(ProductionHardwareService);

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

  // Wave 3 feature state (Automation)
  readonly workflows = this.automation.workflows;
  readonly automationStats = this.automation.statistics;
  readonly scripts = this.scripting.scripts;
  readonly activeScripts = this.scripting.activeScripts;

  // Wave 4 feature state (Game Integration)
  readonly currentGame = this.gameDetection.currentGame;
  readonly gameHistory = this.gameDetection.gameHistory;
  readonly gameSessionStats = this.gameDetection.sessionStats;
  readonly steamConnected = this.gameAPI.steamConnected;
  readonly riotConnected = this.gameAPI.riotConnected;
  readonly gameOverlays = this.gameOverlay.overlays;

  // Wave 5 feature state (Betting System)
  readonly activeBets = this.betting.activeBets;
  readonly bettingLeaderboard = this.betting.leaderboard;
  readonly bettingStats = this.betting.statistics;

  // Monetization state
  readonly currentSubscription = this.subscription.currentSubscription;
  readonly currentPlan = this.subscription.currentPlan;
  readonly usageMetrics = this.subscription.usageMetrics;
  readonly isTrialing = this.subscription.isTrialing;
  readonly paymentMethods = this.payment.paymentMethods;
  readonly transactions = this.payment.transactions;
  readonly marketplaceItems = this.marketplace.filteredItems;
  readonly featuredItems = this.marketplace.featuredItems;
  readonly purchasedItems = this.marketplace.purchasedItems;
  readonly availableFeatures = this.licensing.availableFeatures;
  readonly lockedFeatures = this.licensing.lockedFeatures;

  // Hardware integration state
  readonly streamDeckDevices = this.streamDeck.connectedDevices;
  readonly audioDevices = this.audioHardware.connectedDevices;
  readonly smartLights = this.smartLighting.connectedLights;
  readonly ptzCameras = this.hardwareControl.connectedPTZ;
  readonly dslrCameras = this.hardwareControl.connectedDSLR;
  readonly midiControllers = this.hardwareControl.connectedMIDI;
  readonly hardwareStatus = this.hardwareIntegration.allHardwareStatus;
  readonly hardwareInitialized = this.hardwareIntegration.initialized;
  readonly totalHardware = this.hardwareIntegration.totalDevices;
  readonly captureCards = this.captureDevice.connectedCaptureCards;
  readonly webcams = this.captureDevice.connectedWebcams;
  readonly rgbDevices = this.rgbPeripherals.connectedDevices;
  readonly totalLEDs = this.rgbPeripherals.totalLEDs;
  readonly videoSwitchers = this.productionHardware.videoSwitchers;
  readonly motorizedSliders = this.productionHardware.motorizedSliders;
}
