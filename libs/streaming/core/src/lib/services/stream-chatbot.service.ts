import { Injectable, signal, computed, inject } from '@angular/core';
import { StreamingService } from './streaming.service';
import { GameDetectionService } from './game-detection.service';
import { ViewerEngagementService } from './viewer-engagement.service';
import { DonationsService } from './donations.service';
import { CardChatCommandsService } from './card-chat-commands.service';

/**
 * Stream Chatbot Service
 * Comprehensive chatbot with built-in and custom commands
 */

export interface ChatCommand {
  id: string;
  trigger: string;
  response: string;
  type: 'builtin' | 'custom';
  enabled: boolean;
  cooldown: number; // seconds
  lastUsed?: Date;
  usageCount: number;
  permission: 'everyone' | 'subscriber' | 'moderator' | 'broadcaster';
  aliases?: string[];
  category: CommandCategory;
}

export type CommandCategory =
  | 'info'
  | 'social'
  | 'game'
  | 'moderation'
  | 'fun'
  | 'utility'
  | 'custom';

export interface ChatbotConfig {
  enabled: boolean;
  prefix: string;
  respondToMentions: boolean;
  globalCooldown: number;
  autoGreetNewFollowers: boolean;
  autoThankSubscribers: boolean;
  autoThankDonations: boolean;
  greetingMessage: string;
  subscriptionMessage: string;
  donationMessage: string;
}

export interface CommandUsage {
  commandId: string;
  username: string;
  timestamp: Date;
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamChatbotService {
  private streaming = inject(StreamingService);
  private gameDetection = inject(GameDetectionService);
  private viewerEngagement = inject(ViewerEngagementService);
  private donations = inject(DonationsService);
  private cardCommands = inject(CardChatCommandsService);

  readonly config = signal<ChatbotConfig>({
    enabled: true,
    prefix: '!',
    respondToMentions: true,
    globalCooldown: 3,
    autoGreetNewFollowers: true,
    autoThankSubscribers: true,
    autoThankDonations: true,
    greetingMessage: 'Welcome to the stream, {user}! 👋',
    subscriptionMessage: 'Thank you for subscribing, {user}! 🎉',
    donationMessage: 'Thank you {user} for the ${amount} donation! 💝'
  });

  readonly commands = signal<ChatCommand[]>([]);
  readonly commandHistory = signal<CommandUsage[]>([]);

  readonly stats = computed(() => ({
    totalCommands: this.commands().length,
    enabledCommands: this.commands().filter(c => c.enabled).length,
    customCommands: this.commands().filter(c => c.type === 'custom').length,
    totalUsage: this.commands().reduce((sum, c) => sum + c.usageCount, 0),
    mostUsedCommand: this.getMostUsedCommand()
  }));

  private streamStartTime: Date | null = null;

  constructor() {
    this.initializeBuiltInCommands();
    this.loadConfig();
    this.loadCustomCommands();
    this.setupStreamListeners();
  }

  /**
   * Initialize built-in commands
   */
  private initializeBuiltInCommands(): void {
    const builtInCommands: Omit<ChatCommand, 'id' | 'usageCount' | 'lastUsed'>[] = [
      {
        trigger: 'uptime',
        response: 'Stream uptime: {uptime}',
        type: 'builtin',
        enabled: true,
        cooldown: 10,
        permission: 'everyone',
        category: 'info',
        aliases: ['time']
      },
      {
        trigger: 'stats',
        response: '📊 Stream Stats - Viewers: {viewers} | Followers: {followers} | Uptime: {uptime}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'info'
      },
      {
        trigger: 'game',
        response: 'Currently playing: {game}',
        type: 'builtin',
        enabled: true,
        cooldown: 10,
        permission: 'everyone',
        category: 'game',
        aliases: ['playing']
      },
      {
        trigger: 'title',
        response: 'Stream title: {title}',
        type: 'builtin',
        enabled: true,
        cooldown: 10,
        permission: 'everyone',
        category: 'info'
      },
      {
        trigger: 'viewers',
        response: '👀 Current viewers: {viewers}',
        type: 'builtin',
        enabled: true,
        cooldown: 15,
        permission: 'everyone',
        category: 'info',
        aliases: ['viewercount']
      },
      {
        trigger: 'followers',
        response: '❤️ Follower count: {followers}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'info',
        aliases: ['followcount']
      },
      {
        trigger: 'commands',
        response: 'Available commands: {commandlist}',
        type: 'builtin',
        enabled: true,
        cooldown: 20,
        permission: 'everyone',
        category: 'info',
        aliases: ['help']
      },
      {
        trigger: 'socials',
        response: '🌐 Follow me: Twitter @{twitter} | Instagram @{instagram} | Discord: {discord}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'social'
      },
      {
        trigger: 'discord',
        response: '💬 Join our Discord: {discord}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'social'
      },
      {
        trigger: 'twitter',
        response: '🐦 Follow on Twitter: {twitter}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'social'
      },
      {
        trigger: 'instagram',
        response: '📸 Follow on Instagram: {instagram}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'social'
      },
      {
        trigger: 'youtube',
        response: '📺 Subscribe on YouTube: {youtube}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'social'
      },
      {
        trigger: 'donate',
        response: '💝 Support the stream: {donatelink}',
        type: 'builtin',
        enabled: true,
        cooldown: 60,
        permission: 'everyone',
        category: 'info',
        aliases: ['tip', 'support']
      },
      {
        trigger: 'schedule',
        response: '📅 Stream schedule: Monday-Friday 7pm EST, Weekends 2pm EST',
        type: 'builtin',
        enabled: true,
        cooldown: 60,
        permission: 'everyone',
        category: 'info'
      },
      {
        trigger: 'lurk',
        response: 'Thanks for lurking, {user}! 👀',
        type: 'builtin',
        enabled: true,
        cooldown: 0,
        permission: 'everyone',
        category: 'fun'
      },
      {
        trigger: 'shoutout',
        response: '📣 Shoutout to {target}! Go check them out at twitch.tv/{target}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'moderator',
        category: 'moderation',
        aliases: ['so']
      },
      {
        trigger: 'hype',
        response: '🎉 HYPE HYPE HYPE! Let\'s go chat! 🔥',
        type: 'builtin',
        enabled: true,
        cooldown: 60,
        permission: 'everyone',
        category: 'fun'
      },
      {
        trigger: 'music',
        response: '🎵 Current song: {song}',
        type: 'builtin',
        enabled: true,
        cooldown: 15,
        permission: 'everyone',
        category: 'info',
        aliases: ['song']
      },
      {
        trigger: 'specs',
        response: '💻 PC Specs: {specs}',
        type: 'builtin',
        enabled: true,
        cooldown: 30,
        permission: 'everyone',
        category: 'info',
        aliases: ['pc', 'setup']
      },
      {
        trigger: 'merch',
        response: '👕 Check out the merch: {merchlink}',
        type: 'builtin',
        enabled: true,
        cooldown: 60,
        permission: 'everyone',
        category: 'info'
      }
    ];

    const commands = builtInCommands.map(cmd => ({
      ...cmd,
      id: crypto.randomUUID(),
      usageCount: 0
    }));

    this.commands.set(commands);
  }

  /**
   * Setup stream event listeners
   */
  private setupStreamListeners(): void {
    // Listen for stream start
    this.streaming.status.subscribe(status => {
      if (status === 'live' && !this.streamStartTime) {
        this.streamStartTime = new Date();
      } else if (status === 'offline') {
        this.streamStartTime = null;
      }
    });
  }

  /**
   * Process incoming chat message
   */
  async processMessage(message: string, username: string, userPermission: ChatCommand['permission'] = 'everyone'): Promise<string | null> {
    const cfg = this.config();

    if (!cfg.enabled) {
      return null;
    }

    // Check for card commands first (they have their own prefix handling)
    const cardResponse = await this.cardCommands.handleChatMessage(message, username);
    if (cardResponse.isCardCommand && cardResponse.response) {
      return cardResponse.response;
    }

    // Check if message starts with command prefix
    if (!message.startsWith(cfg.prefix)) {
      return null;
    }

    // Parse command
    const parts = message.slice(cfg.prefix.length).trim().split(' ');
    const commandTrigger = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Find command (including aliases)
    const command = this.commands().find(cmd =>
      cmd.enabled && (
        cmd.trigger.toLowerCase() === commandTrigger ||
        cmd.aliases?.some(alias => alias.toLowerCase() === commandTrigger)
      )
    );

    if (!command) {
      return null;
    }

    // Check permission
    if (!this.hasPermission(userPermission, command.permission)) {
      return '⚠️ You don\'t have permission to use this command.';
    }

    // Check cooldown
    if (!this.canExecuteCommand(command)) {
      const remaining = this.getCooldownRemaining(command);
      return `⏱️ Command on cooldown. Wait ${remaining}s`;
    }

    // Execute command
    const response = await this.executeCommand(command, username, args);

    // Update usage
    this.updateCommandUsage(command, username, response);

    return response;
  }

  /**
   * Execute command and replace placeholders
   */
  private async executeCommand(command: ChatCommand, username: string, args: string[]): Promise<string> {
    let response = command.response;

    // Replace placeholders
    response = response.replace(/{user}/g, username);
    response = response.replace(/{uptime}/g, this.getUptime());
    response = response.replace(/{viewers}/g, this.getViewerCount().toString());
    response = response.replace(/{followers}/g, this.getFollowerCount().toString());
    response = response.replace(/{game}/g, this.getCurrentGame());
    response = response.replace(/{title}/g, this.getStreamTitle());
    response = response.replace(/{commandlist}/g, this.getCommandList());
    response = response.replace(/{song}/g, this.getCurrentSong());

    // Social placeholders (would be configured by user)
    response = response.replace(/{twitter}/g, '@yourtwitter');
    response = response.replace(/{instagram}/g, '@yourinstagram');
    response = response.replace(/{discord}/g, 'discord.gg/yourserver');
    response = response.replace(/{youtube}/g, 'youtube.com/@yourchannel');
    response = response.replace(/{donatelink}/g, 'paypal.me/yourlink');
    response = response.replace(/{merchlink}/g, 'store.example.com');
    response = response.replace(/{specs}/g, 'i9-12900K, RTX 4090, 32GB RAM');

    // Args-based replaceholders
    if (args.length > 0) {
      response = response.replace(/{target}/g, args[0]);
      response = response.replace(/{amount}/g, args[0]);
    }

    return response;
  }

  /**
   * Check if user has required permission
   */
  private hasPermission(userPerm: ChatCommand['permission'], requiredPerm: ChatCommand['permission']): boolean {
    const permLevels = { everyone: 0, subscriber: 1, moderator: 2, broadcaster: 3 };
    return permLevels[userPerm] >= permLevels[requiredPerm];
  }

  /**
   * Check if command can be executed (cooldown)
   */
  private canExecuteCommand(command: ChatCommand): boolean {
    if (command.cooldown === 0) return true;
    if (!command.lastUsed) return true;

    const elapsed = (Date.now() - command.lastUsed.getTime()) / 1000;
    return elapsed >= command.cooldown;
  }

  /**
   * Get remaining cooldown time
   */
  private getCooldownRemaining(command: ChatCommand): number {
    if (!command.lastUsed) return 0;
    const elapsed = (Date.now() - command.lastUsed.getTime()) / 1000;
    return Math.ceil(command.cooldown - elapsed);
  }

  /**
   * Update command usage statistics
   */
  private updateCommandUsage(command: ChatCommand, username: string, response: string): void {
    this.commands.update(commands =>
      commands.map(cmd =>
        cmd.id === command.id
          ? { ...cmd, usageCount: cmd.usageCount + 1, lastUsed: new Date() }
          : cmd
      )
    );

    this.commandHistory.update(history => [
      { commandId: command.id, username, timestamp: new Date(), response },
      ...history.slice(0, 99) // Keep last 100
    ]);
  }

  /**
   * Add custom command
   */
  addCustomCommand(trigger: string, response: string, options?: Partial<ChatCommand>): void {
    const command: ChatCommand = {
      id: crypto.randomUUID(),
      trigger: trigger.toLowerCase(),
      response,
      type: 'custom',
      enabled: true,
      cooldown: 10,
      permission: 'everyone',
      usageCount: 0,
      category: 'custom',
      ...options
    };

    this.commands.update(commands => [...commands, command]);
    this.saveCustomCommands();
  }

  /**
   * Edit command
   */
  editCommand(id: string, updates: Partial<ChatCommand>): void {
    this.commands.update(commands =>
      commands.map(cmd => cmd.id === id ? { ...cmd, ...updates } : cmd)
    );
    this.saveCustomCommands();
  }

  /**
   * Delete command
   */
  deleteCommand(id: string): void {
    this.commands.update(commands => commands.filter(cmd => cmd.id !== id));
    this.saveCustomCommands();
  }

  /**
   * Toggle command enabled state
   */
  toggleCommand(id: string): void {
    this.commands.update(commands =>
      commands.map(cmd => cmd.id === id ? { ...cmd, enabled: !cmd.enabled } : cmd)
    );
    this.saveCustomCommands();
  }

  /**
   * Get uptime
   */
  private getUptime(): string {
    if (!this.streamStartTime) return 'Stream offline';

    const elapsed = Date.now() - this.streamStartTime.getTime();
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
  }

  /**
   * Get viewer count
   */
  private getViewerCount(): number {
    return this.viewerEngagement.analytics().currentViewers || 0;
  }

  /**
   * Get follower count
   */
  private getFollowerCount(): number {
    return this.viewerEngagement.analytics().totalFollowers || 0;
  }

  /**
   * Get current game
   */
  private getCurrentGame(): string {
    return this.gameDetection.currentGame()?.name || 'No game detected';
  }

  /**
   * Get stream title
   */
  private getStreamTitle(): string {
    // Would be pulled from streaming platform API
    return 'Epic Gaming Session!';
  }

  /**
   * Get command list
   */
  private getCommandList(): string {
    const enabledCommands = this.commands()
      .filter(cmd => cmd.enabled && cmd.permission === 'everyone')
      .map(cmd => this.config().prefix + cmd.trigger);

    return enabledCommands.slice(0, 10).join(', ') + (enabledCommands.length > 10 ? '...' : '');
  }

  /**
   * Get current song
   */
  private getCurrentSong(): string {
    // Would integrate with Spotify/music service
    return 'Artist - Song Title';
  }

  /**
   * Get most used command
   */
  private getMostUsedCommand(): string {
    const commands = this.commands();
    if (commands.length === 0) return '';

    return commands.reduce((max, cmd) =>
      cmd.usageCount > max.usageCount ? cmd : max
    ).trigger;
  }

  /**
   * Handle new follower
   */
  handleNewFollower(username: string): string | null {
    const cfg = this.config();
    if (!cfg.autoGreetNewFollowers) return null;

    return cfg.greetingMessage.replace(/{user}/g, username);
  }

  /**
   * Handle new subscriber
   */
  handleNewSubscriber(username: string): string | null {
    const cfg = this.config();
    if (!cfg.autoThankSubscribers) return null;

    return cfg.subscriptionMessage.replace(/{user}/g, username);
  }

  /**
   * Handle donation
   */
  handleDonation(username: string, amount: number): string | null {
    const cfg = this.config();
    if (!cfg.autoThankDonations) return null;

    return cfg.donationMessage
      .replace(/{user}/g, username)
      .replace(/{amount}/g, amount.toString());
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ChatbotConfig>): void {
    this.config.update(cfg => ({ ...cfg, ...updates }));
    this.saveConfig();
  }

  /**
   * Save configuration
   */
  private saveConfig(): void {
    localStorage.setItem('chatbot_config', JSON.stringify(this.config()));
  }

  /**
   * Load configuration
   */
  private loadConfig(): void {
    const saved = localStorage.getItem('chatbot_config');
    if (saved) {
      this.config.set(JSON.parse(saved));
    }
  }

  /**
   * Save custom commands
   */
  private saveCustomCommands(): void {
    const customCommands = this.commands().filter(cmd => cmd.type === 'custom');
    localStorage.setItem('custom_commands', JSON.stringify(customCommands));
  }

  /**
   * Load custom commands
   */
  private loadCustomCommands(): void {
    const saved = localStorage.getItem('custom_commands');
    if (saved) {
      const customCommands = JSON.parse(saved);
      this.commands.update(commands => [...commands, ...customCommands]);
    }
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory.set([]);
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): ChatCommand[] {
    return this.commands().filter(cmd => cmd.category === category);
  }

  /**
   * Export commands
   */
  exportCommands(): string {
    return JSON.stringify(this.commands(), null, 2);
  }

  /**
   * Import commands
   */
  importCommands(json: string): void {
    try {
      const imported = JSON.parse(json);
      const customImported = imported
        .filter((cmd: ChatCommand) => cmd.type === 'custom')
        .map((cmd: ChatCommand) => ({ ...cmd, id: crypto.randomUUID() }));

      this.commands.update(commands => [...commands, ...customImported]);
      this.saveCustomCommands();
    } catch (error) {
      console.error('Failed to import commands:', error);
    }
  }
}
