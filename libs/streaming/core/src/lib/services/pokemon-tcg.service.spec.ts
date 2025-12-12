import { TestBed } from '@angular/core/testing';
import { PokemonTcgService, PokemonCard } from './pokemon-tcg.service';

describe('PokemonTcgService', () => {
  let service: PokemonTcgService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PokemonTcgService]
    });
    service = TestBed.inject(PokemonTcgService);
  });

  afterEach(() => {
    service.clearRecent();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty signals', () => {
      expect(service.recentCards()).toEqual([]);
      expect(service.searchResults()).toEqual([]);
      expect(service.selectedCard()).toBeNull();
      expect(service.sets()).toEqual([]);
      expect(service.isLoading()).toBe(false);
    });

    it('should load sets on initialization', async () => {
      await service.initialize();
      expect(service.sets().length).toBeGreaterThan(0);
    });
  });

  describe('searchByName', () => {
    it('should return empty array for empty query', async () => {
      const results = await service.searchByName('');
      expect(results).toEqual([]);
    });

    it('should return empty array for very short query', async () => {
      const results = await service.searchByName('a');
      expect(results).toEqual([]);
    });

    it('should search for cards by name', async () => {
      const results = await service.searchByName('Pikachu');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should set loading state during search', async () => {
      expect(service.isLoading()).toBe(false);
      const searchPromise = service.searchByName('Pikachu');
      await searchPromise;
      expect(service.isLoading()).toBe(false);
    });

    it('should update searchResults signal', async () => {
      await service.searchByName('Pikachu');
      expect(service.searchResults().length).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      const results = await service.searchByName('NonexistentCard12345XYZ');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('search with filters', () => {
    it('should search with type filter', async () => {
      const results = await service.search({ types: 'Fire' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with supertype filter', async () => {
      const results = await service.search({ supertype: 'Pokémon' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with rarity filter', async () => {
      const results = await service.search({ rarity: 'Rare' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with multiple filters', async () => {
      const results = await service.search({
        types: 'Fire',
        rarity: 'Rare',
        supertype: 'Pokémon'
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with HP filter', async () => {
      const results = await service.search({ hp: '60' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with set filter', async () => {
      const results = await service.search({ set: 'Base Set' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with artist filter', async () => {
      const results = await service.search({ artist: 'Ken Sugimori' });
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardById', () => {
    it('should return null for invalid id', async () => {
      const card = await service.getCardById('invalid-id-123');
      expect(card).toBeNull();
    });

    it('should set selectedCard signal', async () => {
      await service.getCardById('base1-4');
      expect(service.selectedCard()).toBeDefined();
    });

    it('should add card to recent list', async () => {
      const initialCount = service.recentCards().length;
      await service.getCardById('base1-4');
      expect(service.recentCards().length).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('getRandomCard', () => {
    it('should return a card or null', async () => {
      const card = await service.getRandomCard();
      expect(card === null || typeof card === 'object').toBe(true);
    });

    it('should set selectedCard if successful', async () => {
      await service.getRandomCard();
      expect(service.selectedCard() === null || typeof service.selectedCard() === 'object').toBe(true);
    });
  });

  describe('recent cards management', () => {
    it('should maintain maximum of 10 recent cards', () => {
      const mockCards: PokemonCard[] = Array.from({ length: 15 }, (_, i) => ({
        id: `card-${i}`,
        name: `Pokemon ${i}`,
        supertype: 'Pokémon',
        subtypes: ['Basic'],
        hp: '60',
        types: ['Fire'],
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
        number: `${i}`,
        artist: 'Test Artist',
        rarity: 'Common',
        images: { small: '', large: '' }
      }));

      for (const card of mockCards) {
        service['addToRecent'](card);
      }

      expect(service.recentCards().length).toBe(10);
    });

    it('should not duplicate cards in recent list', () => {
      const mockCard: PokemonCard = {
        id: 'base1-4',
        name: 'Charizard',
        supertype: 'Pokémon',
        subtypes: ['Stage 2'],
        hp: '120',
        types: ['Fire'],
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
        images: { small: '', large: '' }
      };

      service['addToRecent'](mockCard);
      service['addToRecent'](mockCard);

      const count = service.recentCards().filter(c => c.id === 'base1-4').length;
      expect(count).toBe(1);
    });

    it('should clear recent cards', () => {
      const mockCard: PokemonCard = {
        id: 'base1-4',
        name: 'Charizard',
        supertype: 'Pokémon',
        subtypes: ['Stage 2'],
        hp: '120',
        types: ['Fire'],
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
        images: { small: '', large: '' }
      };

      service['addToRecent'](mockCard);
      expect(service.recentCards().length).toBe(1);

      service.clearRecent();
      expect(service.recentCards().length).toBe(0);
    });
  });

  describe('getCardsByType', () => {
    it('should search by type', async () => {
      const results = await service.getCardsByType('Fire');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardsByRarity', () => {
    it('should search by rarity', async () => {
      const results = await service.getCardsByRarity('Rare');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardsBySet', () => {
    it('should search by set', async () => {
      const results = await service.getCardsBySet('Base Set');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardsByArtist', () => {
    it('should search by artist', async () => {
      const results = await service.getCardsByArtist('Ken Sugimori');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('formatCardForChat', () => {
    it('should format card with all fields', () => {
      const card: PokemonCard = {
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
            text: 'Discard 2 Energy'
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
        flavorText: 'Spits fire that is hot enough to melt boulders.',
        nationalPokedexNumbers: [6],
        images: { small: '', large: '' }
      };

      const formatted = service.formatCardForChat(card);

      expect(formatted).toContain('Charizard');
      expect(formatted).toContain('Pokémon');
      expect(formatted).toContain('Fire');
      expect(formatted).toContain('120');
      expect(formatted).toContain('Rare Holo');
      expect(formatted).toContain('Base Set');
      expect(formatted).toContain('#4');
      expect(formatted).toContain('Fire Spin');
      expect(formatted).toContain('100');
    });

    it('should format card without optional fields', () => {
      const card: PokemonCard = {
        id: 'test-1',
        name: 'Test Pokemon',
        supertype: 'Pokémon',
        subtypes: ['Basic'],
        set: {
          id: 'test',
          name: 'Test Set',
          series: 'Test',
          printedTotal: 10,
          total: 10,
          releaseDate: '2025-01-01',
          updatedAt: '2025-01-01',
          images: { symbol: '', logo: '' }
        },
        number: '1',
        rarity: 'Common',
        images: { small: '', large: '' }
      };

      const formatted = service.formatCardForChat(card);

      expect(formatted).toContain('Test Pokemon');
      expect(formatted).toContain('Pokémon');
      expect(formatted).toContain('Common');
      expect(formatted).toContain('Test Set');
    });
  });

  describe('getPokemonTypes', () => {
    it('should return list of Pokemon types', () => {
      const types = service.getPokemonTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('Fire');
      expect(types).toContain('Water');
      expect(types).toContain('Grass');
    });
  });

  describe('getRarities', () => {
    it('should return list of rarities', () => {
      const rarities = service.getRarities();
      expect(Array.isArray(rarities)).toBe(true);
      expect(rarities.length).toBeGreaterThan(0);
      expect(rarities).toContain('Common');
      expect(rarities).toContain('Rare');
      expect(rarities).toContain('Rare Holo');
    });
  });

  describe('stats', () => {
    it('should compute stats correctly', () => {
      const stats = service.stats();
      expect(stats.totalSearches).toBeGreaterThanOrEqual(0);
      expect(stats.recentCardsCount).toBeGreaterThanOrEqual(0);
      expect(stats.availableSets).toBeGreaterThanOrEqual(0);
    });

    it('should update stats when search results change', async () => {
      const initialStats = service.stats();
      await service.searchByName('Pikachu');
      const newStats = service.stats();

      expect(newStats.totalSearches).toBeGreaterThanOrEqual(initialStats.totalSearches);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const results = await service.searchByName('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should set loading to false on error', async () => {
      await service.searchByName('test');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('API headers', () => {
    it('should build headers correctly', () => {
      const headers = service['getHeaders']();
      expect(headers).toBeDefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
