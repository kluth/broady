import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { AIService, AIProvider, SceneRecommendation, CaptionSegment } from '../../services/ai.service';

@Component({
  selector: 'streaming-ai-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './ai-dashboard.component.html',
  styleUrls: ['./ai-dashboard.component.css']
})
export class AIDashboardComponent {
  // AI provider options
  readonly providers = Object.values(AIProvider);

  // UI state
  private selectedTabSignal = signal<'config' | 'recommendations' | 'captions' | 'enhancement' | 'titles'>('config');
  readonly selectedTab = this.selectedTabSignal.asReadonly();

  // Configuration form
  private selectedProviderSignal = signal<AIProvider>(AIProvider.GEMINI);
  private apiKeySignal = signal<string>('');
  readonly selectedProvider = this.selectedProviderSignal.asReadonly();
  readonly apiKey = this.apiKeySignal.asReadonly();

  // Results
  private recommendationsSignal = signal<SceneRecommendation[]>([]);
  private captionsSignal = signal<CaptionSegment[]>([]);
  private titleSuggestionsSignal = signal<string[]>([]);

  readonly recommendations = this.recommendationsSignal.asReadonly();
  readonly captions = this.captionsSignal.asReadonly();
  readonly titleSuggestions = this.titleSuggestionsSignal.asReadonly();

  // Stream title context
  private gameSignal = signal<string>('');
  private categorySignal = signal<string>('');
  private moodSignal = signal<string>('');

  readonly game = this.gameSignal.asReadonly();
  readonly category = this.categorySignal.asReadonly();
  readonly mood = this.moodSignal.asReadonly();

  readonly isConfigured = computed(() => {
    const config = this.aiService.config();
    return config !== null && config.apiKey.length > 0;
  });

  readonly providerName = computed(() => {
    const provider = this.selectedProvider();
    return {
      [AIProvider.GEMINI]: 'Google Gemini',
      [AIProvider.OPENAI]: 'OpenAI',
      [AIProvider.CLAUDE]: 'Anthropic Claude'
    }[provider];
  });

  constructor(public aiService: AIService) {
    // Load existing config if available
    const config = this.aiService.config();
    if (config) {
      this.selectedProviderSignal.set(config.provider);
      this.apiKeySignal.set(config.apiKey);
    }
  }

  selectTab(tab: 'config' | 'recommendations' | 'captions' | 'enhancement' | 'titles'): void {
    this.selectedTabSignal.set(tab);
  }

  updateProvider(provider: AIProvider): void {
    this.selectedProviderSignal.set(provider);
  }

  updateApiKey(key: string): void {
    this.apiKeySignal.set(key);
  }

  saveConfiguration(): void {
    this.aiService.configure({
      provider: this.selectedProvider(),
      apiKey: this.apiKey()
    });
  }

  async getRecommendations(): Promise<void> {
    try {
      const recs = await this.aiService.getSceneRecommendations({
        currentScenes: [],
        streamType: 'gaming',
        audience: 'general'
      });

      this.recommendationsSignal.set(recs);
      this.selectTab('recommendations');
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
  }

  async generateCaptions(): Promise<void> {
    try {
      // In production, would get actual media blob
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const caps = await this.aiService.generateCaptions(mockBlob);

      this.captionsSignal.set(caps);
      this.selectTab('captions');
    } catch (error) {
      console.error('Failed to generate captions:', error);
    }
  }

  async generateTitles(): Promise<void> {
    try {
      const titles = await this.aiService.generateStreamTitles({
        game: this.game(),
        category: this.category(),
        mood: this.mood()
      });

      this.titleSuggestionsSignal.set(titles);
      this.selectTab('titles');
    } catch (error) {
      console.error('Failed to generate titles:', error);
    }
  }

  updateGame(game: string): void {
    this.gameSignal.set(game);
  }

  updateCategory(category: string): void {
    this.categorySignal.set(category);
  }

  updateMood(mood: string): void {
    this.moodSignal.set(mood);
  }

  copyTitle(title: string): void {
    navigator.clipboard.writeText(title);
    console.log('Title copied to clipboard:', title);
  }

  applyCaptions(): void {
    const caps = this.captions();
    console.log('Applying captions:', caps);
    // In production, would integrate with video player
  }

  implementRecommendation(rec: SceneRecommendation): void {
    console.log('Implementing recommendation:', rec);
    // In production, would create scene with suggested sources
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
