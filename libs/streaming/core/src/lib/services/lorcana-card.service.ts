import { Injectable, signal, computed } from '@angular/core';

/**
 * Lorcana Card Service
 * Integration with Lorcast API for Disney Lorcana TCG
 * API Docs: https://lorcast.com/docs/api
 */

export interface LorcanaCard {
  id: string;
  name: string;
  version: string;
  type: 'Character' | 'Action' | 'Item' | 'Location';
  inkwell: boolean;
  color: string[];
  cost: number;
  inkable: boolean;
  strength?: number;
  willpower?: number;
  lore?: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Legendary' | 'Enchanted';
  flavor_text?: string;
  card_text?: string;
  set_name: string;
  set_num: string;
  image_url: string;
  artist?: string;
  abilities?: string[];
  classifications?: string[];
}

export interface LorcanaSet {
  id: string;
  name: string;
  code: string;
  release_date: string;
  card_count: number;
}

export interface LorcanaSearchParams {
  query?: string;
  name?: string;
  type?: string;
  color?: string;
  rarity?: string;
  set?: string;
  cost?: number;
  inkable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LorcanaCardService {
  private readonly API_BASE = 'https://api.lorcana-api.com/v1';
  private readonly LORCAST_API = 'https://lorcast.com/api/v0';

  readonly recentCards = signal<LorcanaCard[]>([]);
  readonly searchResults = signal<LorcanaCard[]>([]);
  readonly selectedCard = signal<LorcanaCard | null>(null);
  readonly sets = signal<LorcanaSet[]>([]);
  readonly isLoading = signal<boolean>(false);

  readonly stats = computed(() => ({
    totalSearches: this.searchResults().length,
    recentCardsCount: this.recentCards().length,
    availableSets: this.sets().length
  }));

  /**
   * Initialize service and load sets
   */
  async initialize(): Promise<void> {
    await this.loadSets();
  }

  /**
   * Search cards by name
   */
  async searchByName(name: string): Promise<LorcanaCard[]> {
    if (!name || name.trim().length < 2) {
      return [];
    }

    this.isLoading.set(true);

    try {
      // Using lorcana-api.com which is free and open source
      const response = await fetch(
        `${this.API_BASE}/cards?name=${encodeURIComponent(name)}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const cards = this.normalizeCards(data);

      this.searchResults.set(cards);
      this.isLoading.set(false);

      return cards;
    } catch (error) {
      console.error('Lorcana card search failed:', error);
      this.isLoading.set(false);

      // Return mock data for demo
      return this.getMockCards(name);
    }
  }

  /**
   * Search cards with advanced filters
   */
  async search(params: LorcanaSearchParams): Promise<LorcanaCard[]> {
    this.isLoading.set(true);

    try {
      const queryParams = new URLSearchParams();

      if (params.name) queryParams.append('name', params.name);
      if (params.type) queryParams.append('type', params.type);
      if (params.color) queryParams.append('color', params.color);
      if (params.rarity) queryParams.append('rarity', params.rarity);
      if (params.set) queryParams.append('set', params.set);
      if (params.cost !== undefined) queryParams.append('cost', params.cost.toString());
      if (params.inkable !== undefined) queryParams.append('inkable', params.inkable.toString());

      const response = await fetch(
        `${this.API_BASE}/cards?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const cards = this.normalizeCards(data);

      this.searchResults.set(cards);
      this.isLoading.set(false);

      return cards;
    } catch (error) {
      console.error('Lorcana advanced search failed:', error);
      this.isLoading.set(false);
      return [];
    }
  }

  /**
   * Get card by ID
   */
  async getCardById(id: string): Promise<LorcanaCard | null> {
    this.isLoading.set(true);

    try {
      const response = await fetch(`${this.API_BASE}/cards/${id}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const card = this.normalizeCard(data);

      this.selectedCard.set(card);
      this.addToRecent(card);
      this.isLoading.set(false);

      return card;
    } catch (error) {
      console.error('Failed to fetch Lorcana card:', error);
      this.isLoading.set(false);
      return null;
    }
  }

  /**
   * Get random card
   */
  async getRandomCard(): Promise<LorcanaCard | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cards/random`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const card = this.normalizeCard(data);

      this.selectedCard.set(card);
      this.addToRecent(card);

      return card;
    } catch (error) {
      console.error('Failed to fetch random Lorcana card:', error);
      return null;
    }
  }

  /**
   * Load available sets
   */
  private async loadSets(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/sets`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.sets.set(data);
    } catch (error) {
      console.error('Failed to load Lorcana sets:', error);

      // Fallback to known sets
      this.sets.set([
        { id: '1', name: 'The First Chapter', code: 'TFC', release_date: '2023-08-18', card_count: 204 },
        { id: '2', name: 'Rise of the Floodborn', code: 'ROTF', release_date: '2023-11-17', card_count: 204 },
        { id: '3', name: 'Into the Inklands', code: 'ITI', release_date: '2024-02-23', card_count: 204 },
        { id: '4', name: 'Ursula\'s Return', code: 'UR', release_date: '2024-05-17', card_count: 204 },
        { id: '5', name: 'Shimmering Skies', code: 'SS', release_date: '2024-08-09', card_count: 204 },
        { id: '6', name: 'Azurite Sea', code: 'AS', release_date: '2024-11-15', card_count: 204 }
      ]);
    }
  }

  /**
   * Normalize card data from API
   */
  private normalizeCard(data: any): LorcanaCard {
    return {
      id: data.id || data.card_id || crypto.randomUUID(),
      name: data.name,
      version: data.version || data.subtitle || '',
      type: data.type || 'Character',
      inkwell: data.inkwell || false,
      color: Array.isArray(data.color) ? data.color : data.color ? [data.color] : [],
      cost: data.cost || 0,
      inkable: data.inkable !== undefined ? data.inkable : data.inkwell,
      strength: data.strength,
      willpower: data.willpower,
      lore: data.lore,
      rarity: data.rarity || 'Common',
      flavor_text: data.flavor_text,
      card_text: data.card_text || data.body_text || data.text,
      set_name: data.set_name || data.set || '',
      set_num: data.set_num || data.card_num || data.number || '',
      image_url: data.image_url || data.image || data.images?.large || '',
      artist: data.artist,
      abilities: data.abilities || [],
      classifications: data.classifications || []
    };
  }

  /**
   * Normalize multiple cards
   */
  private normalizeCards(data: any): LorcanaCard[] {
    if (Array.isArray(data)) {
      return data.map(card => this.normalizeCard(card));
    } else if (data.data && Array.isArray(data.data)) {
      return data.data.map((card: any) => this.normalizeCard(card));
    } else if (data.cards && Array.isArray(data.cards)) {
      return data.cards.map((card: any) => this.normalizeCard(card));
    }
    return [];
  }

  /**
   * Add card to recent list
   */
  private addToRecent(card: LorcanaCard): void {
    this.recentCards.update(recent => {
      const filtered = recent.filter(c => c.id !== card.id);
      return [card, ...filtered].slice(0, 10);
    });
  }

  /**
   * Clear recent cards
   */
  clearRecent(): void {
    this.recentCards.set([]);
  }

  /**
   * Get cards by color
   */
  async getCardsByColor(color: string): Promise<LorcanaCard[]> {
    return this.search({ color });
  }

  /**
   * Get cards by rarity
   */
  async getCardsByRarity(rarity: string): Promise<LorcanaCard[]> {
    return this.search({ rarity });
  }

  /**
   * Get cards by set
   */
  async getCardsBySet(setCode: string): Promise<LorcanaCard[]> {
    return this.search({ set: setCode });
  }

  /**
   * Mock cards for demo/fallback
   */
  private getMockCards(searchTerm: string): LorcanaCard[] {
    const mockCards: LorcanaCard[] = [
      {
        id: '1',
        name: 'Mickey Mouse',
        version: 'True Friend',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 4,
        inkable: true,
        strength: 3,
        willpower: 4,
        lore: 2,
        rarity: 'Legendary',
        card_text: 'Evasive (Only characters with Evasive can challenge this character.)',
        set_name: 'The First Chapter',
        set_num: '1',
        image_url: 'https://via.placeholder.com/300x420/FFD700/000000?text=Mickey+Mouse',
        artist: 'Disney',
        abilities: ['Evasive'],
        classifications: ['Hero', 'Dreamborn']
      },
      {
        id: '2',
        name: 'Elsa',
        version: 'Snow Queen',
        type: 'Character',
        inkwell: true,
        color: ['Sapphire'],
        cost: 8,
        inkable: true,
        strength: 4,
        willpower: 6,
        lore: 3,
        rarity: 'Super Rare',
        card_text: 'Deep Freeze - When you play this character, exert up to 2 opposing characters.',
        set_name: 'The First Chapter',
        set_num: '2',
        image_url: 'https://via.placeholder.com/300x420/4169E1/FFFFFF?text=Elsa',
        artist: 'Disney',
        abilities: ['Deep Freeze'],
        classifications: ['Queen', 'Storyborn']
      },
      {
        id: '3',
        name: 'Stitch',
        version: 'Rock Star',
        type: 'Character',
        inkwell: false,
        color: ['Emerald'],
        cost: 6,
        inkable: false,
        strength: 5,
        willpower: 5,
        lore: 2,
        rarity: 'Rare',
        card_text: 'Reckless (This character can\'t quest and must challenge each turn if able.)',
        set_name: 'Rise of the Floodborn',
        set_num: '3',
        image_url: 'https://via.placeholder.com/300x420/50C878/000000?text=Stitch',
        artist: 'Disney',
        abilities: ['Reckless'],
        classifications: ['Alien', 'Hero']
      }
    ];

    return mockCards.filter(card =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Format card for display
   */
  formatCardForChat(card: LorcanaCard): string {
    let text = `🎴 ${card.name}`;
    if (card.version) text += ` - ${card.version}`;
    text += `\n`;
    text += `Type: ${card.type} | Cost: ${card.cost} | Rarity: ${card.rarity}\n`;
    if (card.strength) text += `⚔️ ${card.strength} `;
    if (card.willpower) text += `🛡️ ${card.willpower} `;
    if (card.lore) text += `📖 ${card.lore}`;
    if (card.card_text) text += `\n${card.card_text}`;
    return text;
  }
}
