import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

import { LorcanaCardService, LorcanaCard } from '../../services/lorcana-card.service';
import { PokemonTcgService, PokemonCard } from '../../services/pokemon-tcg.service';

@Component({
  selector: 'app-card-overlay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule
  ],
  template: `
    <mat-card class="card-overlay">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>style</mat-icon>
          Card Game Overlay
        </mat-card-title>
        <button mat-icon-button (click)="minimized.set(!minimized())">
          <mat-icon>{{ minimized() ? 'expand_more' : 'expand_less' }}</mat-icon>
        </button>
      </mat-card-header>

      @if (!minimized()) {
        <mat-card-content>
          <mat-tab-group>
            <!-- Lorcana Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">auto_awesome</mat-icon>
                Lorcana
              </ng-template>

              <div class="tab-content">
                <!-- Search -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search Lorcana Cards</mat-label>
                  <input
                    matInput
                    [(ngModel)]="lorcanaSearch"
                    (keyup.enter)="searchLorcana()"
                    placeholder="Enter card name...">
                  <button
                    mat-icon-button
                    matSuffix
                    (click)="searchLorcana()"
                    [disabled]="lorcanaService.isLoading()">
                    <mat-icon>search</mat-icon>
                  </button>
                </mat-form-field>

                @if (lorcanaService.isLoading()) {
                  <div class="loading">
                    <mat-icon class="spinning">refresh</mat-icon>
                    Loading...
                  </div>
                }

                <!-- Selected Card Display -->
                @if (selectedLorcanaCard()) {
                  <div class="card-display lorcana-card">
                    <button
                      mat-icon-button
                      class="close-btn"
                      (click)="selectedLorcanaCard.set(null)">
                      <mat-icon>close</mat-icon>
                    </button>

                    <div class="card-image">
                      <img [src]="selectedLorcanaCard()!.image_url" [alt]="selectedLorcanaCard()!.name">
                    </div>

                    <div class="card-info">
                      <h2>{{ selectedLorcanaCard()!.name }}</h2>
                      @if (selectedLorcanaCard()!.version) {
                        <p class="subtitle">{{ selectedLorcanaCard()!.version }}</p>
                      }

                      <mat-chip-set>
                        <mat-chip>{{ selectedLorcanaCard()!.type }}</mat-chip>
                        <mat-chip>Cost: {{ selectedLorcanaCard()!.cost }}</mat-chip>
                        <mat-chip>{{ selectedLorcanaCard()!.rarity }}</mat-chip>
                        @if (selectedLorcanaCard()!.inkable) {
                          <mat-chip>Inkable</mat-chip>
                        }
                      </mat-chip-set>

                      <mat-divider></mat-divider>

                      <div class="card-stats">
                        @if (selectedLorcanaCard()!.strength) {
                          <div class="stat">
                            <span class="stat-label">⚔️ Strength</span>
                            <span class="stat-value">{{ selectedLorcanaCard()!.strength }}</span>
                          </div>
                        }
                        @if (selectedLorcanaCard()!.willpower) {
                          <div class="stat">
                            <span class="stat-label">🛡️ Willpower</span>
                            <span class="stat-value">{{ selectedLorcanaCard()!.willpower }}</span>
                          </div>
                        }
                        @if (selectedLorcanaCard()!.lore) {
                          <div class="stat">
                            <span class="stat-label">📖 Lore</span>
                            <span class="stat-value">{{ selectedLorcanaCard()!.lore }}</span>
                          </div>
                        }
                      </div>

                      @if (selectedLorcanaCard()!.card_text) {
                        <div class="card-text">
                          <strong>Card Text:</strong>
                          <p>{{ selectedLorcanaCard()!.card_text }}</p>
                        </div>
                      }

                      @if (selectedLorcanaCard()!.flavor_text) {
                        <div class="flavor-text">
                          <em>{{ selectedLorcanaCard()!.flavor_text }}</em>
                        </div>
                      }

                      <div class="card-meta">
                        <small>{{ selectedLorcanaCard()!.set_name }} - #{{ selectedLorcanaCard()!.set_num }}</small>
                        @if (selectedLorcanaCard()!.artist) {
                          <small>Artist: {{ selectedLorcanaCard()!.artist }}</small>
                        }
                      </div>

                      <div class="card-actions">
                        <button
                          mat-raised-button
                          color="primary"
                          (click)="showOnStream('lorcana', selectedLorcanaCard()!)">
                          <mat-icon>visibility</mat-icon>
                          Show on Stream
                        </button>
                        <button
                          mat-stroked-button
                          (click)="getRandomLorcanaCard()">
                          <mat-icon>shuffle</mat-icon>
                          Random
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Search Results -->
                @if (lorcanaService.searchResults().length > 0 && !selectedLorcanaCard()) {
                  <div class="search-results">
                    <h3>Search Results ({{ lorcanaService.searchResults().length }})</h3>
                    <div class="results-grid">
                      @for (card of lorcanaService.searchResults(); track card.id) {
                        <div class="result-card" (click)="selectLorcanaCard(card)">
                          <img [src]="card.image_url" [alt]="card.name">
                          <div class="result-info">
                            <strong>{{ card.name }}</strong>
                            @if (card.version) {
                              <small>{{ card.version }}</small>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Recent Cards -->
                @if (lorcanaService.recentCards().length > 0 && !selectedLorcanaCard() && lorcanaService.searchResults().length === 0) {
                  <div class="recent-cards">
                    <h3>Recent Cards</h3>
                    <div class="recent-grid">
                      @for (card of lorcanaService.recentCards(); track card.id) {
                        <button
                          mat-stroked-button
                          class="recent-card"
                          (click)="selectLorcanaCard(card)">
                          {{ card.name }}
                          @if (card.version) {
                            <small>- {{ card.version }}</small>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Pokemon Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">catching_pokemon</mat-icon>
                Pokémon
              </ng-template>

              <div class="tab-content">
                <!-- Search -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search Pokémon Cards</mat-label>
                  <input
                    matInput
                    [(ngModel)]="pokemonSearch"
                    (keyup.enter)="searchPokemon()"
                    placeholder="Enter card name...">
                  <button
                    mat-icon-button
                    matSuffix
                    (click)="searchPokemon()"
                    [disabled]="pokemonService.isLoading()">
                    <mat-icon>search</mat-icon>
                  </button>
                </mat-form-field>

                @if (pokemonService.isLoading()) {
                  <div class="loading">
                    <mat-icon class="spinning">refresh</mat-icon>
                    Loading...
                  </div>
                }

                <!-- Selected Card Display -->
                @if (selectedPokemonCard()) {
                  <div class="card-display pokemon-card">
                    <button
                      mat-icon-button
                      class="close-btn"
                      (click)="selectedPokemonCard.set(null)">
                      <mat-icon>close</mat-icon>
                    </button>

                    <div class="card-image">
                      <img [src]="selectedPokemonCard()!.images.large" [alt]="selectedPokemonCard()!.name">
                    </div>

                    <div class="card-info">
                      <h2>{{ selectedPokemonCard()!.name }}</h2>

                      <mat-chip-set>
                        <mat-chip>{{ selectedPokemonCard()!.supertype }}</mat-chip>
                        @if (selectedPokemonCard()!.hp) {
                          <mat-chip>HP: {{ selectedPokemonCard()!.hp }}</mat-chip>
                        }
                        @for (type of selectedPokemonCard()!.types || []; track type) {
                          <mat-chip>{{ type }}</mat-chip>
                        }
                        <mat-chip>{{ selectedPokemonCard()!.rarity }}</mat-chip>
                      </mat-chip-set>

                      <mat-divider></mat-divider>

                      <!-- Attacks -->
                      @if (selectedPokemonCard()!.attacks && selectedPokemonCard()!.attacks!.length > 0) {
                        <div class="attacks">
                          <strong>Attacks:</strong>
                          @for (attack of selectedPokemonCard()!.attacks; track attack.name) {
                            <div class="attack">
                              <div class="attack-name">
                                {{ attack.name }}
                                @if (attack.damage) {
                                  <span class="damage">{{ attack.damage }}</span>
                                }
                              </div>
                              <div class="attack-cost">
                                @for (cost of attack.cost; track $index) {
                                  <mat-chip>{{ cost }}</mat-chip>
                                }
                              </div>
                              @if (attack.text) {
                                <p class="attack-text">{{ attack.text }}</p>
                              }
                            </div>
                          }
                        </div>
                      }

                      <!-- Weaknesses & Resistances -->
                      <div class="weaknesses-resistances">
                        @if (selectedPokemonCard()!.weaknesses && selectedPokemonCard()!.weaknesses!.length > 0) {
                          <div class="weakness">
                            <strong>Weakness:</strong>
                            @for (weakness of selectedPokemonCard()!.weaknesses; track weakness.type) {
                              <mat-chip>{{ weakness.type }} {{ weakness.value }}</mat-chip>
                            }
                          </div>
                        }
                        @if (selectedPokemonCard()!.resistances && selectedPokemonCard()!.resistances!.length > 0) {
                          <div class="resistance">
                            <strong>Resistance:</strong>
                            @for (resistance of selectedPokemonCard()!.resistances; track resistance.type) {
                              <mat-chip>{{ resistance.type }} {{ resistance.value }}</mat-chip>
                            }
                          </div>
                        }
                      </div>

                      @if (selectedPokemonCard()!.flavorText) {
                        <div class="flavor-text">
                          <em>{{ selectedPokemonCard()!.flavorText }}</em>
                        </div>
                      }

                      <div class="card-meta">
                        <small>{{ selectedPokemonCard()!.set.name }} - #{{ selectedPokemonCard()!.number }}</small>
                        @if (selectedPokemonCard()!.artist) {
                          <small>Artist: {{ selectedPokemonCard()!.artist }}</small>
                        }
                      </div>

                      <div class="card-actions">
                        <button
                          mat-raised-button
                          color="primary"
                          (click)="showOnStream('pokemon', selectedPokemonCard()!)">
                          <mat-icon>visibility</mat-icon>
                          Show on Stream
                        </button>
                        <button
                          mat-stroked-button
                          (click)="getRandomPokemonCard()">
                          <mat-icon>shuffle</mat-icon>
                          Random
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Search Results -->
                @if (pokemonService.searchResults().length > 0 && !selectedPokemonCard()) {
                  <div class="search-results">
                    <h3>Search Results ({{ pokemonService.searchResults().length }})</h3>
                    <div class="results-grid">
                      @for (card of pokemonService.searchResults(); track card.id) {
                        <div class="result-card" (click)="selectPokemonCard(card)">
                          <img [src]="card.images.small" [alt]="card.name">
                          <div class="result-info">
                            <strong>{{ card.name }}</strong>
                            @if (card.hp) {
                              <small>HP: {{ card.hp }}</small>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Recent Cards -->
                @if (pokemonService.recentCards().length > 0 && !selectedPokemonCard() && pokemonService.searchResults().length === 0) {
                  <div class="recent-cards">
                    <h3>Recent Cards</h3>
                    <div class="recent-grid">
                      @for (card of pokemonService.recentCards(); track card.id) {
                        <button
                          mat-stroked-button
                          class="recent-card"
                          (click)="selectPokemonCard(card)">
                          {{ card.name }}
                          @if (card.hp) {
                            <small>HP: {{ card.hp }}</small>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Stream Overlay Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">airplay</mat-icon>
                Stream Overlay
              </ng-template>

              <div class="tab-content">
                <div class="overlay-settings">
                  <h3>Card Display Settings</h3>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Overlay Position</mat-label>
                    <mat-select [(ngModel)]="overlayPosition">
                      <mat-option value="top-left">Top Left</mat-option>
                      <mat-option value="top-right">Top Right</mat-option>
                      <mat-option value="bottom-left">Bottom Left</mat-option>
                      <mat-option value="bottom-right">Bottom Right</mat-option>
                      <mat-option value="center">Center</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Display Duration (seconds)</mat-label>
                    <input matInput type="number" [(ngModel)]="displayDuration" min="5" max="60">
                  </mat-form-field>

                  <div class="setting-row">
                    <label>Show Card Stats</label>
                    <button
                      mat-icon-button
                      [color]="showStats ? 'primary' : ''"
                      (click)="showStats = !showStats">
                      <mat-icon>{{ showStats ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                    </button>
                  </div>

                  <div class="setting-row">
                    <label>Auto-Hide After Duration</label>
                    <button
                      mat-icon-button
                      [color]="autoHide ? 'primary' : ''"
                      (click)="autoHide = !autoHide">
                      <mat-icon>{{ autoHide ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                    </button>
                  </div>

                  @if (currentStreamCard()) {
                    <mat-divider></mat-divider>

                    <div class="current-display">
                      <h4>Currently Showing on Stream:</h4>
                      <div class="preview">
                        <strong>{{ currentStreamCard()!.name }}</strong>
                        <small>{{ currentStreamCard()!.game }}</small>
                      </div>

                      <button
                        mat-raised-button
                        color="warn"
                        (click)="hideFromStream()">
                        <mat-icon>visibility_off</mat-icon>
                        Hide from Stream
                      </button>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      }
    </mat-card>
  `,
  styles: [`
    .card-overlay {
      max-height: 90vh;
      overflow: auto;
      margin: 1rem;
    }

    mat-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tab-content {
      padding: 1rem 0;
    }

    .full-width {
      width: 100%;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: #666;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .card-display {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      position: relative;
    }

    .pokemon-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      color: white;
    }

    .card-image {
      flex-shrink: 0;
      width: 300px;
    }

    .card-image img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-info h2 {
      margin: 0;
      font-size: 2rem;
    }

    .subtitle {
      margin: -0.5rem 0 0 0;
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .card-stats {
      display: flex;
      gap: 2rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .card-text, .attacks {
      background: rgba(255,255,255,0.1);
      padding: 1rem;
      border-radius: 4px;
    }

    .flavor-text {
      padding: 0.5rem 1rem;
      border-left: 3px solid rgba(255,255,255,0.3);
      opacity: 0.8;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      opacity: 0.7;
      font-size: 0.9rem;
    }

    .card-actions {
      display: flex;
      gap: 1rem;
      margin-top: auto;
    }

    .search-results, .recent-cards {
      margin-top: 2rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .result-card {
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .result-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    .result-card img {
      width: 100%;
      display: block;
    }

    .result-info {
      padding: 0.5rem;
      background: white;
    }

    .result-info strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .result-info small {
      color: #666;
      font-size: 0.85rem;
    }

    .recent-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .recent-card {
      justify-content: flex-start;
      text-align: left;
    }

    .attack {
      margin-bottom: 1rem;
    }

    .attack-name {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .damage {
      font-size: 1.2rem;
      color: #ffeb3b;
    }

    .attack-cost {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .attack-cost mat-chip {
      font-size: 0.75rem;
    }

    .attack-text {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .weaknesses-resistances {
      display: flex;
      gap: 2rem;
    }

    .overlay-settings {
      padding: 1rem;
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .current-display {
      margin-top: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .preview {
      margin: 1rem 0;
      padding: 1rem;
      background: white;
      border-radius: 4px;
    }

    .preview strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    .tab-icon {
      margin-right: 0.5rem;
    }
  `]
})
export class CardOverlayComponent {
  readonly lorcanaService = inject(LorcanaCardService);
  readonly pokemonService = inject(PokemonTcgService);

  readonly minimized = signal(false);
  readonly selectedLorcanaCard = signal<LorcanaCard | null>(null);
  readonly selectedPokemonCard = signal<PokemonCard | null>(null);
  readonly currentStreamCard = signal<{ name: string; game: string } | null>(null);

  lorcanaSearch = '';
  pokemonSearch = '';
  overlayPosition = 'top-right';
  displayDuration = 10;
  showStats = true;
  autoHide = true;

  ngOnInit() {
    this.lorcanaService.initialize();
    this.pokemonService.initialize();
  }

  async searchLorcana() {
    if (this.lorcanaSearch.trim()) {
      await this.lorcanaService.searchByName(this.lorcanaSearch);
    }
  }

  async searchPokemon() {
    if (this.pokemonSearch.trim()) {
      await this.pokemonService.searchByName(this.pokemonSearch);
    }
  }

  selectLorcanaCard(card: LorcanaCard) {
    this.selectedLorcanaCard.set(card);
  }

  selectPokemonCard(card: PokemonCard) {
    this.selectedPokemonCard.set(card);
  }

  async getRandomLorcanaCard() {
    const card = await this.lorcanaService.getRandomCard();
    if (card) {
      this.selectedLorcanaCard.set(card);
    }
  }

  async getRandomPokemonCard() {
    const card = await this.pokemonService.getRandomCard();
    if (card) {
      this.selectedPokemonCard.set(card);
    }
  }

  showOnStream(game: 'lorcana' | 'pokemon', card: LorcanaCard | PokemonCard) {
    this.currentStreamCard.set({
      name: card.name,
      game: game === 'lorcana' ? 'Lorcana' : 'Pokémon TCG'
    });

    console.log(`Showing ${game} card on stream:`, card);
    console.log('Overlay settings:', {
      position: this.overlayPosition,
      duration: this.displayDuration,
      showStats: this.showStats,
      autoHide: this.autoHide
    });

    // In production, this would communicate with the overlay service
    // to actually display the card on the stream

    if (this.autoHide) {
      setTimeout(() => {
        this.hideFromStream();
      }, this.displayDuration * 1000);
    }
  }

  hideFromStream() {
    this.currentStreamCard.set(null);
    console.log('Card hidden from stream');
  }
}
