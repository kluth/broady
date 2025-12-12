import { Injectable, signal, computed } from '@angular/core';

/**
 * Pokemon TCG Service
 * Integration with official Pokemon TCG API
 * API Docs: https://docs.pokemontcg.io/
 */

export interface PokemonCard {
  id: string;
  name: string;
  supertype: 'Pokémon' | 'Trainer' | 'Energy';
  subtypes: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  attacks?: PokemonAttack[];
  weaknesses?: PokemonWeakness[];
  resistances?: PokemonResistance[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: PokemonSet;
  number: string;
  artist?: string;
  rarity: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices?: any;
  };
  cardmarket?: {
    url: string;
    prices?: any;
  };
}

export interface PokemonAttack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

export interface PokemonWeakness {
  type: string;
  value: string;
}

export interface PokemonResistance {
  type: string;
  value: string;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface PokemonSearchParams {
  name?: string;
  types?: string;
  supertype?: string;
  subtypes?: string;
  hp?: string;
  rarity?: string;
  set?: string;
  artist?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonTcgService {
  private readonly API_BASE = 'https://api.pokemontcg.io/v2';
  private readonly API_KEY = ''; // Optional, increases rate limits

  readonly recentCards = signal<PokemonCard[]>([]);
  readonly searchResults = signal<PokemonCard[]>([]);
  readonly selectedCard = signal<PokemonCard | null>(null);
  readonly sets = signal<PokemonSet[]>([]);
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
   * Build fetch headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.API_KEY) {
      headers['X-Api-Key'] = this.API_KEY;
    }

    return headers;
  }

  /**
   * Search cards by name
   */
  async searchByName(name: string): Promise<PokemonCard[]> {
    if (!name || name.trim().length < 2) {
      return [];
    }

    return this.search({ name });
  }

  /**
   * Search cards with advanced filters
   */
  async search(params: PokemonSearchParams): Promise<PokemonCard[]> {
    this.isLoading.set(true);

    try {
      // Build query string using Pokemon TCG API query syntax
      const queryParts: string[] = [];

      if (params.name) {
        queryParts.push(`name:"${params.name}*"`);
      }
      if (params.types) {
        queryParts.push(`types:${params.types}`);
      }
      if (params.supertype) {
        queryParts.push(`supertype:${params.supertype}`);
      }
      if (params.subtypes) {
        queryParts.push(`subtypes:"${params.subtypes}"`);
      }
      if (params.hp) {
        queryParts.push(`hp:${params.hp}`);
      }
      if (params.rarity) {
        queryParts.push(`rarity:"${params.rarity}"`);
      }
      if (params.set) {
        queryParts.push(`set.name:"${params.set}"`);
      }
      if (params.artist) {
        queryParts.push(`artist:"${params.artist}"`);
      }

      const query = queryParts.join(' ');
      const url = `${this.API_BASE}/cards?q=${encodeURIComponent(query)}&pageSize=20`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const cards = data.data || [];

      this.searchResults.set(cards);
      this.isLoading.set(false);

      return cards;
    } catch (error) {
      console.error('Pokemon TCG search failed:', error);
      this.isLoading.set(false);

      // Return mock data for demo
      return this.getMockCards(params.name || '');
    }
  }

  /**
   * Get card by ID
   */
  async getCardById(id: string): Promise<PokemonCard | null> {
    this.isLoading.set(true);

    try {
      const response = await fetch(`${this.API_BASE}/cards/${id}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const card = data.data;

      this.selectedCard.set(card);
      this.addToRecent(card);
      this.isLoading.set(false);

      return card;
    } catch (error) {
      console.error('Failed to fetch Pokemon card:', error);
      this.isLoading.set(false);
      return null;
    }
  }

  /**
   * Get random card
   */
  async getRandomCard(): Promise<PokemonCard | null> {
    try {
      // Pokemon TCG API doesn't have a random endpoint, so we'll get a random page
      const randomPage = Math.floor(Math.random() * 100) + 1;
      const response = await fetch(
        `${this.API_BASE}/cards?page=${randomPage}&pageSize=1`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const card = data.data?.[0];

      if (card) {
        this.selectedCard.set(card);
        this.addToRecent(card);
        return card;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch random Pokemon card:', error);
      return null;
    }
  }

  /**
   * Load available sets
   */
  private async loadSets(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/sets`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.sets.set(data.data || []);
    } catch (error) {
      console.error('Failed to load Pokemon TCG sets:', error);

      // Fallback to known recent sets
      this.sets.set([
        {
          id: 'sv08',
          name: 'Surging Sparks',
          series: 'Scarlet & Violet',
          printedTotal: 191,
          total: 252,
          releaseDate: '2024-11-08',
          updatedAt: '2024-11-08',
          images: { symbol: '', logo: '' }
        },
        {
          id: 'sv07',
          name: 'Stellar Crown',
          series: 'Scarlet & Violet',
          printedTotal: 175,
          total: 245,
          releaseDate: '2024-09-13',
          updatedAt: '2024-09-13',
          images: { symbol: '', logo: '' }
        },
        {
          id: 'sv06',
          name: 'Twilight Masquerade',
          series: 'Scarlet & Violet',
          printedTotal: 167,
          total: 226,
          releaseDate: '2024-05-24',
          updatedAt: '2024-05-24',
          images: { symbol: '', logo: '' }
        }
      ]);
    }
  }

  /**
   * Add card to recent list
   */
  private addToRecent(card: PokemonCard): void {
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
   * Get cards by type
   */
  async getCardsByType(type: string): Promise<PokemonCard[]> {
    return this.search({ types: type });
  }

  /**
   * Get cards by rarity
   */
  async getCardsByRarity(rarity: string): Promise<PokemonCard[]> {
    return this.search({ rarity });
  }

  /**
   * Get cards by set
   */
  async getCardsBySet(setName: string): Promise<PokemonCard[]> {
    return this.search({ set: setName });
  }

  /**
   * Get cards by artist
   */
  async getCardsByArtist(artist: string): Promise<PokemonCard[]> {
    return this.search({ artist });
  }

  /**
   * Mock cards for demo/fallback
   */
  private getMockCards(searchTerm: string): PokemonCard[] {
    const mockCards: PokemonCard[] = [
      {
        id: 'base1-4',
        name: 'Charizard',
        supertype: 'Pokémon',
        subtypes: ['Stage 2'],
        hp: '120',
        types: ['Fire'],
        evolvesFrom: 'Charmeleon',
        attacks: [
          {
            name: 'Fire Spin',
            cost: ['Fire', 'Fire', 'Fire', 'Fire'],
            convertedEnergyCost: 4,
            damage: '100',
            text: 'Discard 2 Energy attached to Charizard in order to use this attack.'
          }
        ],
        weaknesses: [{ type: 'Water', value: '×2' }],
        retreatCost: ['Colorless', 'Colorless', 'Colorless'],
        convertedRetreatCost: 3,
        set: {
          id: 'base1',
          name: 'Base Set',
          series: 'Base',
          printedTotal: 102,
          total: 102,
          releaseDate: '1999-01-09',
          updatedAt: '2020-08-14',
          images: { symbol: '', logo: '' }
        },
        number: '4',
        artist: 'Mitsuhiro Arita',
        rarity: 'Rare Holo',
        nationalPokedexNumbers: [6],
        images: {
          small: 'https://images.pokemontcg.io/base1/4.png',
          large: 'https://images.pokemontcg.io/base1/4_hires.png'
        }
      },
      {
        id: 'base1-58',
        name: 'Pikachu',
        supertype: 'Pokémon',
        subtypes: ['Basic'],
        hp: '40',
        types: ['Lightning'],
        attacks: [
          {
            name: 'Thundershock',
            cost: ['Lightning'],
            convertedEnergyCost: 1,
            damage: '10',
            text: 'Flip a coin. If heads, the Defending Pokémon is now Paralyzed.'
          }
        ],
        weaknesses: [{ type: 'Fighting', value: '×2' }],
        retreatCost: ['Colorless'],
        convertedRetreatCost: 1,
        set: {
          id: 'base1',
          name: 'Base Set',
          series: 'Base',
          printedTotal: 102,
          total: 102,
          releaseDate: '1999-01-09',
          updatedAt: '2020-08-14',
          images: { symbol: '', logo: '' }
        },
        number: '58',
        artist: 'Mitsuhiro Arita',
        rarity: 'Common',
        nationalPokedexNumbers: [25],
        images: {
          small: 'https://images.pokemontcg.io/base1/58.png',
          large: 'https://images.pokemontcg.io/base1/58_hires.png'
        }
      },
      {
        id: 'xy1-1',
        name: 'Venusaur-EX',
        supertype: 'Pokémon',
        subtypes: ['Basic', 'EX'],
        hp: '180',
        types: ['Grass'],
        attacks: [
          {
            name: 'Poison Powder',
            cost: ['Grass', 'Grass', 'Colorless'],
            convertedEnergyCost: 3,
            damage: '60',
            text: 'The Defending Pokémon is now Poisoned.'
          }
        ],
        weaknesses: [{ type: 'Fire', value: '×2' }],
        retreatCost: ['Colorless', 'Colorless', 'Colorless', 'Colorless'],
        convertedRetreatCost: 4,
        set: {
          id: 'xy1',
          name: 'XY',
          series: 'XY',
          printedTotal: 146,
          total: 146,
          releaseDate: '2014-02-05',
          updatedAt: '2020-08-14',
          images: { symbol: '', logo: '' }
        },
        number: '1',
        artist: '5ban Graphics',
        rarity: 'Rare Holo EX',
        nationalPokedexNumbers: [3],
        images: {
          small: 'https://images.pokemontcg.io/xy1/1.png',
          large: 'https://images.pokemontcg.io/xy1/1_hires.png'
        }
      }
    ];

    if (!searchTerm) {
      return mockCards;
    }

    return mockCards.filter(card =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Format card for display
   */
  formatCardForChat(card: PokemonCard): string {
    let text = `🎴 ${card.name}`;
    text += `\n`;
    text += `Type: ${card.supertype}`;
    if (card.types && card.types.length > 0) {
      text += ` (${card.types.join(', ')})`;
    }
    if (card.hp) text += ` | HP: ${card.hp}`;
    text += ` | Rarity: ${card.rarity}\n`;
    text += `Set: ${card.set.name} #${card.number}`;

    if (card.attacks && card.attacks.length > 0) {
      text += `\n\nAttacks:`;
      card.attacks.forEach(attack => {
        text += `\n  ${attack.name} - ${attack.damage}`;
      });
    }

    if (card.flavorText) {
      text += `\n\n"${card.flavorText}"`;
    }

    return text;
  }

  /**
   * Get Pokemon types
   */
  getPokemonTypes(): string[] {
    return [
      'Colorless',
      'Darkness',
      'Dragon',
      'Fairy',
      'Fighting',
      'Fire',
      'Grass',
      'Lightning',
      'Metal',
      'Psychic',
      'Water'
    ];
  }

  /**
   * Get common rarities
   */
  getRarities(): string[] {
    return [
      'Common',
      'Uncommon',
      'Rare',
      'Rare Holo',
      'Rare Holo EX',
      'Rare Holo GX',
      'Rare Holo V',
      'Rare Holo VMAX',
      'Rare Ultra',
      'Rare Secret',
      'Rare Rainbow'
    ];
  }
}
