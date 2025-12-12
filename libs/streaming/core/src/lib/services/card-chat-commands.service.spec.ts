import { TestBed } from '@angular/core/testing';
import { CardChatCommandsService } from './card-chat-commands.service';
import { LorcanaCardService } from './lorcana-card.service';
import { PokemonTcgService } from './pokemon-tcg.service';

describe('CardChatCommandsService', () => {
  let service: CardChatCommandsService;
  let lorcanaService: jasmine.SpyObj<LorcanaCardService>;
  let pokemonService: jasmine.SpyObj<PokemonTcgService>;

  beforeEach(() => {
    const lorcanaSpyObj = jasmine.createSpyObj('LorcanaCardService', [
      'searchByName',
      'getRandomCard',
      'formatCardForChat'
    ]);
    const pokemonSpyObj = jasmine.createSpyObj('PokemonTcgService', [
      'searchByName',
      'getRandomCard',
      'formatCardForChat'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CardChatCommandsService,
        { provide: LorcanaCardService, useValue: lorcanaSpyObj },
        { provide: PokemonTcgService, useValue: pokemonSpyObj }
      ]
    });

    service = TestBed.inject(CardChatCommandsService);
    lorcanaService = TestBed.inject(LorcanaCardService) as jasmine.SpyObj<LorcanaCardService>;
    pokemonService = TestBed.inject(PokemonTcgService) as jasmine.SpyObj<PokemonTcgService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty signals', () => {
      expect(service.commandHistory()).toEqual([]);
      expect(service.lastCardShown()).toBeNull();
    });

    it('should register all commands', () => {
      const commands = service.getAvailableCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some(c => c.command === '!lorcana')).toBe(true);
      expect(commands.some(c => c.command === '!pokemon')).toBe(true);
      expect(commands.some(c => c.command === '!randomlorcana')).toBe(true);
      expect(commands.some(c => c.command === '!randompokemon')).toBe(true);
      expect(commands.some(c => c.command === '!cardhelp')).toBe(true);
    });
  });

  describe('processMessage', () => {
    it('should return null for non-command messages', async () => {
      const result = await service.processMessage('hello world', 'testuser');
      expect(result).toBeNull();
    });

    it('should return null for messages without prefix', async () => {
      const result = await service.processMessage('lorcana test', 'testuser');
      expect(result).toBeNull();
    });

    it('should handle !lorcana command', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([
        {
          id: '1',
          name: 'Test Card',
          version: '',
          type: 'Character',
          inkwell: true,
          color: ['Amber'],
          cost: 1,
          inkable: true,
          rarity: 'Common',
          set_name: 'Test',
          set_num: '1',
          image_url: ''
        }
      ]));
      lorcanaService.formatCardForChat.and.returnValue('Test Card Info');

      const result = await service.processMessage('!lorcana test', 'testuser');

      expect(lorcanaService.searchByName).toHaveBeenCalledWith('test');
      expect(result).toContain('Test Card Info');
    });

    it('should handle !pokemon command', async () => {
      pokemonService.searchByName.and.returnValue(Promise.resolve([
        {
          id: '1',
          name: 'Test Pokemon',
          supertype: 'Pokémon',
          subtypes: [],
          set: {
            id: 'test',
            name: 'Test',
            series: 'Test',
            printedTotal: 1,
            total: 1,
            releaseDate: '2025-01-01',
            updatedAt: '2025-01-01',
            images: { symbol: '', logo: '' }
          },
          number: '1',
          rarity: 'Common',
          images: { small: '', large: '' }
        }
      ]));
      pokemonService.formatCardForChat.and.returnValue('Test Pokemon Info');

      const result = await service.processMessage('!pokemon test', 'testuser');

      expect(pokemonService.searchByName).toHaveBeenCalledWith('test');
      expect(result).toContain('Test Pokemon Info');
    });

    it('should handle !lorcana without arguments', async () => {
      const result = await service.processMessage('!lorcana', 'testuser');
      expect(result).toContain('Usage:');
    });

    it('should handle !pokemon without arguments', async () => {
      const result = await service.processMessage('!pokemon', 'testuser');
      expect(result).toContain('Usage:');
    });

    it('should handle card not found', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([]));

      const result = await service.processMessage('!lorcana nonexistent', 'testuser');

      expect(result).toContain('No Lorcana cards found');
    });
  });

  describe('random card commands', () => {
    it('should handle !randomlorcana', async () => {
      lorcanaService.getRandomCard.and.returnValue(Promise.resolve({
        id: '1',
        name: 'Random Card',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }));
      lorcanaService.formatCardForChat.and.returnValue('Random Card Info');

      const result = await service.processMessage('!randomlorcana', 'testuser');

      expect(lorcanaService.getRandomCard).toHaveBeenCalled();
      expect(result).toContain('Random Lorcana Card');
    });

    it('should handle !randompokemon', async () => {
      pokemonService.getRandomCard.and.returnValue(Promise.resolve({
        id: '1',
        name: 'Random Pokemon',
        supertype: 'Pokémon',
        subtypes: [],
        set: {
          id: 'test',
          name: 'Test',
          series: 'Test',
          printedTotal: 1,
          total: 1,
          releaseDate: '2025-01-01',
          updatedAt: '2025-01-01',
          images: { symbol: '', logo: '' }
        },
        number: '1',
        rarity: 'Common',
        images: { small: '', large: '' }
      }));
      pokemonService.formatCardForChat.and.returnValue('Random Pokemon Info');

      const result = await service.processMessage('!randompokemon', 'testuser');

      expect(pokemonService.getRandomCard).toHaveBeenCalled();
      expect(result).toContain('Random Pokémon Card');
    });

    it('should handle random card failure', async () => {
      lorcanaService.getRandomCard.and.returnValue(Promise.resolve(null));

      const result = await service.processMessage('!randomlorcana', 'testuser');

      expect(result).toContain('Failed to get');
    });
  });

  describe('help command', () => {
    it('should handle !cardhelp', async () => {
      const result = await service.processMessage('!cardhelp', 'testuser');

      expect(result).toContain('Available Card Commands');
      expect(result).toContain('!lorcana');
      expect(result).toContain('!pokemon');
      expect(result).toContain('!randomlorcana');
      expect(result).toContain('!randompokemon');
    });
  });

  describe('command history', () => {
    it('should track command usage', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([
        {
          id: '1',
          name: 'Test',
          version: '',
          type: 'Character',
          inkwell: true,
          color: ['Amber'],
          cost: 1,
          inkable: true,
          rarity: 'Common',
          set_name: 'Test',
          set_num: '1',
          image_url: ''
        }
      ]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      await service.processMessage('!lorcana test', 'user1');

      expect(service.commandHistory().length).toBe(1);
      expect(service.commandHistory()[0].username).toBe('user1');
      expect(service.commandHistory()[0].command).toBe('!lorcana');
    });

    it('should limit history to 100 entries', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([{
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      for (let i = 0; i < 150; i++) {
        await service.processMessage('!lorcana test', `user${i}`);
      }

      expect(service.commandHistory().length).toBe(100);
    });

    it('should clear history', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([{
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      await service.processMessage('!lorcana test', 'user1');
      expect(service.commandHistory().length).toBe(1);

      service.clearHistory();
      expect(service.commandHistory().length).toBe(0);
    });
  });

  describe('lastCardShown', () => {
    it('should track last card shown', async () => {
      const mockCard = {
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      };

      lorcanaService.searchByName.and.returnValue(Promise.resolve([mockCard]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      await service.processMessage('!lorcana test', 'user1');

      const lastShown = service.lastCardShown();
      expect(lastShown).not.toBeNull();
      expect(lastShown?.game).toBe('lorcana');
    });
  });

  describe('isCardCommand', () => {
    it('should identify card commands', () => {
      expect(service.isCardCommand('!lorcana test')).toBe(true);
      expect(service.isCardCommand('!pokemon test')).toBe(true);
      expect(service.isCardCommand('!randomlorcana')).toBe(true);
      expect(service.isCardCommand('!randompokemon')).toBe(true);
      expect(service.isCardCommand('!cardhelp')).toBe(true);
    });

    it('should not identify non-card commands', () => {
      expect(service.isCardCommand('!uptime')).toBe(false);
      expect(service.isCardCommand('hello')).toBe(false);
      expect(service.isCardCommand('!other')).toBe(false);
    });
  });

  describe('getCommandStats', () => {
    it('should return statistics', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([{
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      await service.processMessage('!lorcana test1', 'user1');
      await service.processMessage('!lorcana test2', 'user2');

      const stats = service.getCommandStats();

      expect(stats.totalCommands).toBe(2);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.lorcanaLookups).toBe(2);
    });
  });

  describe('getUserHistory', () => {
    it('should return user-specific history', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([{
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      await service.processMessage('!lorcana test', 'user1');
      await service.processMessage('!lorcana test', 'user2');

      const user1History = service.getUserHistory('user1');

      expect(user1History.length).toBe(1);
      expect(user1History[0].username).toBe('user1');
    });
  });

  describe('handleChatMessage', () => {
    it('should identify card commands', async () => {
      lorcanaService.searchByName.and.returnValue(Promise.resolve([{
        id: '1',
        name: 'Test',
        version: '',
        type: 'Character',
        inkwell: true,
        color: ['Amber'],
        cost: 1,
        inkable: true,
        rarity: 'Common',
        set_name: 'Test',
        set_num: '1',
        image_url: ''
      }]));
      lorcanaService.formatCardForChat.and.returnValue('Test');

      const result = await service.handleChatMessage('!lorcana test', 'user1');

      expect(result.isCardCommand).toBe(true);
      expect(result.response).toBeDefined();
    });

    it('should identify non-card commands', async () => {
      const result = await service.handleChatMessage('!uptime', 'user1');

      expect(result.isCardCommand).toBe(false);
      expect(result.response).toBeUndefined();
    });
  });
});
