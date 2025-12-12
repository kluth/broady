import { TestBed } from '@angular/core/testing';
import { BettingService, Bet, ViewerBet, ViewerPoints } from './betting.service';

describe('BettingService', () => {
  let service: BettingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BettingService]
    });
    service = TestBed.inject(BettingService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty bets', () => {
      expect(service.bets()).toEqual([]);
    });

    it('should initialize with empty viewer bets', () => {
      expect(service.viewerBets()).toEqual([]);
    });

    it('should initialize with empty viewer points', () => {
      expect(service.viewerPoints()).toEqual([]);
    });

    it('should have no active bets initially', () => {
      expect(service.activeBets()).toEqual([]);
    });

    it('should have empty leaderboard initially', () => {
      expect(service.leaderboard()).toEqual([]);
    });

    it('should have default starting points', () => {
      expect(service.defaultStartingPoints).toBe(1000);
    });

    it('should have daily bonus defined', () => {
      expect(service.dailyBonus).toBe(100);
    });

    it('should have bet templates defined', () => {
      const templates = service.templates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have statistics initialized', () => {
      const stats = service.statistics();
      expect(stats.totalBets).toBe(0);
      expect(stats.activeBets).toBe(0);
      expect(stats.resolvedBets).toBe(0);
      expect(stats.totalPointsInPlay).toBe(0);
      expect(stats.totalViewers).toBe(0);
      expect(stats.totalViewerBets).toBe(0);
    });
  });

  describe('Create Bet', () => {
    it('should create a basic bet', () => {
      const bet = service.createBet(
        'Will we win?',
        'Betting on match outcome',
        [{ label: 'Yes' }, { label: 'No' }]
      );

      expect(bet).toBeDefined();
      expect(bet.title).toBe('Will we win?');
      expect(bet.description).toBe('Betting on match outcome');
      expect(bet.options.length).toBe(2);
      expect(bet.status).toBe('open');
    });

    it('should generate unique bet ID', () => {
      const bet1 = service.createBet('Bet 1', 'Description', [{ label: 'A' }, { label: 'B' }]);
      const bet2 = service.createBet('Bet 2', 'Description', [{ label: 'X' }, { label: 'Y' }]);

      expect(bet1.id).not.toBe(bet2.id);
    });

    it('should initialize bet options with default values', () => {
      const bet = service.createBet('Test', 'Test bet', [{ label: 'Option 1' }, { label: 'Option 2' }]);

      bet.options.forEach(option => {
        expect(option.odds).toBe(1.0);
        expect(option.totalPoints).toBe(0);
        expect(option.totalBettors).toBe(0);
      });
    });

    it('should set bet creation timestamp', () => {
      const before = new Date();
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const after = new Date();

      expect(bet.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(bet.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should add bet to bets list', () => {
      expect(service.bets().length).toBe(0);

      service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      expect(service.bets().length).toBe(1);
    });

    it('should support custom configuration', () => {
      const bet = service.createBet(
        'Test',
        'Description',
        [{ label: 'Win' }, { label: 'Lose' }],
        {
          category: 'match-outcome',
          type: 'binary',
          game: 'Fortnite',
          autoResolve: true
        }
      );

      expect(bet.category).toBe('match-outcome');
      expect(bet.type).toBe('binary');
      expect(bet.game).toBe('Fortnite');
      expect(bet.autoResolve).toBe(true);
    });

    it('should include icon and color in options', () => {
      const bet = service.createBet(
        'Test',
        'Test',
        [
          { label: 'Win', icon: '🏆', color: '#4ade80' },
          { label: 'Lose', icon: '💀', color: '#ff6b6b' }
        ]
      );

      expect(bet.options[0].icon).toBe('🏆');
      expect(bet.options[0].color).toBe('#4ade80');
      expect(bet.options[1].icon).toBe('💀');
      expect(bet.options[1].color).toBe('#ff6b6b');
    });
  });

  describe('Create From Template', () => {
    it('should create bet from template', () => {
      const bet = service.createFromTemplate('match-win-loss');

      expect(bet).not.toBeNull();
      expect(bet?.title).toBe('Match Outcome');
      expect(bet?.description).toContain('win or lose');
      expect(bet?.options.length).toBe(2);
    });

    it('should return null for non-existent template', () => {
      const bet = service.createFromTemplate('non-existent-template');
      expect(bet).toBeNull();
    });

    it('should apply template category and type', () => {
      const bet = service.createFromTemplate('match-win-loss');

      expect(bet?.category).toBe('match-outcome');
      expect(bet?.type).toBe('binary');
    });

    it('should allow custom configuration override', () => {
      const bet = service.createFromTemplate('match-win-loss', {
        game: 'League of Legends'
      });

      expect(bet?.game).toBe('League of Legends');
    });

    it('should have all available templates', () => {
      const templates = service.templates();
      const templateIds = templates.map(t => t.id);

      expect(templateIds).toContain('match-win-loss');
      expect(templateIds).toContain('fps-kills-over-under');
      expect(templateIds).toContain('br-placement');
      expect(templateIds).toContain('moba-pentakill');
      expect(templateIds).toContain('racing-podium');
    });
  });

  describe('Place Bet', () => {
    it('should place a bet successfully', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      const viewerBet = service.placeBet('viewer1', 'TestUser', bet.id, bet.options[0].id, 100);

      expect(viewerBet).not.toBeNull();
      expect(viewerBet?.viewerId).toBe('viewer1');
      expect(viewerBet?.points).toBe(100);
    });

    it('should create viewer points record for new viewer', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'TestUser', bet.id, bet.options[0].id, 100);

      const viewers = service.viewerPoints();
      expect(viewers.length).toBe(1);
      expect(viewers[0].viewerId).toBe('viewer1');
      expect(viewers[0].totalPoints).toBe(900); // 1000 - 100
    });

    it('should deduct points from viewer', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 200);

      const viewer = service.viewerPoints()[0];
      expect(viewer.totalPoints).toBe(800); // 1000 - 200
    });

    it('should fail if viewer has insufficient points', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const consoleError = spyOn(console, 'error');

      const viewerBet = service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 2000);

      expect(viewerBet).toBeNull();
      expect(consoleError).toHaveBeenCalledWith('Insufficient points');
    });

    it('should fail if bet is not open', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);
      service.lockBet(bet.id);
      const consoleError = spyOn(console, 'error');

      const viewerBet = service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);

      expect(viewerBet).toBeNull();
      expect(consoleError).toHaveBeenCalledWith('Bet not available');
    });

    it('should fail for invalid option', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const consoleError = spyOn(console, 'error');

      const viewerBet = service.placeBet('viewer1', 'User1', bet.id, 'invalid-option', 100);

      expect(viewerBet).toBeNull();
      expect(consoleError).toHaveBeenCalledWith('Invalid option');
    });

    it('should update bet statistics', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);

      const updatedBet = service.bets()[0];
      expect(updatedBet.totalPoints).toBe(100);
      expect(updatedBet.totalBets).toBe(1);
      expect(updatedBet.options[0].totalPoints).toBe(100);
      expect(updatedBet.options[0].totalBettors).toBe(1);
    });

    it('should recalculate odds after placing bet', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 900);
      service.placeBet('viewer2', 'User2', bet.id, bet.options[1].id, 100);

      const updatedBet = service.bets()[0];
      // Option with more points should have lower odds
      expect(updatedBet.options[0].odds).toBeLessThan(updatedBet.options[1].odds);
    });
  });

  describe('Lock and Resolve Bet', () => {
    it('should lock an open bet', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.lockBet(bet.id);

      const lockedBet = service.bets()[0];
      expect(lockedBet.status).toBe('locked');
      expect(lockedBet.lockedAt).toBeDefined();
    });

    it('should not lock already locked bet', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.lockBet(bet.id);
      service.lockBet(bet.id); // Try again

      const bets = service.bets();
      expect(bets[0].status).toBe('locked');
    });

    it('should resolve locked bet', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'Win' }, { label: 'Lose' }]);
      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);
      service.lockBet(bet.id);

      const result = service.resolveBet(bet.id, bet.options[0].id);

      expect(result).not.toBeNull();
      expect(result?.winningOption.label).toBe('Win');
    });

    it('should pay out winners', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('winner', 'Winner', bet.id, bet.options[0].id, 100);
      service.lockBet(bet.id);

      const viewerBefore = service.viewerPoints().find(v => v.viewerId === 'winner');
      const pointsBefore = viewerBefore!.totalPoints;

      service.resolveBet(bet.id, bet.options[0].id);

      const viewerAfter = service.viewerPoints().find(v => v.viewerId === 'winner');
      expect(viewerAfter!.totalPoints).toBeGreaterThan(pointsBefore);
    });

    it('should update viewer bet records', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);
      service.lockBet(bet.id);
      service.resolveBet(bet.id, bet.options[0].id);

      const viewerBet = service.viewerBets()[0];
      expect(viewerBet.won).toBe(true);
      expect(viewerBet.actualPayout).toBeGreaterThan(0);
    });

    it('should update bet status to resolved', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.lockBet(bet.id);
      service.resolveBet(bet.id, bet.options[0].id);

      const resolvedBet = service.bets()[0];
      expect(resolvedBet.status).toBe('resolved');
      expect(resolvedBet.resolvedAt).toBeDefined();
      expect(resolvedBet.winningOptionId).toBeDefined();
    });

    it('should track winners and losers', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('winner', 'Winner', bet.id, bet.options[0].id, 100);
      service.placeBet('loser', 'Loser', bet.id, bet.options[1].id, 100);
      service.lockBet(bet.id);

      const result = service.resolveBet(bet.id, bet.options[0].id);

      expect(result?.winners.length).toBe(1);
      expect(result?.losers).toBe(1);
      expect(result?.winners[0].viewerId).toBe('winner');
    });

    it('should update viewer win/loss statistics', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);
      service.lockBet(bet.id);
      service.resolveBet(bet.id, bet.options[0].id);

      const viewer = service.viewerPoints().find(v => v.viewerId === 'viewer1');
      expect(viewer?.totalBets).toBe(1);
      expect(viewer?.betsWon).toBe(1);
      expect(viewer?.winRate).toBe(100);
    });
  });

  describe('Auto-Resolve Bet', () => {
    it('should auto-resolve bet based on game stats', () => {
      const bet = service.createBet(
        'Over 20 kills?',
        'Test auto resolve',
        [{ label: 'Yes' }, { label: 'No' }],
        {
          autoResolve: true,
          autoResolveConfig: {
            gameStatKey: 'kills',
            condition: 'greater',
            value: 20,
            targetOptionId: ''
          }
        }
      );

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);
      service.lockBet(bet.id);

      const result = service.autoResolveBet(bet.id, { kills: 25 });

      expect(result).not.toBeNull();
      expect(result?.winningOption.label).toBe('Yes');
    });

    it('should handle equals condition', () => {
      const bet = service.createBet(
        'Test',
        'Test',
        [{ label: 'Success' }, { label: 'Fail' }],
        {
          autoResolve: true,
          autoResolveConfig: {
            gameStatKey: 'placement',
            condition: 'equals',
            value: 1,
            targetOptionId: ''
          }
        }
      );

      service.lockBet(bet.id);
      const result = service.autoResolveBet(bet.id, { placement: 1 });

      expect(result?.winningOption.label).toBe('Success');
    });

    it('should handle less than condition', () => {
      const bet = service.createBet(
        'Test',
        'Test',
        [{ label: 'Top 3' }, { label: 'Not Top 3' }],
        {
          autoResolve: true,
          autoResolveConfig: {
            gameStatKey: 'position',
            condition: 'less',
            value: 4,
            targetOptionId: ''
          }
        }
      );

      service.lockBet(bet.id);
      const result = service.autoResolveBet(bet.id, { position: 2 });

      expect(result?.winningOption.label).toBe('Top 3');
    });

    it('should return null if stat not found', () => {
      const bet = service.createBet(
        'Test',
        'Test',
        [{ label: 'A' }, { label: 'B' }],
        {
          autoResolve: true,
          autoResolveConfig: {
            gameStatKey: 'nonExistentStat',
            condition: 'greater',
            value: 10,
            targetOptionId: ''
          }
        }
      );

      const consoleError = spyOn(console, 'error');
      const result = service.autoResolveBet(bet.id, { otherStat: 5 });

      expect(result).toBeNull();
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('Cancel Bet', () => {
    it('should cancel bet and refund all bets', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 200);
      const viewerBefore = service.viewerPoints().find(v => v.viewerId === 'viewer1');

      service.cancelBet(bet.id);

      const viewerAfter = service.viewerPoints().find(v => v.viewerId === 'viewer1');
      expect(viewerAfter!.totalPoints).toBe(1000); // Refunded
    });

    it('should update bet status to cancelled', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.cancelBet(bet.id);

      const cancelledBet = service.bets()[0];
      expect(cancelledBet.status).toBe('cancelled');
    });

    it('should remove viewer bets', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);
      expect(service.viewerBets().length).toBe(1);

      service.cancelBet(bet.id);

      expect(service.viewerBets().length).toBe(0);
    });
  });

  describe('Viewer Points Management', () => {
    it('should give daily bonus', () => {
      service.placeBet('viewer1', 'User1',
        service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]).id,
        service.bets()[0].options[0].id,
        100
      );

      const before = service.viewerPoints().find(v => v.viewerId === 'viewer1')!.totalPoints;

      service.giveDailyBonus('viewer1');

      const after = service.viewerPoints().find(v => v.viewerId === 'viewer1')!.totalPoints;
      expect(after).toBe(before + service.dailyBonus);
    });

    it('should track lifetime earned and spent', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 200);

      const viewer = service.viewerPoints().find(v => v.viewerId === 'viewer1');
      expect(viewer?.lifetimeEarned).toBe(1000); // Starting points
      expect(viewer?.lifetimeSpent).toBe(200);
    });

    it('should calculate win rate correctly', () => {
      const bet1 = service.createBet('Bet 1', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const bet2 = service.createBet('Bet 2', 'Test', [{ label: 'X' }, { label: 'Y' }]);

      service.placeBet('viewer1', 'User1', bet1.id, bet1.options[0].id, 100);
      service.placeBet('viewer1', 'User1', bet2.id, bet2.options[0].id, 100);

      service.lockBet(bet1.id);
      service.lockBet(bet2.id);

      service.resolveBet(bet1.id, bet1.options[0].id); // Win
      service.resolveBet(bet2.id, bet2.options[1].id); // Lose

      const viewer = service.viewerPoints().find(v => v.viewerId === 'viewer1');
      expect(viewer?.betsWon).toBe(1);
      expect(viewer?.betsLost).toBe(1);
      expect(viewer?.winRate).toBe(50);
    });
  });

  describe('Leaderboard', () => {
    it('should show top 10 viewers', () => {
      for (let i = 0; i < 15; i++) {
        const bet = service.createBet(`Bet ${i}`, 'Test', [{ label: 'A' }, { label: 'B' }]);
        service.placeBet(`viewer${i}`, `User${i}`, bet.id, bet.options[0].id, 10);
      }

      const leaderboard = service.leaderboard();
      expect(leaderboard.length).toBe(10);
    });

    it('should sort by points descending', () => {
      service.giveDailyBonus('viewer1'); // Create viewer1
      service.giveDailyBonus('viewer2'); // Create viewer2
      service.giveDailyBonus('viewer2'); // Give viewer2 more points
      service.giveDailyBonus('viewer2');

      const leaderboard = service.leaderboard();
      expect(leaderboard[0].viewerId).toBe('viewer2');
      expect(leaderboard[1].viewerId).toBe('viewer1');
    });
  });

  describe('Computed Statistics', () => {
    it('should calculate total bets', () => {
      service.createBet('Bet 1', 'Test', [{ label: 'A' }, { label: 'B' }]);
      service.createBet('Bet 2', 'Test', [{ label: 'X' }, { label: 'Y' }]);

      const stats = service.statistics();
      expect(stats.totalBets).toBe(2);
    });

    it('should calculate active bets', () => {
      const bet1 = service.createBet('Bet 1', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const bet2 = service.createBet('Bet 2', 'Test', [{ label: 'X' }, { label: 'Y' }]);

      service.lockBet(bet1.id);
      service.resolveBet(bet1.id, bet1.options[0].id);

      const stats = service.statistics();
      expect(stats.activeBets).toBe(1); // Only bet2 is open
    });

    it('should calculate total points in play', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 200);
      service.placeBet('viewer2', 'User2', bet.id, bet.options[1].id, 300);

      const stats = service.statistics();
      expect(stats.totalPointsInPlay).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle bet with no bets placed', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);
      service.lockBet(bet.id);

      const result = service.resolveBet(bet.id, bet.options[0].id);

      expect(result?.winners.length).toBe(0);
      expect(result?.losers).toBe(0);
    });

    it('should handle deleting bet', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.deleteBet(bet.id);

      expect(service.bets().length).toBe(0);
    });

    it('should handle getting bets for specific game', () => {
      service.createBet('Test 1', 'Test', [{ label: 'A' }], { game: 'Fortnite' });
      service.createBet('Test 2', 'Test', [{ label: 'B' }], { game: 'Warzone' });
      service.createBet('Test 3', 'Test', [{ label: 'C' }], { game: 'Fortnite' });

      const fortniteBets = service.getGameBets('Fortnite');
      expect(fortniteBets.length).toBe(2);
    });

    it('should handle getting viewer active bets', () => {
      const bet1 = service.createBet('Bet 1', 'Test', [{ label: 'A' }, { label: 'B' }]);
      const bet2 = service.createBet('Bet 2', 'Test', [{ label: 'X' }, { label: 'Y' }]);

      service.placeBet('viewer1', 'User1', bet1.id, bet1.options[0].id, 100);
      service.placeBet('viewer1', 'User1', bet2.id, bet2.options[0].id, 100);

      const activeBets = service.getViewerActiveBets('viewer1');
      expect(activeBets.length).toBe(2);
    });

    it('should handle getting viewer bet history', () => {
      const bet = service.createBet('Test', 'Test', [{ label: 'A' }, { label: 'B' }]);

      service.placeBet('viewer1', 'User1', bet.id, bet.options[0].id, 100);

      const history = service.getViewerBetHistory('viewer1');
      expect(history.length).toBe(1);
    });
  });
});
