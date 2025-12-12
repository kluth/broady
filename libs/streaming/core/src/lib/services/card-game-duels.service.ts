import { Injectable, signal, computed, inject } from '@angular/core';
import { LorcanaCardService, LorcanaCard } from './lorcana-card.service';
import { PokemonTcgService, PokemonCard } from './pokemon-tcg.service';

/**
 * Card Game Duels Service
 * Allows viewers to duel each other in Lorcana or Pokémon TCG in chat
 */

export type GameType = 'lorcana' | 'pokemon';
export type DuelState = 'waiting' | 'active' | 'finished';
export type TurnPhase = 'draw' | 'main' | 'attack' | 'end';

export interface Player {
  username: string;
  deck: DuelCard[];
  hand: DuelCard[];
  field: DuelCard[];
  discardPile: DuelCard[];
  health: number;
  inkPoints: number; // Lorcana
  energyCards: number; // Pokemon
  hasDrawn: boolean;
}

export interface DuelCard {
  id: string;
  name: string;
  cost: number;
  power?: number; // Attack/Strength
  defense?: number; // HP/Willpower
  type: string;
  abilities?: string[];
  isExhausted?: boolean; // Tapped/Exhausted state
}

export interface Duel {
  id: string;
  gameType: GameType;
  challenger: Player;
  opponent: Player;
  currentTurn: 'challenger' | 'opponent';
  turnPhase: TurnPhase;
  turnNumber: number;
  state: DuelState;
  winner?: string;
  startTime: Date;
  lastAction?: Date;
  spectators: string[];
}

export interface DuelChallenge {
  id: string;
  challenger: string;
  opponent: string;
  gameType: GameType;
  timestamp: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CardGameDuelsService {
  private lorcanaService = inject(LorcanaCardService);
  private pokemonService = inject(PokemonTcgService);

  readonly activeDuels = signal<Duel[]>([]);
  readonly pendingChallenges = signal<DuelChallenge[]>([]);
  readonly duelHistory = signal<Duel[]>([]);

  readonly stats = computed(() => ({
    activeMatches: this.activeDuels().length,
    pendingChallenges: this.pendingChallenges().length,
    totalMatches: this.duelHistory().length + this.activeDuels().length,
    lorcanaMatches: this.duelHistory().filter(d => d.gameType === 'lorcana').length,
    pokemonMatches: this.duelHistory().filter(d => d.gameType === 'pokemon').length
  }));

  /**
   * Challenge another player to a duel
   */
  async challenge(challenger: string, opponent: string, gameType: GameType): Promise<string> {
    // Check if user is already in a duel
    if (this.isPlayerInActiveDuel(challenger)) {
      return `${challenger}, you are already in an active duel!`;
    }

    if (this.isPlayerInActiveDuel(opponent)) {
      return `${opponent} is already in an active duel!`;
    }

    // Check if challenge already exists
    const existingChallenge = this.pendingChallenges().find(
      c => c.challenger === challenger && c.opponent === opponent
    );

    if (existingChallenge) {
      return `${challenger}, you already have a pending challenge with ${opponent}!`;
    }

    // Create challenge
    const challenge: DuelChallenge = {
      id: crypto.randomUUID(),
      challenger,
      opponent,
      gameType,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
    };

    this.pendingChallenges.update(challenges => [...challenges, challenge]);

    // Auto-expire challenge
    setTimeout(() => {
      this.expireChallenge(challenge.id);
    }, 2 * 60 * 1000);

    const gameName = gameType === 'lorcana' ? 'Lorcana' : 'Pokémon TCG';
    return `🎴 ${challenger} has challenged ${opponent} to a ${gameName} duel! Type !accept to begin!`;
  }

  /**
   * Accept a duel challenge
   */
  async acceptChallenge(opponent: string): Promise<string> {
    const challenge = this.pendingChallenges().find(c => c.opponent === opponent);

    if (!challenge) {
      return `${opponent}, you don't have any pending challenges!`;
    }

    // Remove challenge
    this.pendingChallenges.update(challenges =>
      challenges.filter(c => c.id !== challenge.id)
    );

    // Create duel
    const duel = await this.createDuel(challenge.challenger, challenge.opponent, challenge.gameType);

    return `🎮 Duel started! ${challenge.challenger} vs ${challenge.opponent}\\nType !duelhelp for commands`;
  }

  /**
   * Decline a duel challenge
   */
  declineChallenge(opponent: string): string {
    const challenge = this.pendingChallenges().find(c => c.opponent === opponent);

    if (!challenge) {
      return `${opponent}, you don't have any pending challenges!`;
    }

    this.pendingChallenges.update(challenges =>
      challenges.filter(c => c.id !== challenge.id)
    );

    return `${opponent} has declined the duel challenge from ${challenge.challenger}.`;
  }

  /**
   * Create a new duel
   */
  private async createDuel(challenger: string, opponent: string, gameType: GameType): Promise<Duel> {
    const duel: Duel = {
      id: crypto.randomUUID(),
      gameType,
      challenger: await this.createPlayer(challenger, gameType),
      opponent: await this.createPlayer(opponent, gameType),
      currentTurn: 'challenger',
      turnPhase: 'draw',
      turnNumber: 1,
      state: 'active',
      startTime: new Date(),
      spectators: []
    };

    this.activeDuels.update(duels => [...duels, duel]);

    return duel;
  }

  /**
   * Create a player with a random deck
   */
  private async createPlayer(username: string, gameType: GameType): Promise<Player> {
    const deck = await this.generateRandomDeck(gameType);

    const player: Player = {
      username,
      deck,
      hand: [],
      field: [],
      discardPile: [],
      health: gameType === 'lorcana' ? 20 : 60, // Lorcana uses 20 lore, Pokemon uses 60 HP
      inkPoints: 0,
      energyCards: 0,
      hasDrawn: false
    };

    // Draw starting hand
    for (let i = 0; i < 5; i++) {
      this.drawCard(player);
    }

    return player;
  }

  /**
   * Generate a random deck
   */
  private async generateRandomDeck(gameType: GameType): Promise<DuelCard[]> {
    const deck: DuelCard[] = [];

    if (gameType === 'lorcana') {
      // Generate simplified Lorcana deck
      for (let i = 0; i < 30; i++) {
        deck.push({
          id: crypto.randomUUID(),
          name: `Card ${i + 1}`,
          cost: Math.floor(Math.random() * 7) + 1,
          power: Math.floor(Math.random() * 5) + 1,
          defense: Math.floor(Math.random() * 5) + 1,
          type: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'][Math.floor(Math.random() * 6)]
        });
      }
    } else {
      // Generate simplified Pokemon deck
      for (let i = 0; i < 30; i++) {
        deck.push({
          id: crypto.randomUUID(),
          name: `Pokemon ${i + 1}`,
          cost: Math.floor(Math.random() * 4) + 1,
          power: Math.floor(Math.random() * 50) + 10,
          defense: Math.floor(Math.random() * 50) + 40,
          type: ['Fire', 'Water', 'Grass', 'Electric', 'Psychic'][Math.floor(Math.random() * 5)]
        });
      }
    }

    return this.shuffleDeck(deck);
  }

  /**
   * Shuffle deck
   */
  private shuffleDeck(deck: DuelCard[]): DuelCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Draw a card
   */
  private drawCard(player: Player): boolean {
    if (player.deck.length === 0) {
      return false;
    }

    const card = player.deck.shift()!;
    player.hand.push(card);
    return true;
  }

  /**
   * Play a card from hand
   */
  async playCard(username: string, cardIndex: number): Promise<string> {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    const player = this.getPlayer(duel, username);
    const isPlayerTurn = this.isPlayerTurn(duel, username);

    if (!isPlayerTurn) {
      return `${username}, it's not your turn!`;
    }

    if (duel.turnPhase !== 'main') {
      return `You can only play cards during your main phase!`;
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return `Invalid card index! You have ${player.hand.length} cards in hand.`;
    }

    const card = player.hand[cardIndex];

    // Check if player has enough resources
    const canAfford = duel.gameType === 'lorcana'
      ? player.inkPoints >= card.cost
      : player.energyCards >= card.cost;

    if (!canAfford) {
      const resource = duel.gameType === 'lorcana' ? 'ink' : 'energy';
      return `Not enough ${resource}! Need ${card.cost}, have ${duel.gameType === 'lorcana' ? player.inkPoints : player.energyCards}`;
    }

    // Play the card
    player.hand.splice(cardIndex, 1);
    player.field.push(card);

    // Deduct cost
    if (duel.gameType === 'lorcana') {
      player.inkPoints -= card.cost;
    } else {
      player.energyCards -= card.cost;
    }

    this.updateDuel(duel);

    return `${username} played ${card.name}! (Power: ${card.power}, Defense: ${card.defense})`;
  }

  /**
   * Attack with a card
   */
  async attack(username: string, attackerIndex: number, targetIndex?: number): Promise<string> {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    const player = this.getPlayer(duel, username);
    const opponent = this.getOpponent(duel, username);

    if (!this.isPlayerTurn(duel, username)) {
      return `${username}, it's not your turn!`;
    }

    if (duel.turnPhase !== 'attack') {
      return `You can only attack during your attack phase!`;
    }

    if (attackerIndex < 0 || attackerIndex >= player.field.length) {
      return `Invalid attacker index!`;
    }

    const attacker = player.field[attackerIndex];

    if (attacker.isExhausted) {
      return `${attacker.name} is exhausted and cannot attack!`;
    }

    // Attack opponent directly or their creature
    if (targetIndex === undefined || opponent.field.length === 0) {
      // Direct attack
      opponent.health -= attacker.power || 0;
      attacker.isExhausted = true;

      this.updateDuel(duel);

      if (opponent.health <= 0) {
        return await this.endDuel(duel, username);
      }

      return `${attacker.name} attacked ${opponent.username} for ${attacker.power} damage! (HP: ${opponent.health})`;
    } else {
      // Attack opponent's creature
      if (targetIndex < 0 || targetIndex >= opponent.field.length) {
        return `Invalid target index!`;
      }

      const target = opponent.field[targetIndex];

      // Battle
      target.defense! -= attacker.power || 0;
      attacker.defense! -= target.power || 0;
      attacker.isExhausted = true;

      // Check if cards are destroyed
      let result = `${attacker.name} attacked ${target.name}!\\n`;

      if (target.defense! <= 0) {
        opponent.field.splice(targetIndex, 1);
        opponent.discardPile.push(target);
        result += `${target.name} was defeated!\\n`;
      }

      if (attacker.defense! <= 0) {
        player.field.splice(attackerIndex, 1);
        player.discardPile.push(attacker);
        result += `${attacker.name} was defeated!`;
      }

      this.updateDuel(duel);

      return result;
    }
  }

  /**
   * End turn
   */
  async endTurn(username: string): Promise<string> {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    if (!this.isPlayerTurn(duel, username)) {
      return `${username}, it's not your turn!`;
    }

    // Refresh cards
    const player = this.getPlayer(duel, username);
    player.field.forEach(card => card.isExhausted = false);
    player.hasDrawn = false;

    // Switch turns
    duel.currentTurn = duel.currentTurn === 'challenger' ? 'opponent' : 'challenger';
    duel.turnNumber++;
    duel.turnPhase = 'draw';

    // Add resources for new turn
    const nextPlayer = this.getPlayer(duel, duel.currentTurn === 'challenger' ? duel.challenger.username : duel.opponent.username);

    if (duel.gameType === 'lorcana') {
      nextPlayer.inkPoints = Math.min(nextPlayer.inkPoints + 1, 10);
    } else {
      nextPlayer.energyCards = Math.min(nextPlayer.energyCards + 1, 10);
    }

    this.updateDuel(duel);

    return `Turn ${duel.turnNumber}: ${nextPlayer.username}'s turn! (Draw Phase)`;
  }

  /**
   * View hand
   */
  viewHand(username: string): string {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    const player = this.getPlayer(duel, username);

    if (player.hand.length === 0) {
      return `Your hand is empty!`;
    }

    let handStr = `🃏 Your Hand:\\n`;
    player.hand.forEach((card, idx) => {
      handStr += `${idx}: ${card.name} (Cost: ${card.cost}, Pow: ${card.power}, Def: ${card.defense})\\n`;
    });

    return handStr;
  }

  /**
   * View field
   */
  viewField(username: string): string {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    const player = this.getPlayer(duel, username);
    const opponent = this.getOpponent(duel, username);

    let fieldStr = `⚔️ Battlefield:\\n`;
    fieldStr += `\\n${player.username} (HP: ${player.health}):\\n`;

    if (player.field.length === 0) {
      fieldStr += `  No cards on field\\n`;
    } else {
      player.field.forEach((card, idx) => {
        const status = card.isExhausted ? '(Exhausted)' : '';
        fieldStr += `  ${idx}: ${card.name} ${status} (Pow: ${card.power}, Def: ${card.defense})\\n`;
      });
    }

    fieldStr += `\\n${opponent.username} (HP: ${opponent.health}):\\n`;

    if (opponent.field.length === 0) {
      fieldStr += `  No cards on field`;
    } else {
      opponent.field.forEach((card, idx) => {
        const status = card.isExhausted ? '(Exhausted)' : '';
        fieldStr += `  ${idx}: ${card.name} ${status} (Pow: ${card.power}, Def: ${card.defense})\\n`;
      });
    }

    return fieldStr;
  }

  /**
   * Forfeit duel
   */
  forfeit(username: string): string {
    const duel = this.findPlayerDuel(username);
    if (!duel) {
      return `${username}, you are not in an active duel!`;
    }

    const opponent = this.getOpponent(duel, username);
    return this.endDuel(duel, opponent.username, `${username} forfeited the match!`);
  }

  /**
   * End a duel
   */
  private async endDuel(duel: Duel, winner: string, reason?: string): Promise<string> {
    duel.state = 'finished';
    duel.winner = winner;

    // Move to history
    this.duelHistory.update(history => [duel, ...history]);
    this.activeDuels.update(duels => duels.filter(d => d.id !== duel.id));

    const loser = winner === duel.challenger.username ? duel.opponent.username : duel.challenger.username;

    let message = `🏆 Game Over! ${winner} wins!`;
    if (reason) {
      message += ` ${reason}`;
    }

    return message;
  }

  /**
   * Helper methods
   */
  private findPlayerDuel(username: string): Duel | undefined {
    return this.activeDuels().find(
      d => d.challenger.username === username || d.opponent.username === username
    );
  }

  private isPlayerInActiveDuel(username: string): boolean {
    return this.findPlayerDuel(username) !== undefined;
  }

  private getPlayer(duel: Duel, username: string): Player {
    return duel.challenger.username === username ? duel.challenger : duel.opponent;
  }

  private getOpponent(duel: Duel, username: string): Player {
    return duel.challenger.username === username ? duel.opponent : duel.challenger;
  }

  private isPlayerTurn(duel: Duel, username: string): boolean {
    const player = this.getPlayer(duel, username);
    return (duel.currentTurn === 'challenger' && player === duel.challenger) ||
           (duel.currentTurn === 'opponent' && player === duel.opponent);
  }

  private updateDuel(duel: Duel): void {
    duel.lastAction = new Date();
    this.activeDuels.update(duels =>
      duels.map(d => d.id === duel.id ? duel : d)
    );
  }

  private expireChallenge(challengeId: string): void {
    this.pendingChallenges.update(challenges =>
      challenges.filter(c => c.id !== challengeId)
    );
  }

  /**
   * Get duel help text
   */
  getDuelHelp(): string {
    return `🎴 Card Duel Commands:
!challenge <player> <lorcana|pokemon> - Challenge a player
!accept - Accept a duel challenge
!decline - Decline a duel challenge
!hand - View your hand
!field - View the battlefield
!play <cardIndex> - Play a card from hand
!attack <attackerIndex> [targetIndex] - Attack with a card
!endturn - End your turn
!forfeit - Forfeit the match
!duelstats - View duel statistics`;
  }
}
