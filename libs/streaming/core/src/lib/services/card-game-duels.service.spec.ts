import { TestBed } from '@angular/core/testing';
import { CardGameDuelsService, Duel, Player } from './card-game-duels.service';
import { LorcanaCardService } from './lorcana-card.service';
import { PokemonTcgService } from './pokemon-tcg.service';

describe('CardGameDuelsService', () => {
  let service: CardGameDuelsService;
  let lorcanaService: jasmine.SpyObj<LorcanaCardService>;
  let pokemonService: jasmine.SpyObj<PokemonTcgService>;

  beforeEach(() => {
    const lorcanaSpyObj = jasmine.createSpyObj('LorcanaCardService', []);
    const pokemonSpyObj = jasmine.createSpyObj('PokemonTcgService', []);

    TestBed.configureTestingModule({
      providers: [
        CardGameDuelsService,
        { provide: LorcanaCardService, useValue: lorcanaSpyObj },
        { provide: PokemonTcgService, useValue: pokemonSpyObj }
      ]
    });

    service = TestBed.inject(CardGameDuelsService);
    lorcanaService = TestBed.inject(LorcanaCardService) as jasmine.SpyObj<LorcanaCardService>;
    pokemonService = TestBed.inject(PokemonTcgService) as jasmine.SpyObj<PokemonTcgService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty signals', () => {
      expect(service.activeDuels()).toEqual([]);
      expect(service.pendingChallenges()).toEqual([]);
      expect(service.duelHistory()).toEqual([]);
    });

    it('should compute stats correctly', () => {
      const stats = service.stats();
      expect(stats.activeMatches).toBe(0);
      expect(stats.pendingChallenges).toBe(0);
      expect(stats.totalMatches).toBe(0);
    });
  });

  describe('challenge', () => {
    it('should create a challenge', async () => {
      const result = await service.challenge('player1', 'player2', 'lorcana');

      expect(result).toContain('challenged');
      expect(service.pendingChallenges().length).toBe(1);
    });

    it('should prevent duplicate challenges', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      const result = await service.challenge('player1', 'player2', 'lorcana');

      expect(result).toContain('already have a pending challenge');
      expect(service.pendingChallenges().length).toBe(1);
    });

    it('should prevent challenging while in active duel', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      await service.acceptChallenge('player2');

      const result = await service.challenge('player1', 'player3', 'lorcana');

      expect(result).toContain('already in an active duel');
    });

    it('should prevent challenging busy opponent', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      await service.acceptChallenge('player2');

      const result = await service.challenge('player3', 'player2', 'lorcana');

      expect(result).toContain('already in an active duel');
    });

    it('should support both game types', async () => {
      const lorcana = await service.challenge('p1', 'p2', 'lorcana');
      const pokemon = await service.challenge('p3', 'p4', 'pokemon');

      expect(lorcana).toContain('Lorcana');
      expect(pokemon).toContain('Pokémon TCG');
    });

    it('should auto-expire challenges after 2 minutes', (done) => {
      jasmine.clock().install();

      service.challenge('player1', 'player2', 'lorcana');
      expect(service.pendingChallenges().length).toBe(1);

      jasmine.clock().tick(2 * 60 * 1000 + 1000);

      setTimeout(() => {
        expect(service.pendingChallenges().length).toBe(0);
        jasmine.clock().uninstall();
        done();
      }, 100);
    });
  });

  describe('acceptChallenge', () => {
    it('should accept a challenge and start duel', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      const result = await service.acceptChallenge('player2');

      expect(result).toContain('Duel started');
      expect(service.activeDuels().length).toBe(1);
      expect(service.pendingChallenges().length).toBe(0);
    });

    it('should fail if no challenge exists', async () => {
      const result = await service.acceptChallenge('player1');

      expect(result).toContain('don\'t have any pending challenges');
    });

    it('should create duel with proper state', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      await service.acceptChallenge('player2');

      const duel = service.activeDuels()[0];

      expect(duel.state).toBe('active');
      expect(duel.turnNumber).toBe(1);
      expect(duel.currentTurn).toBe('challenger');
      expect(duel.challenger.username).toBe('player1');
      expect(duel.opponent.username).toBe('player2');
    });

    it('should initialize players with cards', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      await service.acceptChallenge('player2');

      const duel = service.activeDuels()[0];

      expect(duel.challenger.deck.length).toBeGreaterThan(0);
      expect(duel.challenger.hand.length).toBe(5);
      expect(duel.opponent.deck.length).toBeGreaterThan(0);
      expect(duel.opponent.hand.length).toBe(5);
    });

    it('should set correct health for game type', async () => {
      await service.challenge('p1', 'p2', 'lorcana');
      await service.acceptChallenge('p2');
      const lorcanaDuel = service.activeDuels()[0];

      service.forfeit('p1'); // Clear duel

      await service.challenge('p3', 'p4', 'pokemon');
      await service.acceptChallenge('p4');
      const pokemonDuel = service.activeDuels()[0];

      expect(lorcanaDuel.challenger.health).toBe(20);
      expect(pokemonDuel.challenger.health).toBe(60);
    });
  });

  describe('declineChallenge', () => {
    it('should decline a challenge', async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      const result = service.declineChallenge('player2');

      expect(result).toContain('declined');
      expect(service.pendingChallenges().length).toBe(0);
    });

    it('should fail if no challenge exists', () => {
      const result = service.declineChallenge('player1');

      expect(result).toContain('don\'t have any pending challenges');
    });
  });

  describe('gameplay', () => {
    let duel: Duel;

    beforeEach(async () => {
      await service.challenge('player1', 'player2', 'lorcana');
      await service.acceptChallenge('player2');
      duel = service.activeDuels()[0];
    });

    describe('playCard', () => {
      it('should play a card from hand', async () => {
        duel.challenger.inkPoints = 10;
        const initialHandSize = duel.challenger.hand.length;

        const result = await service.playCard('player1', 0);

        expect(result).toContain('played');
        expect(duel.challenger.hand.length).toBe(initialHandSize - 1);
        expect(duel.challenger.field.length).toBe(1);
      });

      it('should fail if not player\'s turn', async () => {
        const result = await service.playCard('player2', 0);

        expect(result).toContain('not your turn');
      });

      it('should fail if not in main phase', async () => {
        const result = await service.playCard('player1', 0);

        expect(result).toContain('main phase');
      });

      it('should check resource cost', async () => {
        duel.turnPhase = 'main';
        duel.challenger.inkPoints = 0;

        const result = await service.playCard('player1', 0);

        expect(result).toContain('Not enough');
      });

      it('should validate card index', async () => {
        duel.turnPhase = 'main';

        const result = await service.playCard('player1', 999);

        expect(result).toContain('Invalid card index');
      });

      it('should deduct resources', async () => {
        duel.turnPhase = 'main';
        duel.challenger.inkPoints = 10;
        const card = duel.challenger.hand[0];
        const initialInk = duel.challenger.inkPoints;

        await service.playCard('player1', 0);

        expect(duel.challenger.inkPoints).toBe(initialInk - card.cost);
      });
    });

    describe('attack', () => {
      beforeEach(() => {
        duel.turnPhase = 'attack';
        duel.challenger.field.push({
          id: '1',
          name: 'Attacker',
          cost: 1,
          power: 5,
          defense: 3,
          type: 'Character',
          isExhausted: false
        });
      });

      it('should attack opponent directly', async () => {
        const initialHealth = duel.opponent.health;

        const result = await service.attack('player1', 0);

        expect(result).toContain('attacked');
        expect(duel.opponent.health).toBe(initialHealth - 5);
      });

      it('should exhaust attacking card', async () => {
        await service.attack('player1', 0);

        expect(duel.challenger.field[0].isExhausted).toBe(true);
      });

      it('should end game when health reaches 0', async () => {
        duel.opponent.health = 3;

        const result = await service.attack('player1', 0);

        expect(result).toContain('Game Over');
        expect(service.activeDuels().length).toBe(0);
        expect(service.duelHistory().length).toBe(1);
      });

      it('should attack opponent\'s creature', async () => {
        duel.opponent.field.push({
          id: '2',
          name: 'Defender',
          cost: 1,
          power: 2,
          defense: 4,
          type: 'Character'
        });

        await service.attack('player1', 0, 0);

        expect(duel.opponent.field[0].defense).toBe(4 - 5);
      });

      it('should apply counter damage', async () => {
        duel.opponent.field.push({
          id: '2',
          name: 'Defender',
          cost: 1,
          power: 4,
          defense: 6,
          type: 'Character'
        });

        await service.attack('player1', 0, 0);

        expect(duel.challenger.field[0].defense).toBe(3 - 4);
      });

      it('should destroy defeated creatures', async () => {
        duel.opponent.field.push({
          id: '2',
          name: 'Weak',
          cost: 1,
          power: 1,
          defense: 2,
          type: 'Character'
        });

        await service.attack('player1', 0, 0);

        expect(duel.opponent.field.length).toBe(0);
        expect(duel.opponent.discardPile.length).toBe(1);
      });

      it('should prevent attacking with exhausted card', async () => {
        duel.challenger.field[0].isExhausted = true;

        const result = await service.attack('player1', 0);

        expect(result).toContain('exhausted');
      });

      it('should fail if not player\'s turn', async () => {
        const result = await service.attack('player2', 0);

        expect(result).toContain('not your turn');
      });

      it('should fail if not in attack phase', async () => {
        duel.turnPhase = 'main';

        const result = await service.attack('player1', 0);

        expect(result).toContain('attack phase');
      });
    });

    describe('endTurn', () => {
      it('should end turn and switch players', async () => {
        const result = await service.endTurn('player1');

        expect(result).toContain('player2\'s turn');
        expect(duel.currentTurn).toBe('opponent');
        expect(duel.turnNumber).toBe(2);
      });

      it('should refresh cards', async () => {
        duel.challenger.field.push({
          id: '1',
          name: 'Test',
          cost: 1,
          power: 1,
          defense: 1,
          type: 'Character',
          isExhausted: true
        });

        await service.endTurn('player1');

        expect(duel.challenger.field[0].isExhausted).toBe(false);
      });

      it('should add resources for new turn', async () => {
        const initialInk = duel.opponent.inkPoints;

        await service.endTurn('player1');

        expect(duel.opponent.inkPoints).toBe(Math.min(initialInk + 1, 10));
      });

      it('should fail if not player\'s turn', async () => {
        const result = await service.endTurn('player2');

        expect(result).toContain('not your turn');
      });
    });

    describe('viewHand', () => {
      it('should show player\'s hand', () => {
        const result = service.viewHand('player1');

        expect(result).toContain('Your Hand');
        expect(result).toContain('0:');
      });

      it('should show empty hand message', () => {
        duel.challenger.hand = [];

        const result = service.viewHand('player1');

        expect(result).toContain('empty');
      });

      it('should fail if not in duel', () => {
        const result = service.viewHand('player3');

        expect(result).toContain('not in an active duel');
      });
    });

    describe('viewField', () => {
      it('should show battlefield state', () => {
        const result = service.viewField('player1');

        expect(result).toContain('Battlefield');
        expect(result).toContain('player1');
        expect(result).toContain('player2');
      });

      it('should show health', () => {
        const result = service.viewField('player1');

        expect(result).toContain('HP:');
      });

      it('should fail if not in duel', () => {
        const result = service.viewField('player3');

        expect(result).toContain('not in an active duel');
      });
    });

    describe('forfeit', () => {
      it('should forfeit the match', () => {
        const result = service.forfeit('player1');

        expect(result).toContain('Game Over');
        expect(result).toContain('player2 wins');
        expect(result).toContain('forfeited');
        expect(service.activeDuels().length).toBe(0);
      });

      it('should move duel to history', () => {
        service.forfeit('player1');

        expect(service.duelHistory().length).toBe(1);
        expect(service.duelHistory()[0].winner).toBe('player2');
      });

      it('should fail if not in duel', () => {
        const result = service.forfeit('player3');

        expect(result).toContain('not in an active duel');
      });
    });
  });

  describe('getDuelHelp', () => {
    it('should return help text', () => {
      const help = service.getDuelHelp();

      expect(help).toContain('!challenge');
      expect(help).toContain('!accept');
      expect(help).toContain('!decline');
      expect(help).toContain('!hand');
      expect(help).toContain('!field');
      expect(help).toContain('!play');
      expect(help).toContain('!attack');
      expect(help).toContain('!endturn');
      expect(help).toContain('!forfeit');
    });
  });

  describe('stats', () => {
    it('should track match statistics', async () => {
      await service.challenge('p1', 'p2', 'lorcana');
      await service.acceptChallenge('p2');

      const stats = service.stats();

      expect(stats.activeMatches).toBe(1);
      expect(stats.totalMatches).toBe(1);
    });

    it('should track game type statistics', async () => {
      await service.challenge('p1', 'p2', 'lorcana');
      await service.acceptChallenge('p2');
      service.forfeit('p1');

      await service.challenge('p3', 'p4', 'pokemon');
      await service.acceptChallenge('p4');
      service.forfeit('p3');

      const stats = service.stats();

      expect(stats.lorcanaMatches).toBe(1);
      expect(stats.pokemonMatches).toBe(1);
    });
  });
});
