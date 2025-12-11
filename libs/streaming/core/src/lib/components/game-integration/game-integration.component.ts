import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameDetectionService, GameInfo, GameRule } from '../../services/game-detection.service';
import { GameAPIService } from '../../services/game-api.service';
import { GameOverlayService, GameOverlay } from '../../services/game-overlay.service';

/**
 * Game Integration Component
 * Complete game integration dashboard
 */

@Component({
  selector: 'lib-game-integration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-integration">
      <!-- Tabs -->
      <div class="tabs">
        <button
          (click)="activeTab.set('detection')"
          [class.active]="activeTab() === 'detection'"
          class="tab">
          🎮 Detection
        </button>
        <button
          (click)="activeTab.set('apis')"
          [class.active]="activeTab() === 'apis'"
          class="tab">
          🔌 API Connections
        </button>
        <button
          (click)="activeTab.set('overlays')"
          [class.active]="activeTab() === 'overlays'"
          class="tab">
          📊 Overlays
        </button>
        <button
          (click)="activeTab.set('rules')"
          [class.active]="activeTab() === 'rules'"
          class="tab">
          ⚙️ Game Rules
        </button>
        <button
          (click)="activeTab.set('stats')"
          [class.active]="activeTab() === 'stats'"
          class="tab">
          📈 Statistics
        </button>
      </div>

      <div class="tab-content">
        <!-- Detection Tab -->
        @if (activeTab() === 'detection') {
          <div class="detection-tab">
            <div class="section-header">
              <h2>Game Detection</h2>
              <div class="actions">
                @if (gameDetection.isDetecting()) {
                  <button (click)="gameDetection.stopDetection()" class="btn-danger">
                    ⏸️ Stop Detection
                  </button>
                } @else {
                  <button (click)="gameDetection.startDetection()" class="btn-primary">
                    ▶️ Start Detection
                  </button>
                }
              </div>
            </div>

            <!-- Current Game -->
            <div class="current-game-card">
              @if (currentGame()) {
                <div class="game-info">
                  <div class="game-icon">🎮</div>
                  <div class="game-details">
                    <h3>{{ currentGame()!.name }}</h3>
                    <div class="meta">
                      <span class="platform">{{ currentGame()!.platform }}</span>
                      <span class="separator">•</span>
                      <span class="playtime">{{ formatPlaytime(currentGame()!.playtime) }}</span>
                      @if (currentGame()!.category) {
                        <span class="separator">•</span>
                        <span class="category">{{ currentGame()!.category }}</span>
                      }
                    </div>
                  </div>
                  <div class="status-badge running">PLAYING</div>
                </div>
              } @else {
                <div class="no-game">
                  <div class="icon">🎮</div>
                  <h3>No Game Detected</h3>
                  <p>Start a game or enable auto-detection</p>
                </div>
              }
            </div>

            <!-- Manual Game Selection -->
            <div class="manual-selection">
              <h3>Manual Game Selection</h3>
              <div class="game-grid">
                @for (game of knownGames(); track game.processName) {
                  <button
                    (click)="selectGame(game.processName)"
                    class="game-card"
                    [class.active]="currentGame()?.processName === game.processName">
                    <div class="game-card-icon">🎮</div>
                    <div class="game-card-name">{{ game.data.name }}</div>
                    <div class="game-card-platform">{{ game.data.platform }}</div>
                  </button>
                }
              </div>
            </div>

            <!-- Session History -->
            <div class="session-history">
              <h3>Recent Sessions</h3>
              @for (session of recentSessions(); track session.id) {
                <div class="session-item">
                  <div class="session-game">{{ session.gameName }}</div>
                  <div class="session-duration">{{ formatPlaytime(session.duration) }}</div>
                  <div class="session-time">{{ formatDate(session.startTime) }}</div>
                </div>
              }
            </div>
          </div>
        }

        <!-- API Connections Tab -->
        @if (activeTab() === 'apis') {
          <div class="apis-tab">
            <h2>Gaming Platform APIs</h2>

            <!-- Platform Cards -->
            @for (platform of availablePlatforms; track platform.id) {
              <div class="platform-card" [class.connected]="isPlatformConnected(platform.id)">
                <div class="platform-header">
                  <div class="platform-icon">{{ platform.icon }}</div>
                  <div class="platform-info">
                    <h3>{{ platform.name }}</h3>
                    @if (!platform.supported) {
                      <span class="badge coming-soon">Coming Soon</span>
                    }
                  </div>
                  @if (isPlatformConnected(platform.id)) {
                    <div class="status-badge connected">Connected</div>
                  }
                </div>

                @if (platform.supported && platform.requiresKey) {
                  <div class="platform-config">
                    @if (!isPlatformConnected(platform.id)) {
                      <div class="api-key-input">
                        <input
                          type="password"
                          [(ngModel)]="apiKeys[platform.id]"
                          [placeholder]="platform.name + ' API Key'"
                          class="input" />
                        <button
                          (click)="connectPlatform(platform.id)"
                          class="btn-primary">
                          Connect
                        </button>
                      </div>
                      <button
                        (click)="showAPIInstructions(platform.id)"
                        class="btn-link">
                        How to get API key?
                      </button>
                    } @else {
                      <button
                        (click)="disconnectPlatform(platform.id)"
                        class="btn-secondary">
                        Disconnect
                      </button>

                      <!-- Steam Profile -->
                      @if (platform.id === 'steam' && gameAPI.steamProfile()) {
                        <div class="profile-info">
                          <div class="profile-avatar">
                            <img [src]="gameAPI.steamProfile()!.avatar" alt="Avatar" />
                          </div>
                          <div class="profile-details">
                            <div class="profile-name">{{ gameAPI.steamProfile()!.personaName }}</div>
                            <div class="profile-id">{{ gameAPI.steamProfile()!.steamId }}</div>
                          </div>
                        </div>
                      }

                      <!-- Riot Account -->
                      @if (platform.id === 'riot' && gameAPI.riotAccount()) {
                        <div class="profile-info">
                          <div class="profile-details">
                            <div class="profile-name">
                              {{ gameAPI.riotAccount()!.gameName }}#{{ gameAPI.riotAccount()!.tagLine }}
                            </div>
                            <div class="profile-id">{{ gameAPI.riotAccount()!.region }}</div>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Overlays Tab -->
        @if (activeTab() === 'overlays') {
          <div class="overlays-tab">
            <div class="section-header">
              <h2>Game Overlays</h2>
              <button (click)="showOverlayTemplates = !showOverlayTemplates" class="btn-primary">
                ➕ New Overlay
              </button>
            </div>

            <!-- Overlay Templates -->
            @if (showOverlayTemplates) {
              <div class="overlay-templates">
                <h3>Choose a Template</h3>
                <div class="template-grid">
                  @for (template of gameOverlay.templates(); track template.id) {
                    <button
                      (click)="createOverlayFromTemplate(template.id)"
                      class="template-card">
                      <div class="template-icon">📊</div>
                      <div class="template-name">{{ template.name }}</div>
                      <div class="template-desc">{{ template.description }}</div>
                      <div class="template-type">{{ template.gameType }}</div>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Active Overlays -->
            <div class="overlays-list">
              @for (overlay of gameOverlay.overlays(); track overlay.id) {
                <div class="overlay-item" [class.visible]="overlay.visible">
                  <div class="overlay-info">
                    <h4>{{ overlay.name }}</h4>
                    <div class="overlay-meta">
                      <span>{{ overlay.gameName }}</span>
                      <span class="separator">•</span>
                      <span>{{ overlay.stats.length }} stats</span>
                    </div>
                  </div>

                  <div class="overlay-actions">
                    <button (click)="gameOverlay.toggleOverlay(overlay.id)" class="btn-icon">
                      {{ overlay.visible ? '👁️' : '👁️‍🗨️' }}
                    </button>
                    <button (click)="editOverlay(overlay)" class="btn-icon">✏️</button>
                    <button (click)="gameOverlay.duplicateOverlay(overlay.id)" class="btn-icon">📋</button>
                    <button (click)="gameOverlay.deleteOverlay(overlay.id)" class="btn-icon">🗑️</button>
                  </div>
                </div>
              }

              @if (gameOverlay.overlays().length === 0) {
                <div class="empty-state">
                  <p>No overlays created yet</p>
                  <button (click)="showOverlayTemplates = true" class="btn-primary">
                    Create Your First Overlay
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Game Rules Tab -->
        @if (activeTab() === 'rules') {
          <div class="rules-tab">
            <div class="section-header">
              <h2>Game-Specific Rules</h2>
              <button (click)="showRuleCreator = !showRuleCreator" class="btn-primary">
                ➕ New Rule
              </button>
            </div>

            @if (showRuleCreator) {
              <div class="rule-creator">
                <h3>Create Game Rule</h3>
                <div class="form-group">
                  <label>Game Name</label>
                  <input type="text" [(ngModel)]="newRule.gameName" class="input" />
                </div>
                <div class="form-group">
                  <label>Auto-switch to Scene</label>
                  <input type="text" [(ngModel)]="newRule.autoSwitchScene" placeholder="Scene name" class="input" />
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" [(ngModel)]="newRule.autoStartRecording" />
                    Auto-start Recording
                  </label>
                </div>
                <div class="form-group">
                  <label>Custom Stream Title</label>
                  <input type="text" [(ngModel)]="newRule.customTitle" placeholder="Playing {{game}}" class="input" />
                </div>
                <div class="form-actions">
                  <button (click)="createRule()" class="btn-primary">Create Rule</button>
                  <button (click)="showRuleCreator = false" class="btn-secondary">Cancel</button>
                </div>
              </div>
            }

            <!-- Rules List -->
            <div class="rules-list">
              @for (rule of gameDetection.gameRules(); track rule.id) {
                <div class="rule-item" [class.enabled]="rule.enabled">
                  <div class="rule-info">
                    <h4>{{ rule.gameName }}</h4>
                    <div class="rule-actions-list">
                      @if (rule.autoSwitchScene) {
                        <div class="rule-action">🎬 Switch to "{{ rule.autoSwitchScene }}"</div>
                      }
                      @if (rule.autoStartRecording) {
                        <div class="rule-action">⏺️ Start Recording</div>
                      }
                      @if (rule.customTitle) {
                        <div class="rule-action">📝 Title: "{{ rule.customTitle }}"</div>
                      }
                    </div>
                  </div>
                  <div class="rule-controls">
                    <button (click)="gameDetection.toggleGameRule(rule.id)" class="btn-icon">
                      {{ rule.enabled ? '✓' : '○' }}
                    </button>
                    <button (click)="gameDetection.deleteGameRule(rule.id)" class="btn-icon">🗑️</button>
                  </div>
                </div>
              }

              @if (gameDetection.gameRules().length === 0) {
                <div class="empty-state">
                  <p>No game rules configured</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Statistics Tab -->
        @if (activeTab() === 'stats') {
          <div class="stats-tab">
            <h2>Gaming Statistics</h2>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">{{ formatPlaytime(sessionStats().totalPlaytime) }}</div>
                <div class="stat-label">Total Playtime</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-value">{{ sessionStats().gamesPlayed }}</div>
                <div class="stat-label">Games Played</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">{{ sessionStats().totalSessions }}</div>
                <div class="stat-label">Total Sessions</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">{{ sessionStats().currentStreak }}</div>
                <div class="stat-label">Day Streak</div>
              </div>

              <div class="stat-card large">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">{{ sessionStats().favoriteGame || 'None' }}</div>
                <div class="stat-label">Favorite Game</div>
              </div>

              <div class="stat-card large">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{{ formatPlaytime(sessionStats().averageSessionLength) }}</div>
                <div class="stat-label">Avg Session Length</div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .game-integration {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      color: white;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: #888;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .tab:hover {
      color: white;
    }

    .tab.active {
      color: white;
      border-bottom-color: #4a90e2;
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .current-game-card {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .game-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .game-icon {
      font-size: 4rem;
    }

    .game-details h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      color: #888;
      font-size: 0.9rem;
    }

    .separator {
      color: #444;
    }

    .platform {
      padding: 0.25rem 0.75rem;
      background: #3a3a3a;
      border-radius: 12px;
      text-transform: capitalize;
    }

    .status-badge {
      margin-left: auto;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .status-badge.running {
      background: #2a5a2a;
      color: #4ade80;
    }

    .status-badge.connected {
      background: #2a5a2a;
      color: #4ade80;
    }

    .no-game {
      text-align: center;
      padding: 2rem;
    }

    .no-game .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .no-game h3 {
      margin: 0 0 0.5rem;
      color: #888;
    }

    .no-game p {
      margin: 0;
      color: #666;
    }

    .manual-selection,
    .session-history,
    .overlay-templates,
    .overlays-list,
    .rules-list {
      margin-top: 2rem;
    }

    .manual-selection h3,
    .session-history h3,
    .overlay-templates h3 {
      margin: 0 0 1rem;
      font-size: 1.2rem;
    }

    .game-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .game-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .game-card:hover {
      border-color: #4a90e2;
      transform: translateY(-2px);
    }

    .game-card.active {
      border-color: #4ade80;
      background: #2a3a2a;
    }

    .game-card-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .game-card-name {
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.25rem;
    }

    .game-card-platform {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
    }

    .session-item {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      background: #2a2a2a;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .session-game {
      font-weight: 600;
    }

    .session-duration {
      color: #4a90e2;
    }

    .session-time {
      color: #888;
      font-size: 0.9rem;
    }

    .platform-card {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .platform-card.connected {
      border-color: #4ade80;
    }

    .platform-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .platform-icon {
      font-size: 2.5rem;
    }

    .platform-info {
      flex: 1;
    }

    .platform-info h3 {
      margin: 0 0 0.25rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.coming-soon {
      background: #3a3a3a;
      color: #888;
    }

    .platform-config {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .api-key-input {
      display: flex;
      gap: 0.5rem;
    }

    .profile-info {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
    }

    .profile-avatar img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
    }

    .profile-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .profile-id {
      color: #888;
      font-size: 0.9rem;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .template-card {
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-card:hover {
      border-color: #4a90e2;
      transform: translateY(-2px);
    }

    .template-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .template-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .template-desc {
      font-size: 0.9rem;
      color: #888;
      margin-bottom: 0.5rem;
    }

    .template-type {
      font-size: 0.75rem;
      color: #4a90e2;
      text-transform: uppercase;
    }

    .overlay-item,
    .rule-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .overlay-item.visible {
      border-color: #4ade80;
    }

    .rule-item.enabled {
      border-color: #4ade80;
    }

    .overlay-info h4,
    .rule-info h4 {
      margin: 0 0 0.5rem;
    }

    .overlay-meta {
      font-size: 0.9rem;
      color: #888;
    }

    .overlay-actions,
    .rule-controls {
      display: flex;
      gap: 0.5rem;
    }

    .rule-actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .rule-action {
      font-size: 0.9rem;
      color: #888;
    }

    .rule-creator {
      background: #2a2a2a;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #888;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-card.large {
      grid-column: span 2;
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #4a90e2;
    }

    .stat-label {
      color: #888;
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #888;
    }

    .btn-primary, .btn-secondary, .btn-danger, .btn-link, .btn-icon {
      padding: 0.5rem 1rem;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #3a3a3a;
    }

    .btn-danger {
      background: #aa3a3a;
    }

    .btn-link {
      background: transparent;
      color: #4a90e2;
      text-decoration: underline;
    }

    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      font-size: 1.2rem;
    }

    .btn-primary:hover { background: #357abd; }
    .btn-secondary:hover { background: #4a4a4a; }
    .btn-danger:hover { background: #cc4a4a; }
    .btn-icon:hover { background: #3a3a3a; }

    .input {
      flex: 1;
      padding: 0.75rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .input:focus {
      outline: none;
      border-color: #4a90e2;
    }
  `]
})
export class GameIntegrationComponent {
  protected gameDetection = inject(GameDetectionService);
  protected gameAPI = inject(GameAPIService);
  protected gameOverlay = inject(GameOverlayService);

  protected activeTab = signal<'detection' | 'apis' | 'overlays' | 'rules' | 'stats'>('detection');

  protected showOverlayTemplates = false;
  protected showRuleCreator = false;

  protected apiKeys: Record<string, string> = {
    steam: '',
    riot: '',
    epic: ''
  };

  protected newRule = {
    gameName: '',
    autoSwitchScene: '',
    autoStartRecording: false,
    customTitle: ''
  };

  protected readonly currentGame = this.gameDetection.currentGame;
  protected readonly knownGames = computed(() => this.gameDetection.getKnownGames());
  protected readonly recentSessions = computed(() =>
    this.gameDetection.gameHistory().slice(0, 5)
  );
  protected readonly sessionStats = this.gameDetection.sessionStats;

  protected readonly availablePlatforms = this.gameAPI.getAvailablePlatforms();

  selectGame(processName: string): void {
    this.gameDetection.setCurrentGame(processName);
  }

  formatPlaytime(seconds: number): string {
    return this.gameDetection.formatPlaytime(seconds);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  isPlatformConnected(platformId: string): boolean {
    switch (platformId) {
      case 'steam':
        return this.gameAPI.steamConnected();
      case 'riot':
        return this.gameAPI.riotConnected();
      default:
        return false;
    }
  }

  async connectPlatform(platformId: string): Promise<void> {
    const apiKey = this.apiKeys[platformId];
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    switch (platformId) {
      case 'steam':
        this.gameAPI.configure({ ...this.gameAPI.config(), steamApiKey: apiKey });
        await this.gameAPI.connectSteam('YOUR_STEAM_ID');
        break;

      case 'riot':
        this.gameAPI.configure({ ...this.gameAPI.config(), riotApiKey: apiKey });
        await this.gameAPI.connectRiot('PlayerName', 'NA1', 'americas');
        break;
    }
  }

  disconnectPlatform(platformId: string): void {
    switch (platformId) {
      case 'steam':
        this.gameAPI.disconnectSteam();
        break;
      case 'riot':
        this.gameAPI.disconnectRiot();
        break;
    }
  }

  showAPIInstructions(platformId: string): void {
    const instructions = this.gameAPI.getAPIKeyInstructions(platformId);
    alert(instructions);
  }

  createOverlayFromTemplate(templateId: string): void {
    const gameName = this.currentGame()?.name || 'Default';
    this.gameOverlay.createFromTemplate(templateId, gameName);
    this.showOverlayTemplates = false;
  }

  editOverlay(overlay: GameOverlay): void {
    // In a real app, this would open a detailed editor
    console.log('Editing overlay:', overlay);
  }

  createRule(): void {
    if (!this.newRule.gameName) {
      alert('Please enter a game name');
      return;
    }

    this.gameDetection.createGameRule(
      crypto.randomUUID(),
      this.newRule.gameName,
      {
        autoSwitchScene: this.newRule.autoSwitchScene || undefined,
        autoStartRecording: this.newRule.autoStartRecording,
        customTitle: this.newRule.customTitle || undefined
      }
    );

    this.newRule = {
      gameName: '',
      autoSwitchScene: '',
      autoStartRecording: false,
      customTitle: ''
    };
    this.showRuleCreator = false;
  }
}
