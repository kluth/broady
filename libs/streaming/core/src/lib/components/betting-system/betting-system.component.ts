import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BettingService, Bet, BetOption, ViewerBet } from '../../services/betting.service';
import { GameDetectionService } from '../../services/game-detection.service';

/**
 * Betting System Component
 * Complete betting/predictions management for viewers
 */

@Component({
  selector: 'lib-betting-system',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="betting-system">
      <!-- Header with Stats -->
      <div class="header">
        <h1>🎲 Viewer Betting System</h1>
        <div class="stats-bar">
          <div class="stat">
            <div class="stat-value">{{ betting.statistics().activeBets }}</div>
            <div class="stat-label">Active Bets</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ betting.statistics().totalPointsInPlay }}</div>
            <div class="stat-label">Points in Play</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ betting.statistics().totalViewers }}</div>
            <div class="stat-label">Total Bettors</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ betting.statistics().resolvedBets }}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          (click)="activeTab.set('active')"
          [class.active]="activeTab() === 'active'"
          class="tab">
          🎯 Active Bets
        </button>
        <button
          (click)="activeTab.set('create')"
          [class.active]="activeTab() === 'create'"
          class="tab">
          ➕ Create Bet
        </button>
        <button
          (click)="activeTab.set('templates')"
          [class.active]="activeTab() === 'templates'"
          class="tab">
          📋 Templates
        </button>
        <button
          (click)="activeTab.set('leaderboard')"
          [class.active]="activeTab() === 'leaderboard'"
          class="tab">
          🏆 Leaderboard
        </button>
        <button
          (click)="activeTab.set('history')"
          [class.active]="activeTab() === 'history'"
          class="tab">
          📜 History
        </button>
      </div>

      <div class="tab-content">
        <!-- Active Bets Tab -->
        @if (activeTab() === 'active') {
          <div class="active-bets-tab">
            @if (activeBets().length > 0) {
              @for (bet of activeBets(); track bet.id) {
                <div class="bet-card" [class.locked]="bet.status === 'locked'">
                  <div class="bet-header">
                    <div class="bet-info">
                      <h3>{{ bet.title }}</h3>
                      <p>{{ bet.description }}</p>
                      @if (bet.game) {
                        <div class="bet-game">🎮 {{ bet.game }}</div>
                      }
                    </div>
                    <div class="bet-status">
                      <span class="status-badge" [class]="bet.status">
                        {{ bet.status === 'open' ? '🟢 Open' : '🔒 Locked' }}
                      </span>
                      @if (bet.autoResolve) {
                        <span class="auto-badge">🤖 Auto-resolve</span>
                      }
                    </div>
                  </div>

                  <div class="bet-stats">
                    <div class="stat-item">
                      <span class="label">Total Pool:</span>
                      <span class="value">{{ bet.totalPoints }} points</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">Total Bettors:</span>
                      <span class="value">{{ bet.totalBets }}</span>
                    </div>
                  </div>

                  <div class="bet-options">
                    @for (option of bet.options; track option.id) {
                      <div class="option-card" [style.border-color]="option.color || '#4a90e2'">
                        <div class="option-header">
                          @if (option.icon) {
                            <span class="option-icon">{{ option.icon }}</span>
                          }
                          <span class="option-label">{{ option.label }}</span>
                          <span class="option-odds">{{ option.odds.toFixed(2) }}x</span>
                        </div>

                        <div class="option-stats">
                          <div class="option-stat">
                            <span>{{ option.totalPoints }} points</span>
                          </div>
                          <div class="option-stat">
                            <span>{{ option.totalBettors }} bettors</span>
                          </div>
                          <div class="option-percentage">
                            {{ getOptionPercentage(bet, option) }}%
                          </div>
                        </div>

                        <div class="option-bar">
                          <div
                            class="option-fill"
                            [style.width.%]="getOptionPercentage(bet, option)"
                            [style.background-color]="option.color || '#4a90e2'"></div>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="bet-actions">
                    @if (bet.status === 'open') {
                      <button (click)="lockBet(bet.id)" class="btn-warning">
                        🔒 Lock Betting
                      </button>
                    }

                    @if (bet.status === 'locked') {
                      @for (option of bet.options; track option.id) {
                        <button
                          (click)="resolveBet(bet.id, option.id)"
                          class="btn-success"
                          [style.border-color]="option.color">
                          ✓ {{ option.label }} Wins
                        </button>
                      }

                      @if (bet.autoResolve && currentGame()) {
                        <button (click)="autoResolve(bet.id)" class="btn-primary">
                          🤖 Auto-Resolve from Game Stats
                        </button>
                      }
                    }

                    <button (click)="cancelBet(bet.id)" class="btn-danger">
                      ❌ Cancel & Refund
                    </button>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-state">
                <div class="empty-icon">🎲</div>
                <h3>No Active Bets</h3>
                <p>Create a bet to get started!</p>
                <button (click)="activeTab.set('create')" class="btn-primary">
                  Create Bet
                </button>
              </div>
            }
          </div>
        }

        <!-- Create Bet Tab -->
        @if (activeTab() === 'create') {
          <div class="create-bet-tab">
            <h2>Create New Bet</h2>

            <div class="form-group">
              <label>Bet Title</label>
              <input
                type="text"
                [(ngModel)]="newBet.title"
                placeholder="e.g., Will we win this match?"
                class="input" />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                [(ngModel)]="newBet.description"
                placeholder="Describe the bet..."
                rows="3"
                class="input"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="newBet.category" class="input">
                  <option value="match-outcome">Match Outcome</option>
                  <option value="performance">Performance</option>
                  <option value="achievement">Achievement</option>
                  <option value="challenge">Challenge</option>
                  <option value="race">Race</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div class="form-group">
                <label>Type</label>
                <select [(ngModel)]="newBet.type" class="input">
                  <option value="binary">Binary (2 options)</option>
                  <option value="multiple">Multiple options</option>
                </select>
              </div>
            </div>

            @if (currentGame()) {
              <div class="form-group">
                <label>
                  <input type="checkbox" [(ngModel)]="newBet.linkToGame" />
                  Link to current game ({{ currentGame()!.name }})
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" [(ngModel)]="newBet.autoResolve" />
                  Auto-resolve from game stats
                </label>
              </div>

              @if (newBet.autoResolve) {
                <div class="auto-resolve-config">
                  <h4>Auto-Resolve Configuration</h4>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Game Stat</label>
                      <select [(ngModel)]="newBet.gameStatKey" class="input">
                        <option value="kills">Kills</option>
                        <option value="deaths">Deaths</option>
                        <option value="assists">Assists</option>
                        <option value="kdRatio">K/D Ratio</option>
                        <option value="kda">KDA</option>
                        <option value="placement">Placement</option>
                        <option value="matchResult">Match Result (Win/Loss)</option>
                        <option value="damage">Damage</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Condition</label>
                      <select [(ngModel)]="newBet.condition" class="input">
                        <option value="equals">Equals</option>
                        <option value="greater">Greater Than</option>
                        <option value="less">Less Than</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Value</label>
                      <input
                        type="text"
                        [(ngModel)]="newBet.conditionValue"
                        placeholder="e.g., 10, true, win"
                        class="input" />
                    </div>
                  </div>
                </div>
              }
            }

            <div class="form-group">
              <label>Options</label>
              <div class="options-list">
                @for (option of newBet.options; track $index; let i = $index) {
                  <div class="option-input">
                    <input
                      type="text"
                      [(ngModel)]="option.label"
                      placeholder="Option label"
                      class="input" />
                    <input
                      type="text"
                      [(ngModel)]="option.icon"
                      placeholder="Icon (emoji)"
                      class="input-small" />
                    <input
                      type="color"
                      [(ngModel)]="option.color"
                      class="input-color" />
                    <button (click)="removeOption(i)" class="btn-icon">🗑️</button>
                  </div>
                }

                @if (newBet.type === 'multiple' || newBet.options.length < 2) {
                  <button (click)="addOption()" class="btn-secondary">
                    ➕ Add Option
                  </button>
                }
              </div>
            </div>

            <div class="form-actions">
              <button (click)="createBet()" class="btn-primary">
                Create Bet
              </button>
              <button (click)="resetForm()" class="btn-secondary">
                Reset
              </button>
            </div>
          </div>
        }

        <!-- Templates Tab -->
        @if (activeTab() === 'templates') {
          <div class="templates-tab">
            <h2>Bet Templates</h2>

            <div class="template-filters">
              <button
                *ngFor="let gameType of gameTypes"
                (click)="filterGameType.set(gameType)"
                [class.active]="filterGameType() === gameType"
                class="filter-btn">
                {{ gameType }}
              </button>
            </div>

            <div class="templates-grid">
              @for (template of filteredTemplates(); track template.id) {
                <div class="template-card">
                  <div class="template-header">
                    <h4>{{ template.name }}</h4>
                    <span class="template-type">{{ template.gameType }}</span>
                  </div>

                  <p class="template-desc">{{ template.description }}</p>

                  <div class="template-options">
                    @for (option of template.defaultOptions; track $index) {
                      <div class="template-option">
                        @if (option.icon) {
                          <span>{{ option.icon }}</span>
                        }
                        <span>{{ option.label }}</span>
                      </div>
                    }
                  </div>

                  @if (template.autoResolve) {
                    <div class="template-badge">🤖 Auto-resolve</div>
                  }

                  <button (click)="createFromTemplate(template.id)" class="btn-primary full-width">
                    Use Template
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Leaderboard Tab -->
        @if (activeTab() === 'leaderboard') {
          <div class="leaderboard-tab">
            <h2>🏆 Top Bettors</h2>

            <div class="leaderboard-list">
              @for (viewer of betting.leaderboard(); track viewer.viewerId; let i = $index) {
                <div class="leaderboard-item" [class.top3]="i < 3">
                  <div class="rank">
                    @if (i === 0) {
                      <span class="medal">🥇</span>
                    } @else if (i === 1) {
                      <span class="medal">🥈</span>
                    } @else if (i === 2) {
                      <span class="medal">🥉</span>
                    } @else {
                      <span class="rank-number">{{ i + 1 }}</span>
                    }
                  </div>

                  <div class="viewer-info">
                    <div class="viewer-name">{{ viewer.viewerName }}</div>
                    <div class="viewer-stats">
                      <span>{{ viewer.totalBets }} bets</span>
                      <span class="separator">•</span>
                      <span class="win-rate" [class.good]="viewer.winRate >= 50">
                        {{ viewer.winRate.toFixed(1) }}% win rate
                      </span>
                    </div>
                  </div>

                  <div class="viewer-points">
                    {{ viewer.totalPoints }} points
                  </div>
                </div>
              }

              @if (betting.leaderboard().length === 0) {
                <div class="empty-state">
                  <p>No betting data yet</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- History Tab -->
        @if (activeTab() === 'history') {
          <div class="history-tab">
            <h2>📜 Bet History</h2>

            @for (bet of resolvedBets(); track bet.id) {
              <div class="history-item">
                <div class="history-header">
                  <h4>{{ bet.title }}</h4>
                  <span class="history-date">{{ formatDate(bet.resolvedAt!) }}</span>
                </div>

                <p>{{ bet.description }}</p>

                <div class="history-result">
                  <span class="label">Winner:</span>
                  <span class="winner">
                    {{ getWinningOption(bet)?.icon }}
                    {{ getWinningOption(bet)?.label }}
                  </span>
                </div>

                <div class="history-stats">
                  <div class="stat">Total Pool: {{ bet.totalPoints }} points</div>
                  <div class="stat">Total Bettors: {{ bet.totalBets }}</div>
                </div>

                <button (click)="deleteBet(bet.id)" class="btn-secondary">
                  Delete
                </button>
              </div>
            }

            @if (resolvedBets().length === 0) {
              <div class="empty-state">
                <p>No bet history yet</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .betting-system {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      color: white;
    }

    .header {
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: 1px solid #3a3a3a;
    }

    .header h1 {
      margin: 0 0 1.5rem;
      font-size: 2rem;
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat {
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #ffd700;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 0.25rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
      overflow-x: auto;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: #888;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 0.9rem;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab:hover {
      color: white;
    }

    .tab.active {
      color: white;
      border-bottom-color: #667eea;
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .bet-card {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .bet-card.locked {
      border-color: #ffa500;
    }

    .bet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .bet-info h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .bet-info p {
      margin: 0;
      color: #888;
    }

    .bet-game {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #3a3a3a;
      border-radius: 12px;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .bet-status {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .status-badge.open {
      background: #2a5a2a;
      color: #4ade80;
    }

    .status-badge.locked {
      background: #5a4a2a;
      color: #ffa500;
    }

    .auto-badge {
      padding: 0.25rem 0.75rem;
      background: #2a3a5a;
      color: #4a90e2;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    .bet-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .stat-item {
      display: flex;
      gap: 0.5rem;
    }

    .stat-item .label {
      color: #888;
    }

    .stat-item .value {
      font-weight: 600;
      color: #4a90e2;
    }

    .bet-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .option-card {
      background: #1a1a1a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      padding: 1rem;
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .option-icon {
      font-size: 1.5rem;
    }

    .option-label {
      flex: 1;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .option-odds {
      padding: 0.25rem 0.75rem;
      background: #667eea;
      border-radius: 12px;
      font-weight: 600;
      color: white;
      font-size: 0.9rem;
    }

    .option-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #888;
    }

    .option-percentage {
      font-size: 1.1rem;
      font-weight: 600;
      color: #4a90e2;
    }

    .option-bar {
      height: 8px;
      background: #3a3a3a;
      border-radius: 4px;
      overflow: hidden;
    }

    .option-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .bet-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #888;
      font-size: 0.9rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .input {
      width: 100%;
      padding: 0.75rem;
      background: #2a2a2a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .input:focus {
      outline: none;
      border-color: #667eea;
    }

    .auto-resolve-config {
      padding: 1rem;
      background: #2a2a2a;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .auto-resolve-config h4 {
      margin: 0 0 1rem;
      color: #4a90e2;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .option-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .input-small {
      width: 80px;
      padding: 0.75rem;
      background: #2a2a2a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      text-align: center;
    }

    .input-color {
      width: 60px;
      height: 42px;
      padding: 0.25rem;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 2rem;
    }

    .template-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      background: #2a2a2a;
      color: #888;
      border: 1px solid #3a3a3a;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: capitalize;
    }

    .filter-btn:hover {
      color: white;
    }

    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .template-card {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .template-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .template-header h4 {
      margin: 0;
      font-size: 1.1rem;
    }

    .template-type {
      padding: 0.25rem 0.75rem;
      background: #3a3a3a;
      border-radius: 12px;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .template-desc {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .template-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .template-option {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      background: #1a1a1a;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .template-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #2a3a5a;
      color: #4a90e2;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-bottom: 1rem;
    }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
    }

    .leaderboard-item.top3 {
      border-color: #ffd700;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
    }

    .rank {
      min-width: 60px;
      text-align: center;
    }

    .medal {
      font-size: 2rem;
    }

    .rank-number {
      font-size: 1.5rem;
      font-weight: 600;
      color: #888;
    }

    .viewer-info {
      flex: 1;
    }

    .viewer-name {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }

    .viewer-stats {
      font-size: 0.875rem;
      color: #888;
    }

    .separator {
      margin: 0 0.5rem;
    }

    .win-rate.good {
      color: #4ade80;
    }

    .viewer-points {
      font-size: 1.5rem;
      font-weight: 600;
      color: #667eea;
    }

    .history-item {
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .history-header h4 {
      margin: 0;
      font-size: 1.2rem;
    }

    .history-date {
      color: #888;
      font-size: 0.875rem;
    }

    .history-result {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .history-result .label {
      color: #888;
    }

    .history-result .winner {
      font-weight: 600;
      color: #4ade80;
      font-size: 1.1rem;
    }

    .history-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #888;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      color: #888;
    }

    .empty-state p {
      margin: 0 0 2rem;
      color: #666;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-warning, .btn-danger, .btn-icon {
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #3a3a3a;
    }

    .btn-success {
      background: #2a5a2a;
      color: #4ade80;
    }

    .btn-warning {
      background: #5a4a2a;
      color: #ffa500;
    }

    .btn-danger {
      background: #5a2a2a;
      color: #ff6b6b;
    }

    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      font-size: 1.2rem;
    }

    .btn-primary:hover { background: #5568d3; }
    .btn-secondary:hover { background: #4a4a4a; }
    .btn-success:hover { background: #3a7a3a; }
    .btn-warning:hover { background: #6a5a3a; }
    .btn-danger:hover { background: #7a3a3a; }
    .btn-icon:hover { background: #3a3a3a; }

    .full-width {
      width: 100%;
    }
  `]
})
export class BettingSystemComponent {
  protected betting = inject(BettingService);
  protected gameDetection = inject(GameDetectionService);

  protected activeTab = signal<'active' | 'create' | 'templates' | 'leaderboard' | 'history'>('active');
  protected filterGameType = signal<string>('all');

  protected readonly activeBets = this.betting.activeBets;
  protected readonly currentGame = this.gameDetection.currentGame;

  protected readonly resolvedBets = computed(() =>
    this.betting.bets().filter(b => b.status === 'resolved')
  );

  protected readonly gameTypes = ['all', 'competitive', 'fps', 'moba', 'battle-royale', 'racing', 'rpg'];

  protected readonly filteredTemplates = computed(() => {
    const filter = this.filterGameType();
    if (filter === 'all') return this.betting.templates();
    return this.betting.templates().filter(t => t.gameType === filter);
  });

  protected newBet = {
    title: '',
    description: '',
    category: 'custom' as any,
    type: 'binary' as any,
    linkToGame: false,
    autoResolve: false,
    gameStatKey: '',
    condition: 'equals' as any,
    conditionValue: '',
    options: [
      { label: 'Yes', icon: '✅', color: '#4ade80' },
      { label: 'No', icon: '❌', color: '#ff6b6b' }
    ]
  };

  createBet(): void {
    if (!this.newBet.title || !this.newBet.description) {
      alert('Please fill in title and description');
      return;
    }

    if (this.newBet.options.length < 2) {
      alert('Please add at least 2 options');
      return;
    }

    this.betting.createBet(
      this.newBet.title,
      this.newBet.description,
      this.newBet.options,
      {
        category: this.newBet.category,
        type: this.newBet.type,
        game: this.newBet.linkToGame && this.currentGame()
          ? this.currentGame()!.name
          : undefined,
        autoResolve: this.newBet.autoResolve,
        autoResolveConfig: this.newBet.autoResolve ? {
          gameStatKey: this.newBet.gameStatKey,
          condition: this.newBet.condition,
          value: this.parseConditionValue(this.newBet.conditionValue),
          targetOptionId: this.newBet.options[0].label // First option wins if condition is true
        } : undefined
      }
    );

    this.resetForm();
    this.activeTab.set('active');
  }

  createFromTemplate(templateId: string): void {
    const game = this.currentGame();
    this.betting.createFromTemplate(templateId, {
      game: game?.name
    });
    this.activeTab.set('active');
  }

  lockBet(betId: string): void {
    this.betting.lockBet(betId);
  }

  resolveBet(betId: string, winningOptionId: string): void {
    const result = this.betting.resolveBet(betId, winningOptionId);
    if (result) {
      alert(`Bet resolved! ${result.winners.length} winners, ${result.totalPayout} total payout`);
    }
  }

  autoResolve(betId: string): void {
    // In real implementation, would fetch actual game stats
    const mockGameStats = {
      kills: 15,
      deaths: 8,
      assists: 12,
      kdRatio: 1.88,
      kda: 3.38,
      placement: 3,
      matchResult: 'win',
      damage: 2500
    };

    const result = this.betting.autoResolveBet(betId, mockGameStats);
    if (result) {
      alert(`Auto-resolved! ${result.winners.length} winners`);
    } else {
      alert('Failed to auto-resolve bet');
    }
  }

  cancelBet(betId: string): void {
    if (confirm('Cancel this bet and refund all points?')) {
      this.betting.cancelBet(betId);
    }
  }

  deleteBet(betId: string): void {
    if (confirm('Delete this bet from history?')) {
      this.betting.deleteBet(betId);
    }
  }

  addOption(): void {
    this.newBet.options.push({
      label: '',
      icon: '',
      color: '#4a90e2'
    });
  }

  removeOption(index: number): void {
    if (this.newBet.options.length > 2) {
      this.newBet.options.splice(index, 1);
    }
  }

  resetForm(): void {
    this.newBet = {
      title: '',
      description: '',
      category: 'custom',
      type: 'binary',
      linkToGame: false,
      autoResolve: false,
      gameStatKey: '',
      condition: 'equals',
      conditionValue: '',
      options: [
        { label: 'Yes', icon: '✅', color: '#4ade80' },
        { label: 'No', icon: '❌', color: '#ff6b6b' }
      ]
    };
  }

  getOptionPercentage(bet: Bet, option: BetOption): number {
    if (bet.totalPoints === 0) return 0;
    return Math.round((option.totalPoints / bet.totalPoints) * 100);
  }

  getWinningOption(bet: Bet): BetOption | undefined {
    return bet.options.find(o => o.id === bet.winningOptionId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  private parseConditionValue(value: string): any {
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;

    // Check for boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }
}
