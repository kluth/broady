import { Injectable, signal, inject } from '@angular/core';
import { LorcanaCardService, LorcanaCard } from './lorcana-card.service';
import { PokemonTcgService, PokemonCard } from './pokemon-tcg.service';

/**
 * Card Chat Commands Service
 * Handles chat commands for card game lookups
 *
 * Supported Commands:
 * - !lorcana <card name> - Look up a Lorcana card
 * - !pokemon <card name> - Look up a Pokemon card
 * - !randomlorcana - Get a random Lorcana card
 * - !randompokemon - Get a random Pokemon card
 * - !cardhelp - Show available card commands
 */

export interface ChatCommand {
  command: string;
  description: string;
  usage: string;
  handler: (args: string[], username: string) => Promise<string>;
}

export interface CardCommandHistory {
  id: string;
  username: string;
  command: string;
  args: string[];
  timestamp: Date;
  result: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardChatCommandsService {
  private lorcanaService = inject(LorcanaCardService);
  private pokemonService = inject(PokemonTcgService);

  readonly commandHistory = signal<CardCommandHistory[]>([]);
  readonly lastCardShown = signal<{
    game: 'lorcana' | 'pokemon';
    card: LorcanaCard | PokemonCard;
    timestamp: Date;
  } | null>(null);

  private commands: Map<string, ChatCommand> = new Map();

  constructor() {
    this.registerCommands();
  }

  /**
   * Register all card-related chat commands
   */
  private registerCommands(): void {
    // Lorcana commands
    this.commands.set('!lorcana', {
      command: '!lorcana',
      description: 'Look up a Lorcana card by name',
      usage: '!lorcana <card name>',
      handler: this.handleLorcanaLookup.bind(this)
    });

    this.commands.set('!randomlorcana', {
      command: '!randomlorcana',
      description: 'Get a random Lorcana card',
      usage: '!randomlorcana',
      handler: this.handleRandomLorcana.bind(this)
    });

    // Pokemon commands
    this.commands.set('!pokemon', {
      command: '!pokemon',
      description: 'Look up a Pokemon card by name',
      usage: '!pokemon <card name>',
      handler: this.handlePokemonLookup.bind(this)
    });

    this.commands.set('!randompokemon', {
      command: '!randompokemon',
      description: 'Get a random Pokemon card',
      usage: '!randompokemon',
      handler: this.handleRandomPokemon.bind(this)
    });

    // Help command
    this.commands.set('!cardhelp', {
      command: '!cardhelp',
      description: 'Show available card commands',
      usage: '!cardhelp',
      handler: this.handleHelp.bind(this)
    });
  }

  /**
   * Process a chat message to check for card commands
   */
  async processMessage(message: string, username: string): Promise<string | null> {
    const trimmed = message.trim();
    if (!trimmed.startsWith('!')) {
      return null;
    }

    const parts = trimmed.split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      return null;
    }

    try {
      const result = await command.handler(args, username);

      // Log to history
      this.addToHistory(username, commandName, args, result);

      return result;
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      return `❌ Sorry, there was an error processing your command.`;
    }
  }

  /**
   * Handle Lorcana card lookup
   */
  private async handleLorcanaLookup(args: string[], username: string): Promise<string> {
    if (args.length === 0) {
      return `Usage: !lorcana <card name>. Example: !lorcana Mickey Mouse`;
    }

    const cardName = args.join(' ');
    const cards = await this.lorcanaService.searchByName(cardName);

    if (cards.length === 0) {
      return `🎴 No Lorcana cards found for "${cardName}". Try a different search!`;
    }

    const card = cards[0];
    this.lastCardShown.set({ game: 'lorcana', card, timestamp: new Date() });

    return this.lorcanaService.formatCardForChat(card);
  }

  /**
   * Handle random Lorcana card
   */
  private async handleRandomLorcana(args: string[], username: string): Promise<string> {
    const card = await this.lorcanaService.getRandomCard();

    if (!card) {
      return `🎴 Failed to get a random Lorcana card. Try again!`;
    }

    this.lastCardShown.set({ game: 'lorcana', card, timestamp: new Date() });

    return `🎲 Random Lorcana Card:\n${this.lorcanaService.formatCardForChat(card)}`;
  }

  /**
   * Handle Pokemon card lookup
   */
  private async handlePokemonLookup(args: string[], username: string): Promise<string> {
    if (args.length === 0) {
      return `Usage: !pokemon <card name>. Example: !pokemon Charizard`;
    }

    const cardName = args.join(' ');
    const cards = await this.pokemonService.searchByName(cardName);

    if (cards.length === 0) {
      return `🎴 No Pokémon cards found for "${cardName}". Try a different search!`;
    }

    const card = cards[0];
    this.lastCardShown.set({ game: 'pokemon', card, timestamp: new Date() });

    return this.pokemonService.formatCardForChat(card);
  }

  /**
   * Handle random Pokemon card
   */
  private async handleRandomPokemon(args: string[], username: string): Promise<string> {
    const card = await this.pokemonService.getRandomCard();

    if (!card) {
      return `🎴 Failed to get a random Pokémon card. Try again!`;
    }

    this.lastCardShown.set({ game: 'pokemon', card, timestamp: new Date() });

    return `🎲 Random Pokémon Card:\n${this.pokemonService.formatCardForChat(card)}`;
  }

  /**
   * Handle help command
   */
  private async handleHelp(args: string[], username: string): Promise<string> {
    let helpText = '🎴 Available Card Commands:\n\n';

    this.commands.forEach(cmd => {
      helpText += `${cmd.command} - ${cmd.description}\n`;
      helpText += `  Usage: ${cmd.usage}\n\n`;
    });

    return helpText;
  }

  /**
   * Add command to history
   */
  private addToHistory(username: string, command: string, args: string[], result: string): void {
    const entry: CardCommandHistory = {
      id: crypto.randomUUID(),
      username,
      command,
      args,
      timestamp: new Date(),
      result
    };

    this.commandHistory.update(history => [entry, ...history].slice(0, 100));
  }

  /**
   * Get all available commands
   */
  getAvailableCommands(): ChatCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Check if message is a card command
   */
  isCardCommand(message: string): boolean {
    const commandName = message.trim().split(' ')[0].toLowerCase();
    return this.commands.has(commandName);
  }

  /**
   * Get command statistics
   */
  getCommandStats() {
    const history = this.commandHistory();
    const commandCounts = new Map<string, number>();

    history.forEach(entry => {
      const count = commandCounts.get(entry.command) || 0;
      commandCounts.set(entry.command, count + 1);
    });

    return {
      totalCommands: history.length,
      uniqueUsers: new Set(history.map(h => h.username)).size,
      commandCounts: Object.fromEntries(commandCounts),
      mostUsedCommand: this.getMostUsedCommand(commandCounts),
      lorcanaLookups: commandCounts.get('!lorcana') || 0,
      pokemonLookups: commandCounts.get('!pokemon') || 0
    };
  }

  /**
   * Get most used command
   */
  private getMostUsedCommand(counts: Map<string, number>): string {
    let maxCount = 0;
    let mostUsed = '';

    counts.forEach((count, command) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = command;
      }
    });

    return mostUsed;
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory.set([]);
  }

  /**
   * Get recent commands by user
   */
  getUserHistory(username: string): CardCommandHistory[] {
    return this.commandHistory().filter(h => h.username === username);
  }

  /**
   * Example integration with chat service
   * This method would be called by the main chat service when a message is received
   */
  async handleChatMessage(message: string, username: string): Promise<{
    isCardCommand: boolean;
    response?: string;
  }> {
    if (!this.isCardCommand(message)) {
      return { isCardCommand: false };
    }

    const response = await this.processMessage(message, username);

    return {
      isCardCommand: true,
      response: response || undefined
    };
  }
}
