import { Injectable, signal, computed } from '@angular/core';

/**
 * Betting Service
 * Viewer predictions and betting on stream outcomes
 * Integrates with game stats for auto-resolution
 */

export interface Bet {
  id: string;
  title: string;
  description: string;
  game?: string;
  category: BetCategory;
  type: BetType;
  status: 'open' | 'locked' | 'resolved' | 'cancelled';
  createdAt: Date;
  lockedAt?: Date;
  resolvedAt?: Date;
  options: BetOption[];
  totalPoints: number;
  totalBets: number;
  autoResolve: boolean;
  autoResolveConfig?: AutoResolveConfig;
  winningOptionId?: string;
  metadata?: Record<string, any>;
}

export type BetCategory =
  | 'match-outcome'
  | 'performance'
  | 'achievement'
  | 'challenge'
  | 'race'
  | 'custom';

export type BetType =
  | 'binary' // Yes/No, Win/Lose
  | 'multiple' // Multiple options
  | 'range'; // Number range (over/under)

export interface BetOption {
  id: string;
  label: string;
  odds: number; // Calculated odds
  totalPoints: number;
  totalBettors: number;
  color?: string;
  icon?: string;
}

export interface AutoResolveConfig {
  gameStatKey: string; // e.g., 'kills', 'placement', 'win'
  condition: 'equals' | 'greater' | 'less' | 'between' | 'contains';
  value: any;
  targetOptionId: string;
}

export interface ViewerBet {
  id: string;
  betId: string;
  viewerId: string;
  viewerName: string;
  optionId: string;
  points: number;
  placedAt: Date;
  potentialPayout: number;
  won?: boolean;
  actualPayout?: number;
}

export interface ViewerPoints {
  viewerId: string;
  viewerName: string;
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  totalBets: number;
  betsWon: number;
  betsLost: number;
  winRate: number;
  rank: number;
  lastUpdated: Date;
}

export interface BetTemplate {
  id: string;
  name: string;
  description: string;
  gameType: string;
  category: BetCategory;
  type: BetType;
  defaultOptions: Array<{ label: string; icon?: string; color?: string }>;
  autoResolve?: Partial<AutoResolveConfig>;
}

export interface BetResult {
  betId: string;
  winningOption: BetOption;
  totalPayout: number;
  winners: Array<{
    viewerId: string;
    viewerName: string;
    betAmount: number;
    payout: number;
    profit: number;
  }>;
  losers: number;
}

@Injectable({
  providedIn: 'root'
})
export class BettingService {
  readonly bets = signal<Bet[]>([]);
  readonly viewerBets = signal<ViewerBet[]>([]);
  readonly viewerPoints = signal<ViewerPoints[]>([]);

  readonly activeBets = computed(() =>
    this.bets().filter(b => b.status === 'open' || b.status === 'locked')
  );

  readonly leaderboard = computed(() =>
    [...this.viewerPoints()]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
  );

  // Starting points for new viewers
  readonly defaultStartingPoints = 1000;
  readonly dailyBonus = 100;

  // Bet templates
  readonly templates = signal<BetTemplate[]>([
    // Match Outcome Bets
    {
      id: 'match-win-loss',
      name: 'Match Outcome',
      description: 'Will we win or lose this match?',
      gameType: 'competitive',
      category: 'match-outcome',
      type: 'binary',
      defaultOptions: [
        { label: 'Win', icon: '🏆', color: '#4ade80' },
        { label: 'Lose', icon: '💀', color: '#ff6b6b' }
      ],
      autoResolve: {
        gameStatKey: 'matchResult',
        condition: 'equals'
      }
    },

    // FPS Performance Bets
    {
      id: 'fps-kills-over-under',
      name: 'Kill Count (Over/Under)',
      description: 'Over or under X kills this match?',
      gameType: 'fps',
      category: 'performance',
      type: 'binary',
      defaultOptions: [
        { label: 'Over 20', icon: '⬆️', color: '#4a90e2' },
        { label: 'Under 20', icon: '⬇️', color: '#ffa500' }
      ],
      autoResolve: {
        gameStatKey: 'kills',
        condition: 'greater',
        value: 20
      }
    },
    {
      id: 'fps-kd-ratio',
      name: 'K/D Ratio',
      description: 'Will K/D be positive or negative?',
      gameType: 'fps',
      category: 'performance',
      type: 'binary',
      defaultOptions: [
        { label: 'Positive K/D', icon: '📈', color: '#4ade80' },
        { label: 'Negative K/D', icon: '📉', color: '#ff6b6b' }
      ],
      autoResolve: {
        gameStatKey: 'kdRatio',
        condition: 'greater',
        value: 1.0
      }
    },

    // MOBA Bets
    {
      id: 'moba-pentakill',
      name: 'Pentakill/Ace',
      description: 'Will we get a pentakill this game?',
      gameType: 'moba',
      category: 'achievement',
      type: 'binary',
      defaultOptions: [
        { label: 'Yes', icon: '⭐', color: '#ffd700' },
        { label: 'No', icon: '❌', color: '#888' }
      ]
    },
    {
      id: 'moba-kda',
      name: 'KDA Score',
      description: 'Will KDA be above 3.0?',
      gameType: 'moba',
      category: 'performance',
      type: 'binary',
      defaultOptions: [
        { label: 'Above 3.0', icon: '🔥', color: '#ff6600' },
        { label: 'Below 3.0', icon: '❄️', color: '#4a90e2' }
      ],
      autoResolve: {
        gameStatKey: 'kda',
        condition: 'greater',
        value: 3.0
      }
    },

    // Battle Royale Bets
    {
      id: 'br-placement',
      name: 'Placement',
      description: 'What placement will we get?',
      gameType: 'battle-royale',
      category: 'match-outcome',
      type: 'multiple',
      defaultOptions: [
        { label: 'Top 1 (Win)', icon: '🥇', color: '#ffd700' },
        { label: 'Top 3', icon: '🥈', color: '#c0c0c0' },
        { label: 'Top 10', icon: '🥉', color: '#cd7f32' },
        { label: 'Below Top 10', icon: '📊', color: '#888' }
      ],
      autoResolve: {
        gameStatKey: 'placement',
        condition: 'less'
      }
    },
    {
      id: 'br-kills',
      name: 'Kill Count',
      description: 'How many kills this match?',
      gameType: 'battle-royale',
      category: 'performance',
      type: 'multiple',
      defaultOptions: [
        { label: '0-2 kills', icon: '🔵', color: '#4a90e2' },
        { label: '3-5 kills', icon: '🟢', color: '#4ade80' },
        { label: '6-10 kills', icon: '🟡', color: '#ffd700' },
        { label: '10+ kills', icon: '🔴', color: '#ff6b6b' }
      ]
    },

    // Racing Bets
    {
      id: 'racing-podium',
      name: 'Podium Finish',
      description: 'Will we finish in top 3?',
      gameType: 'racing',
      category: 'match-outcome',
      type: 'binary',
      defaultOptions: [
        { label: 'Top 3', icon: '🏁', color: '#4ade80' },
        { label: 'Not Top 3', icon: '🚗', color: '#888' }
      ],
      autoResolve: {
        gameStatKey: 'position',
        condition: 'less',
        value: 4
      }
    },

    // Challenge Bets
    {
      id: 'boss-defeat',
      name: 'Boss Defeat',
      description: 'Will we defeat the boss?',
      gameType: 'rpg',
      category: 'challenge',
      type: 'binary',
      defaultOptions: [
        { label: 'Defeat Boss', icon: '⚔️', color: '#4ade80' },
        { label: 'Die to Boss', icon: '💀', color: '#ff6b6b' }
      ]
    },
    {
      id: 'no-death-challenge',
      name: 'No Death Challenge',
      description: 'Complete without dying?',
      gameType: 'rpg',
      category: 'challenge',
      type: 'binary',
      defaultOptions: [
        { label: 'No Deaths', icon: '✨', color: '#ffd700' },
        { label: 'At Least One Death', icon: '☠️', color: '#888' }
      ],
      autoResolve: {
        gameStatKey: 'deaths',
        condition: 'equals',
        value: 0
      }
    }
  ]);

  readonly statistics = computed(() => ({
    totalBets: this.bets().length,
    activeBets: this.activeBets().length,
    resolvedBets: this.bets().filter(b => b.status === 'resolved').length,
    totalPointsInPlay: this.activeBets().reduce((sum, b) => sum + b.totalPoints, 0),
    totalViewers: this.viewerPoints().length,
    totalViewerBets: this.viewerBets().length
  }));

  /**
   * Create new bet
   */
  createBet(
    title: string,
    description: string,
    options: Array<{ label: string; icon?: string; color?: string }>,
    config?: Partial<Bet>
  ): Bet {
    const bet: Bet = {
      id: crypto.randomUUID(),
      title,
      description,
      category: config?.category || 'custom',
      type: config?.type || 'binary',
      status: 'open',
      createdAt: new Date(),
      options: options.map((opt, idx) => ({
        id: `option-${idx}`,
        label: opt.label,
        odds: 1.0,
        totalPoints: 0,
        totalBettors: 0,
        icon: opt.icon,
        color: opt.color
      })),
      totalPoints: 0,
      totalBets: 0,
      autoResolve: config?.autoResolve || false,
      autoResolveConfig: config?.autoResolveConfig,
      game: config?.game,
      metadata: config?.metadata
    };

    this.bets.update(bets => [...bets, bet]);
    return bet;
  }

  /**
   * Create bet from template
   */
  createFromTemplate(templateId: string, customConfig?: Partial<Bet>): Bet | null {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) return null;

    return this.createBet(
      template.name,
      template.description,
      template.defaultOptions,
      {
        category: template.category,
        type: template.type,
        autoResolve: !!template.autoResolve,
        autoResolveConfig: template.autoResolve ? {
          gameStatKey: template.autoResolve.gameStatKey || '',
          condition: template.autoResolve.condition || 'equals',
          value: template.autoResolve.value,
          targetOptionId: '' // Set when resolving
        } : undefined,
        ...customConfig
      }
    );
  }

  /**
   * Place a bet
   */
  placeBet(
    viewerId: string,
    viewerName: string,
    betId: string,
    optionId: string,
    points: number
  ): ViewerBet | null {
    const bet = this.bets().find(b => b.id === betId);
    if (!bet || bet.status !== 'open') {
      console.error('Bet not available');
      return null;
    }

    const option = bet.options.find(o => o.id === optionId);
    if (!option) {
      console.error('Invalid option');
      return null;
    }

    // Check viewer has enough points
    const viewer = this.getOrCreateViewer(viewerId, viewerName);
    if (viewer.totalPoints < points) {
      console.error('Insufficient points');
      return null;
    }

    // Deduct points
    this.updateViewerPoints(viewerId, -points);

    // Calculate potential payout (will update after odds recalculation)
    const potentialPayout = Math.floor(points * (option.odds || 2.0));

    // Create viewer bet
    const viewerBet: ViewerBet = {
      id: crypto.randomUUID(),
      betId,
      viewerId,
      viewerName,
      optionId,
      points,
      placedAt: new Date(),
      potentialPayout
    };

    this.viewerBets.update(bets => [...bets, viewerBet]);

    // Update bet statistics
    this.updateBetStats(betId, optionId, points);

    // Recalculate odds
    this.recalculateOdds(betId);

    return viewerBet;
  }

  /**
   * Lock bet (no more bets allowed)
   */
  lockBet(betId: string): void {
    this.bets.update(bets =>
      bets.map(b =>
        b.id === betId && b.status === 'open'
          ? { ...b, status: 'locked' as const, lockedAt: new Date() }
          : b
      )
    );
  }

  /**
   * Resolve bet
   */
  resolveBet(betId: string, winningOptionId: string): BetResult | null {
    const bet = this.bets().find(b => b.id === betId);
    if (!bet || (bet.status !== 'locked' && bet.status !== 'open')) {
      console.error('Bet cannot be resolved');
      return null;
    }

    const winningOption = bet.options.find(o => o.id === winningOptionId);
    if (!winningOption) {
      console.error('Invalid winning option');
      return null;
    }

    // Get all bets for this option
    const winningBets = this.viewerBets().filter(
      vb => vb.betId === betId && vb.optionId === winningOptionId
    );

    const losingBets = this.viewerBets().filter(
      vb => vb.betId === betId && vb.optionId !== winningOptionId
    );

    let totalPayout = 0;
    const winners: BetResult['winners'] = [];

    // Pay out winners
    winningBets.forEach(vb => {
      const payout = Math.floor(vb.points * winningOption.odds);
      const profit = payout - vb.points;

      this.updateViewerPoints(vb.viewerId, payout);
      this.updateViewerStats(vb.viewerId, true);

      // Update viewer bet record
      this.viewerBets.update(bets =>
        bets.map(b =>
          b.id === vb.id
            ? { ...b, won: true, actualPayout: payout }
            : b
        )
      );

      totalPayout += payout;
      winners.push({
        viewerId: vb.viewerId,
        viewerName: vb.viewerName,
        betAmount: vb.points,
        payout,
        profit
      });
    });

    // Update losers
    losingBets.forEach(vb => {
      this.updateViewerStats(vb.viewerId, false);

      this.viewerBets.update(bets =>
        bets.map(b =>
          b.id === vb.id
            ? { ...b, won: false, actualPayout: 0 }
            : b
        )
      );
    });

    // Update bet status
    this.bets.update(bets =>
      bets.map(b =>
        b.id === betId
          ? {
              ...b,
              status: 'resolved' as const,
              resolvedAt: new Date(),
              winningOptionId
            }
          : b
      )
    );

    const result: BetResult = {
      betId,
      winningOption,
      totalPayout,
      winners,
      losers: losingBets.length
    };

    return result;
  }

  /**
   * Auto-resolve bet based on game stats
   */
  autoResolveBet(betId: string, gameStats: Record<string, any>): BetResult | null {
    const bet = this.bets().find(b => b.id === betId);
    if (!bet || !bet.autoResolve || !bet.autoResolveConfig) {
      return null;
    }

    const config = bet.autoResolveConfig;
    const statValue = gameStats[config.gameStatKey];

    if (statValue === undefined) {
      console.error(`Game stat '${config.gameStatKey}' not found`);
      return null;
    }

    // Determine winning option based on condition
    let winningOptionId: string | null = null;

    switch (config.condition) {
      case 'equals':
        winningOptionId = statValue === config.value ? bet.options[0].id : bet.options[1].id;
        break;

      case 'greater':
        winningOptionId = statValue > config.value ? bet.options[0].id : bet.options[1].id;
        break;

      case 'less':
        winningOptionId = statValue < config.value ? bet.options[0].id : bet.options[1].id;
        break;

      case 'between':
        if (Array.isArray(config.value) && config.value.length === 2) {
          winningOptionId = (statValue >= config.value[0] && statValue <= config.value[1])
            ? bet.options[0].id
            : bet.options[1].id;
        }
        break;

      case 'contains':
        winningOptionId = String(statValue).includes(String(config.value))
          ? bet.options[0].id
          : bet.options[1].id;
        break;
    }

    if (!winningOptionId) {
      console.error('Could not determine winning option');
      return null;
    }

    return this.resolveBet(betId, winningOptionId);
  }

  /**
   * Cancel bet (refund all bets)
   */
  cancelBet(betId: string): void {
    const betViewerBets = this.viewerBets().filter(vb => vb.betId === betId);

    // Refund all bets
    betViewerBets.forEach(vb => {
      this.updateViewerPoints(vb.viewerId, vb.points);
    });

    // Update bet status
    this.bets.update(bets =>
      bets.map(b =>
        b.id === betId
          ? { ...b, status: 'cancelled' as const }
          : b
      )
    );

    // Remove viewer bets
    this.viewerBets.update(bets => bets.filter(vb => vb.betId !== betId));
  }

  /**
   * Get or create viewer points record
   */
  private getOrCreateViewer(viewerId: string, viewerName: string): ViewerPoints {
    let viewer = this.viewerPoints().find(v => v.viewerId === viewerId);

    if (!viewer) {
      viewer = {
        viewerId,
        viewerName,
        totalPoints: this.defaultStartingPoints,
        lifetimeEarned: this.defaultStartingPoints,
        lifetimeSpent: 0,
        totalBets: 0,
        betsWon: 0,
        betsLost: 0,
        winRate: 0,
        rank: 0,
        lastUpdated: new Date()
      };

      this.viewerPoints.update(viewers => [...viewers, viewer!]);
    }

    return viewer;
  }

  /**
   * Update viewer points
   */
  private updateViewerPoints(viewerId: string, delta: number): void {
    this.viewerPoints.update(viewers =>
      viewers.map(v => {
        if (v.viewerId === viewerId) {
          const newTotal = v.totalPoints + delta;
          return {
            ...v,
            totalPoints: Math.max(0, newTotal),
            lifetimeEarned: delta > 0 ? v.lifetimeEarned + delta : v.lifetimeEarned,
            lifetimeSpent: delta < 0 ? v.lifetimeSpent + Math.abs(delta) : v.lifetimeSpent,
            lastUpdated: new Date()
          };
        }
        return v;
      })
    );
  }

  /**
   * Update viewer bet statistics
   */
  private updateViewerStats(viewerId: string, won: boolean): void {
    this.viewerPoints.update(viewers =>
      viewers.map(v => {
        if (v.viewerId === viewerId) {
          const totalBets = v.totalBets + 1;
          const betsWon = won ? v.betsWon + 1 : v.betsWon;
          const betsLost = won ? v.betsLost : v.betsLost + 1;
          const winRate = totalBets > 0 ? (betsWon / totalBets) * 100 : 0;

          return {
            ...v,
            totalBets,
            betsWon,
            betsLost,
            winRate,
            lastUpdated: new Date()
          };
        }
        return v;
      })
    );
  }

  /**
   * Update bet statistics
   */
  private updateBetStats(betId: string, optionId: string, points: number): void {
    this.bets.update(bets =>
      bets.map(b => {
        if (b.id === betId) {
          return {
            ...b,
            totalPoints: b.totalPoints + points,
            totalBets: b.totalBets + 1,
            options: b.options.map(o =>
              o.id === optionId
                ? {
                    ...o,
                    totalPoints: o.totalPoints + points,
                    totalBettors: o.totalBettors + 1
                  }
                : o
            )
          };
        }
        return b;
      })
    );
  }

  /**
   * Recalculate odds based on betting distribution
   */
  private recalculateOdds(betId: string): void {
    this.bets.update(bets =>
      bets.map(b => {
        if (b.id === betId && b.totalPoints > 0) {
          return {
            ...b,
            options: b.options.map(o => {
              // Calculate odds: total pool / option pool
              // Higher odds for options with less points
              const odds = o.totalPoints > 0
                ? Math.max(1.1, b.totalPoints / o.totalPoints)
                : 2.0;

              return { ...o, odds: Math.round(odds * 100) / 100 };
            })
          };
        }
        return b;
      })
    );
  }

  /**
   * Give daily bonus to viewer
   */
  giveDailyBonus(viewerId: string): void {
    this.updateViewerPoints(viewerId, this.dailyBonus);
  }

  /**
   * Get viewer's active bets
   */
  getViewerActiveBets(viewerId: string): ViewerBet[] {
    const activeBetIds = this.activeBets().map(b => b.id);
    return this.viewerBets().filter(
      vb => vb.viewerId === viewerId && activeBetIds.includes(vb.betId)
    );
  }

  /**
   * Get viewer's bet history
   */
  getViewerBetHistory(viewerId: string): ViewerBet[] {
    return this.viewerBets()
      .filter(vb => vb.viewerId === viewerId)
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
  }

  /**
   * Get bets for specific game
   */
  getGameBets(gameName: string): Bet[] {
    return this.bets().filter(b => b.game === gameName);
  }

  /**
   * Delete bet
   */
  deleteBet(betId: string): void {
    this.bets.update(bets => bets.filter(b => b.id !== betId));
    this.viewerBets.update(bets => bets.filter(vb => vb.betId !== betId));
  }
}
