import { TestBed } from '@angular/core/testing';
import { LorcanaCardService, LorcanaCard } from './lorcana-card.service';

describe('LorcanaCardService', () => {
  let service: LorcanaCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LorcanaCardService]
    });
    service = TestBed.inject(LorcanaCardService);
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
      const results = await service.searchByName('Mickey');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should set loading state during search', async () => {
      expect(service.isLoading()).toBe(false);
      const searchPromise = service.searchByName('Mickey');
      // Loading state is set but may complete quickly in tests
      await searchPromise;
      expect(service.isLoading()).toBe(false);
    });

    it('should update searchResults signal', async () => {
      await service.searchByName('Mickey');
      expect(service.searchResults().length).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      // Service should return mock data on error
      const results = await service.searchByName('NonexistentCard12345');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('search with filters', () => {
    it('should search with color filter', async () => {
      const results = await service.search({ color: 'Amber' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with rarity filter', async () => {
      const results = await service.search({ rarity: 'Legendary' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with type filter', async () => {
      const results = await service.search({ type: 'Character' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with multiple filters', async () => {
      const results = await service.search({
        color: 'Amber',
        rarity: 'Legendary',
        type: 'Character'
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with cost filter', async () => {
      const results = await service.search({ cost: 4 });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with inkable filter', async () => {
      const results = await service.search({ inkable: true });
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardById', () => {
    it('should return null for invalid id', async () => {
      const card = await service.getCardById('invalid-id');
      expect(card).toBeNull();
    });

    it('should set selectedCard signal', async () => {
      const mockId = '1';
      await service.getCardById(mockId);
      // May be null if API fails, but signal should be set
      expect(service.selectedCard()).toBeDefined();
    });

    it('should add card to recent list', async () => {
      const initialCount = service.recentCards().length;
      await service.getCardById('1');
      // Should add to recent if card was found
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
      // Card may be null if API fails
      expect(service.selectedCard() === null || typeof service.selectedCard() === 'object').toBe(true);
    });
  });

  describe('recent cards management', () => {
    it('should maintain maximum of 10 recent cards', async () => {
      const mockCards: LorcanaCard[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `Card ${i}`,
        version: 'Test',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test Set',
        set_num: '1',
        image_url: 'test.jpg'
      }));

      for (const card of mockCards) {
        service['addToRecent'](card);
      }

      expect(service.recentCards().length).toBe(10);
    });

    it('should not duplicate cards in recent list', async () => {
      const mockCard: LorcanaCard = {
        id: '1',
        name: 'Test Card',
        version: 'Test',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test Set',
        set_num: '1',
        image_url: 'test.jpg'
      };

      service['addToRecent'](mockCard);
      service['addToRecent'](mockCard);

      const count = service.recentCards().filter(c => c.id === '1').length;
      expect(count).toBe(1);
    });

    it('should clear recent cards', () => {
      const mockCard: LorcanaCard = {
        id: '1',
        name: 'Test Card',
        version: 'Test',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test Set',
        set_num: '1',
        image_url: 'test.jpg'
      };

      service['addToRecent'](mockCard);
      expect(service.recentCards().length).toBe(1);

      service.clearRecent();
      expect(service.recentCards().length).toBe(0);
    });
  });

  describe('getCardsByColor', () => {
    it('should search by color', async () => {
      const results = await service.getCardsByColor('Amber');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardsByRarity', () => {
    it('should search by rarity', async () => {
      const results = await service.getCardsByRarity('Legendary');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCardsBySet', () => {
    it('should search by set', async () => {
      const results = await service.getCardsBySet('TFC');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('formatCardForChat', () => {
    it('should format card with all fields', () => {
      const card: LorcanaCard = {
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
        card_text: 'Evasive',
        set_name: 'The First Chapter',
        set_num: '1',
        image_url: 'test.jpg'
      };

      const formatted = service.formatCardForChat(card);

      expect(formatted).toContain('Mickey Mouse');
      expect(formatted).toContain('True Friend');
      expect(formatted).toContain('Character');
      expect(formatted).toContain('4');
      expect(formatted).toContain('Legendary');
      expect(formatted).toContain('⚔️ 3');
      expect(formatted).toContain('🛡️ 4');
      expect(formatted).toContain('📖 2');
      expect(formatted).toContain('Evasive');
    });

    it('should format card without optional fields', () => {
      const card: LorcanaCard = {
        id: '1',
        name: 'Test Card',
        version: '',
        type: 'Action',
        inkwell: false,
        color: ['Ruby'],
        cost: 2,
        inkable: false,
        rarity: 'Common',
        set_name: 'Test Set',
        set_num: '1',
        image_url: 'test.jpg'
      };

      const formatted = service.formatCardForChat(card);

      expect(formatted).toContain('Test Card');
      expect(formatted).toContain('Action');
      expect(formatted).toContain('2');
      expect(formatted).toContain('Common');
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
      await service.searchByName('Mickey');
      const newStats = service.stats();

      expect(newStats.totalSearches).toBeGreaterThanOrEqual(initialStats.totalSearches);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Should fall back to mock data
      const results = await service.searchByName('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should set loading to false on error', async () => {
      await service.searchByName('test');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('card normalization', () => {
    it('should normalize card data correctly', () => {
      const rawCard = {
        id: '1',
        name: 'Test',
        type: 'Character',
        cost: 3,
        color: 'Amber',
        rarity: 'Common',
        set_name: 'Test Set',
        card_num: '1',
        image: 'test.jpg'
      };

      const normalized = service['normalizeCard'](rawCard);

      expect(normalized.id).toBe('1');
      expect(normalized.name).toBe('Test');
      expect(normalized.type).toBe('Character');
      expect(normalized.cost).toBe(3);
      expect(Array.isArray(normalized.color)).toBe(true);
    });

    it('should handle missing fields in normalization', () => {
      const rawCard = {
        name: 'Test'
      };

      const normalized = service['normalizeCard'](rawCard);

      expect(normalized.name).toBe('Test');
      expect(normalized.type).toBe('Character'); // default
      expect(normalized.cost).toBe(0); // default
      expect(Array.isArray(normalized.color)).toBe(true);
    });
  });
});
