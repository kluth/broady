import { TestBed } from '@angular/core/testing';
import { StreamChatbotService, ChatCommand } from './stream-chatbot.service';
import { StreamingService } from './streaming.service';
import { GameDetectionService } from './game-detection.service';
import { ViewerEngagementService } from './viewer-engagement.service';
import { DonationsService } from './donations.service';
import { CardChatCommandsService } from './card-chat-commands.service';

describe('StreamChatbotService', () => {
  let service: StreamChatbotService;
  let streamingService: jasmine.SpyObj<StreamingService>;
  let gameDetectionService: jasmine.SpyObj<GameDetectionService>;
  let viewerEngagementService: jasmine.SpyObj<ViewerEngagementService>;
  let donationsService: jasmine.SpyObj<DonationsService>;
  let cardCommandsService: jasmine.SpyObj<CardChatCommandsService>;

  beforeEach(() => {
    const streamingSpy = jasmine.createSpyObj('StreamingService', [], { status: { subscribe: jasmine.createSpy() } });
    const gameDetectionSpy = jasmine.createSpyObj('GameDetectionService', [], { currentGame: jasmine.createSpy().and.returnValue({ name: 'Test Game' }) });
    const viewerEngagementSpy = jasmine.createSpyObj('ViewerEngagementService', [], { analytics: jasmine.createSpy().and.returnValue({ currentViewers: 10, totalFollowers: 100 }) });
    const donationsSpy = jasmine.createSpyObj('DonationsService', []);
    const cardCommandsSpy = jasmine.createSpyObj('CardChatCommandsService', ['handleChatMessage']);

    TestBed.configureTestingModule({
      providers: [
        StreamChatbotService,
        { provide: StreamingService, useValue: streamingSpy },
        { provide: GameDetectionService, useValue: gameDetectionSpy },
        { provide: ViewerEngagementService, useValue: viewerEngagementSpy },
        { provide: DonationsService, useValue: donationsSpy },
        { provide: CardChatCommandsService, useValue: cardCommandsSpy }
      ]
    });

    service = TestBed.inject(StreamChatbotService);
    streamingService = TestBed.inject(StreamingService) as jasmine.SpyObj<StreamingService>;
    gameDetectionService = TestBed.inject(GameDetectionService) as jasmine.SpyObj<GameDetectionService>;
    viewerEngagementService = TestBed.inject(ViewerEngagementService) as jasmine.SpyObj<ViewerEngagementService>;
    donationsService = TestBed.inject(DonationsService) as jasmine.SpyObj<DonationsService>;
    cardCommandsService = TestBed.inject(CardChatCommandsService) as jasmine.SpyObj<CardChatCommandsService>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = service.config();
      expect(config.enabled).toBe(true);
      expect(config.prefix).toBe('!');
      expect(config.autoGreetNewFollowers).toBe(true);
      expect(config.autoThankSubscribers).toBe(true);
      expect(config.autoThankDonations).toBe(true);
    });

    it('should initialize built-in commands', () => {
      const commands = service.commands();
      expect(commands.length).toBeGreaterThan(15);
      expect(commands.some(c => c.trigger === 'uptime')).toBe(true);
      expect(commands.some(c => c.trigger === 'stats')).toBe(true);
      expect(commands.some(c => c.trigger === 'game')).toBe(true);
    });

    it('should load saved config from localStorage', () => {
      const customConfig = {
        enabled: false,
        prefix: '$',
        respondToMentions: false,
        globalCooldown: 5,
        autoGreetNewFollowers: false,
        autoThankSubscribers: false,
        autoThankDonations: false,
        greetingMessage: 'Custom greeting',
        subscriptionMessage: 'Custom sub',
        donationMessage: 'Custom donation'
      };

      localStorage.setItem('chatbot_config', JSON.stringify(customConfig));

      // Create new instance to load config
      const newService = new StreamChatbotService(
        streamingService as any,
        gameDetectionService as any,
        viewerEngagementService as any,
        donationsService as any,
        cardCommandsService as any
      );

      expect(newService.config().enabled).toBe(false);
      expect(newService.config().prefix).toBe('$');
    });
  });

  describe('processMessage', () => {
    beforeEach(() => {
      cardCommandsService.handleChatMessage.and.returnValue(Promise.resolve({ isCardCommand: false }));
    });

    it('should return null if bot is disabled', async () => {
      service.updateConfig({ enabled: false });
      const result = await service.processMessage('!uptime', 'user1');
      expect(result).toBeNull();
    });

    it('should return null for non-command messages', async () => {
      const result = await service.processMessage('hello world', 'user1');
      expect(result).toBeNull();
    });

    it('should delegate to card commands first', async () => {
      cardCommandsService.handleChatMessage.and.returnValue(Promise.resolve({
        isCardCommand: true,
        response: 'Card response'
      }));

      const result = await service.processMessage('!lorcana test', 'user1');

      expect(cardCommandsService.handleChatMessage).toHaveBeenCalled();
      expect(result).toBe('Card response');
    });

    it('should process !uptime command', async () => {
      const result = await service.processMessage('!uptime', 'user1');
      expect(result).toBeDefined();
      expect(result).toContain('uptime');
    });

    it('should process commands with custom prefix', async () => {
      service.updateConfig({ prefix: '$' });
      const result = await service.processMessage('$uptime', 'user1');
      expect(result).toBeDefined();
    });

    it('should handle commands with aliases', async () => {
      const result = await service.processMessage('!time', 'user1');
      expect(result).toBeDefined();
    });

    it('should check permissions', async () => {
      const result = await service.processMessage('!shoutout testuser', 'viewer', 'everyone');
      expect(result).toContain('don\'t have permission');
    });

    it('should allow moderator commands for moderators', async () => {
      const result = await service.processMessage('!shoutout testuser', 'mod', 'moderator');
      expect(result).not.toContain('don\'t have permission');
    });

    it('should enforce cooldowns', async () => {
      await service.processMessage('!uptime', 'user1');
      const result = await service.processMessage('!uptime', 'user2');
      expect(result).toContain('cooldown');
    });

    it('should update command usage stats', async () => {
      await service.processMessage('!uptime', 'user1');
      const command = service.commands().find(c => c.trigger === 'uptime');
      expect(command?.usageCount).toBeGreaterThan(0);
    });
  });

  describe('custom commands', () => {
    it('should add custom command', () => {
      const initialCount = service.commands().length;
      service.addCustomCommand('test', 'Test response');
      expect(service.commands().length).toBe(initialCount + 1);
    });

    it('should edit command', () => {
      service.addCustomCommand('test', 'Original response');
      const command = service.commands().find(c => c.trigger === 'test');

      service.editCommand(command!.id, { response: 'Updated response' });

      const updated = service.commands().find(c => c.id === command!.id);
      expect(updated?.response).toBe('Updated response');
    });

    it('should delete command', () => {
      service.addCustomCommand('test', 'Test response');
      const command = service.commands().find(c => c.trigger === 'test');
      const initialCount = service.commands().length;

      service.deleteCommand(command!.id);

      expect(service.commands().length).toBe(initialCount - 1);
    });

    it('should toggle command enabled state', () => {
      const command = service.commands()[0];
      const initialState = command.enabled;

      service.toggleCommand(command.id);

      const updated = service.commands().find(c => c.id === command.id);
      expect(updated?.enabled).toBe(!initialState);
    });

    it('should save custom commands to localStorage', () => {
      service.addCustomCommand('test', 'Test response');
      const saved = localStorage.getItem('custom_commands');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.some((c: ChatCommand) => c.trigger === 'test')).toBe(true);
    });
  });

  describe('placeholder replacement', () => {
    beforeEach(() => {
      cardCommandsService.handleChatMessage.and.returnValue(Promise.resolve({ isCardCommand: false }));
    });

    it('should replace {user} placeholder', async () => {
      service.addCustomCommand('test', 'Hello {user}!');
      const result = await service.processMessage('!test', 'john');
      expect(result).toContain('john');
    });

    it('should replace {uptime} placeholder', async () => {
      service.addCustomCommand('test', 'Uptime: {uptime}');
      const result = await service.processMessage('!test', 'user');
      expect(result).toBeDefined();
    });

    it('should replace {viewers} placeholder', async () => {
      service.addCustomCommand('test', 'Viewers: {viewers}');
      const result = await service.processMessage('!test', 'user');
      expect(result).toContain('10');
    });

    it('should replace {game} placeholder', async () => {
      service.addCustomCommand('test', 'Playing: {game}');
      const result = await service.processMessage('!test', 'user');
      expect(result).toContain('Test Game');
    });

    it('should replace multiple placeholders', async () => {
      service.addCustomCommand('test', 'Hi {user}! Viewers: {viewers}');
      const result = await service.processMessage('!test', 'john');
      expect(result).toContain('john');
      expect(result).toContain('10');
    });
  });

  describe('auto-responses', () => {
    it('should greet new followers', () => {
      const greeting = service.handleNewFollower('newUser');
      expect(greeting).toContain('newUser');
      expect(greeting).toContain('Welcome');
    });

    it('should not greet if disabled', () => {
      service.updateConfig({ autoGreetNewFollowers: false });
      const greeting = service.handleNewFollower('newUser');
      expect(greeting).toBeNull();
    });

    it('should thank subscribers', () => {
      const thanks = service.handleNewSubscriber('subUser');
      expect(thanks).toContain('subUser');
      expect(thanks).toContain('Thank you');
    });

    it('should thank donations with amount', () => {
      const thanks = service.handleDonation('donorUser', 5.00);
      expect(thanks).toContain('donorUser');
      expect(thanks).toContain('5');
    });
  });

  describe('config management', () => {
    it('should update config', () => {
      service.updateConfig({ prefix: '$' });
      expect(service.config().prefix).toBe('$');
    });

    it('should save config to localStorage', () => {
      service.updateConfig({ prefix: '$' });
      const saved = localStorage.getItem('chatbot_config');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.prefix).toBe('$');
    });
  });

  describe('command history', () => {
    beforeEach(() => {
      cardCommandsService.handleChatMessage.and.returnValue(Promise.resolve({ isCardCommand: false }));
    });

    it('should track command history', async () => {
      await service.processMessage('!uptime', 'user1');
      expect(service.commandHistory().length).toBe(1);
    });

    it('should limit history to 100 entries', async () => {
      for (let i = 0; i < 150; i++) {
        await service.processMessage('!uptime', `user${i}`);
      }
      expect(service.commandHistory().length).toBe(100);
    });

    it('should clear history', async () => {
      await service.processMessage('!uptime', 'user1');
      service.clearHistory();
      expect(service.commandHistory().length).toBe(0);
    });
  });

  describe('stats', () => {
    it('should compute stats correctly', () => {
      const stats = service.stats();
      expect(stats.totalCommands).toBeGreaterThan(0);
      expect(stats.enabledCommands).toBeGreaterThan(0);
      expect(stats.totalUsage).toBeGreaterThanOrEqual(0);
    });

    it('should track custom commands count', () => {
      service.addCustomCommand('test1', 'Test 1');
      service.addCustomCommand('test2', 'Test 2');

      const stats = service.stats();
      expect(stats.customCommands).toBe(2);
    });
  });

  describe('commands by category', () => {
    it('should filter commands by category', () => {
      const infoCommands = service.getCommandsByCategory('info');
      expect(infoCommands.length).toBeGreaterThan(0);
      expect(infoCommands.every(c => c.category === 'info')).toBe(true);
    });

    it('should get social commands', () => {
      const socialCommands = service.getCommandsByCategory('social');
      expect(socialCommands.length).toBeGreaterThan(0);
    });
  });

  describe('import/export', () => {
    it('should export commands as JSON', () => {
      service.addCustomCommand('test', 'Test response');
      const exported = service.exportCommands();
      expect(exported).toBeTruthy();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should import commands from JSON', () => {
      const commands = [
        {
          id: 'test-id',
          trigger: 'imported',
          response: 'Imported command',
          type: 'custom' as const,
          enabled: true,
          cooldown: 10,
          permission: 'everyone' as const,
          usageCount: 0,
          category: 'custom' as const
        }
      ];

      service.importCommands(JSON.stringify(commands));

      const found = service.commands().some(c => c.trigger === 'imported');
      expect(found).toBe(true);
    });

    it('should handle invalid JSON on import', () => {
      const initialCount = service.commands().length;
      service.importCommands('invalid json');
      expect(service.commands().length).toBe(initialCount);
    });

    it('should only import custom commands', () => {
      const commands = [
        {
          id: 'test1',
          trigger: 'custom1',
          response: 'Custom',
          type: 'custom' as const,
          enabled: true,
          cooldown: 10,
          permission: 'everyone' as const,
          usageCount: 0,
          category: 'custom' as const
        },
        {
          id: 'test2',
          trigger: 'builtin1',
          response: 'Built-in',
          type: 'builtin' as const,
          enabled: true,
          cooldown: 10,
          permission: 'everyone' as const,
          usageCount: 0,
          category: 'info' as const
        }
      ];

      const initialCount = service.commands().length;
      service.importCommands(JSON.stringify(commands));

      // Should only add custom commands
      expect(service.commands().length).toBe(initialCount + 1);
    });
  });
});
