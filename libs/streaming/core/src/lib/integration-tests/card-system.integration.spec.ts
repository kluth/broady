import { TestBed } from '@angular/core/testing';
import { StreamChatbotService } from '../services/stream-chatbot.service';
import { CardChatCommandsService } from '../services/card-chat-commands.service';
import { CardGameDuelsService } from '../services/card-game-duels.service';
import { LorcanaCardService } from '../services/lorcana-card.service';
import { PokemonTcgService } from '../services/pokemon-tcg.service';
import { StreamingService } from '../services/streaming.service';
import { GameDetectionService } from '../services/game-detection.service';
import { ViewerEngagementService } from '../services/viewer-engagement.service';
import { DonationsService } from '../services/donations.service';

/**
 * Integration Tests for Card System
 * Tests the interaction between chatbot, card commands, and duels
 */
describe('Card System Integration', () => {
  let chatbot: StreamChatbotService;
  let cardCommands: CardChatCommandsService;
  let duels: CardGameDuelsService;
  let lorcana: LorcanaCardService;
  let pokemon: PokemonTcgService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StreamChatbotService,
        CardChatCommandsService,
        CardGameDuelsService,
        LorcanaCardService,
        PokemonTcgService,
        {
          provide: StreamingService,
          useValue: {
            status: { subscribe: jasmine.createSpy() }
          }
        },
        {
          provide: GameDetectionService,
          useValue: {
            currentGame: jasmine.createSpy().and.returnValue({ name: 'Test Game' })
          }
        },
        {
          provide: ViewerEngagementService,
          useValue: {
            analytics: jasmine.createSpy().and.returnValue({
              currentViewers: 10,
              totalFollowers: 100
            })
          }
        },
        {
          provide: DonationsService,
          useValue: {}
        }
      ]
    });

    chatbot = TestBed.inject(StreamChatbotService);
    cardCommands = TestBed.inject(CardChatCommandsService);
    duels = TestBed.inject(CardGameDuelsService);
    lorcana = TestBed.inject(LorcanaCardService);
    pokemon = TestBed.inject(PokemonTcgService);
  });

  describe('Chatbot and Card Commands Integration', () => {
    it('should route card commands through chatbot', async () => {
      const result = await chatbot.processMessage('!lorcana Mickey', 'testuser');

      expect(result).toBeDefined();
      expect(result).toContain('🎴');
    });

    it('should route pokemon commands through chatbot', async () => {
      const result = await chatbot.processMessage('!pokemon Pikachu', 'testuser');

      expect(result).toBeDefined();
      expect(result).toContain('🎴');
    });

    it('should handle random card commands', async () => {
      const result = await chatbot.processMessage('!randomlorcana', 'testuser');

      expect(result).toBeDefined();
    });

    it('should track card command usage in chatbot history', async () => {
      await chatbot.processMessage('!lorcana test', 'user1');

      // Card command history should be tracked in card service
      expect(cardCommands.commandHistory().length).toBeGreaterThan(0);
    });
  });

  describe('Full Duel Workflow', () => {
    it('should complete a full duel from challenge to victory', async () => {
      // Challenge
      const challenge = await duels.challenge('player1', 'player2', 'lorcana');
      expect(challenge).toContain('challenged');
      expect(duels.pendingChallenges().length).toBe(1);

      // Accept
      const accept = await duels.acceptChallenge('player2');
      expect(accept).toContain('Duel started');
      expect(duels.activeDuels().length).toBe(1);

      const duel = duels.activeDuels()[0];

      // Play through game
      duel.turnPhase = 'main';
      duel.challenger.inkPoints = 10;

      // Player 1 plays a card
      await duels.playCard('player1', 0);
      expect(duel.challenger.field.length).toBe(1);

      // Player 1 attacks (set up for attack phase)
      duel.turnPhase = 'attack';
      duel.opponent.health = 5; // Low health for quick end

      const attack = await duels.attack('player1', 0);

      // Should win the game
      expect(attack).toContain('Game Over');
      expect(duels.activeDuels().length).toBe(0);
      expect(duels.duelHistory().length).toBe(1);
    });

    it('should handle turn switching correctly', async () => {
      await duels.challenge('p1', 'p2', 'lorcana');
      await duels.acceptChallenge('p2');

      const duel = duels.activeDuels()[0];

      expect(duel.currentTurn).toBe('challenger');

      await duels.endTurn('p1');

      expect(duel.currentTurn).toBe('opponent');
      expect(duel.turnNumber).toBe(2);

      await duels.endTurn('p2');

      expect(duel.currentTurn).toBe('challenger');
      expect(duel.turnNumber).toBe(3);
    });

    it('should prevent multiple simultaneous duels per player', async () => {
      // Player 1 starts duel with player 2
      await duels.challenge('player1', 'player2', 'lorcana');
      await duels.acceptChallenge('player2');

      // Player 1 tries to start another duel
      const result = await duels.challenge('player1', 'player3', 'lorcana');

      expect(result).toContain('already in an active duel');
    });
  });

  describe('Card Lookups During Duels', () => {
    it('should allow card lookups while in duel', async () => {
      // Start a duel
      await duels.challenge('p1', 'p2', 'lorcana');
      await duels.acceptChallenge('p2');

      // Look up a card
      const cardLookup = await chatbot.processMessage('!lorcana Mickey', 'p1');

      expect(cardLookup).toBeDefined();
      expect(duels.activeDuels().length).toBe(1); // Duel still active
    });

    it('should track both duel and card lookup stats independently', async () => {
      await duels.challenge('p1', 'p2', 'pokemon');
      await duels.acceptChallenge('p2');

      await chatbot.processMessage('!pokemon Charizard', 'p1');

      expect(duels.stats().activeMatches).toBe(1);
      expect(cardCommands.getCommandStats().pokemonLookups).toBeGreaterThan(0);
    });
  });

  describe('Service Communication', () => {
    it('should share card data between services', async () => {
      // Look up a card
      await lorcana.searchByName('Mickey');

      // Card should be in recent
      expect(lorcana.recentCards().length).toBeGreaterThan(0);

      // Card should be accessible through command service
      const command = await chatbot.processMessage('!lorcana Mickey', 'user1');

      expect(command).toBeDefined();
    });

    it('should maintain separate state for different services', async () => {
      // Card commands
      await chatbot.processMessage('!lorcana test', 'user1');
      const cardHistory = cardCommands.commandHistory();

      // Regular chatbot commands
      await chatbot.processMessage('!uptime', 'user2');
      const chatHistory = chatbot.commandHistory();

      expect(cardHistory.length).toBeGreaterThan(0);
      expect(chatHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Across Services', () => {
    it('should handle card API errors gracefully', async () => {
      // Even if API fails, should return fallback
      const result = await chatbot.processMessage('!lorcana XYZ123NONEXISTENT', 'user1');

      expect(result).toBeDefined();
      // Should either show "not found" or fallback data
    });

    it('should handle duel errors without breaking chatbot', async () => {
      // Invalid duel command
      const result = await duels.playCard('nonexistent', 0);

      expect(result).toContain('not in an active duel');

      // Chatbot should still work
      const chatResult = await chatbot.processMessage('!uptime', 'user1');
      expect(chatResult).toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent card lookups', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(chatbot.processMessage('!randomlorcana', `user${i}`));
      }

      const results = await Promise.all(promises);

      expect(results.every(r => r !== null)).toBe(true);
    });

    it('should handle multiple concurrent duels', async () => {
      const duelsStarted = [];

      // Start 5 duels
      for (let i = 0; i < 5; i++) {
        await duels.challenge(`p${i * 2}`, `p${i * 2 + 1}`, 'lorcana');
        const result = await duels.acceptChallenge(`p${i * 2 + 1}`);
        duelsStarted.push(result);
      }

      expect(duels.activeDuels().length).toBe(5);
      expect(duelsStarted.every(r => r.includes('Duel started'))).toBe(true);
    });
  });
});
