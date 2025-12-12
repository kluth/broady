import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';

import { StreamChatbotService, ChatCommand, CommandCategory } from '../../services/stream-chatbot.service';

@Component({
  selector: 'app-chatbot-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatSlideToggleModule,
    MatExpansionModule
  ],
  template: `
    <mat-card class="chatbot-config">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>smart_toy</mat-icon>
          Stream Chatbot Configuration
        </mat-card-title>
        <div class="header-actions">
          <mat-slide-toggle
            [(ngModel)]="botEnabled"
            (change)="toggleBot()"
            color="primary">
            {{ botEnabled ? 'Enabled' : 'Disabled' }}
          </mat-slide-toggle>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Commands Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">command</mat-icon>
              Commands
            </ng-template>

            <div class="tab-content">
              <!-- Stats -->
              <div class="stats-row">
                <mat-chip-set>
                  <mat-chip>Total: {{ chatbot.stats().totalCommands }}</mat-chip>
                  <mat-chip>Enabled: {{ chatbot.stats().enabledCommands }}</mat-chip>
                  <mat-chip>Custom: {{ chatbot.stats().customCommands }}</mat-chip>
                  <mat-chip>Total Usage: {{ chatbot.stats().totalUsage }}</mat-chip>
                </mat-chip-set>
              </div>

              <mat-divider></mat-divider>

              <!-- Filter -->
              <div class="filter-section">
                <mat-form-field appearance="outline">
                  <mat-label>Filter by Category</mat-label>
                  <mat-select [(ngModel)]="selectedCategory">
                    <mat-option value="all">All Commands</mat-option>
                    <mat-option value="info">Info</mat-option>
                    <mat-option value="social">Social</mat-option>
                    <mat-option value="game">Game</mat-option>
                    <mat-option value="fun">Fun</mat-option>
                    <mat-option value="moderation">Moderation</mat-option>
                    <mat-option value="custom">Custom</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Search Commands</mat-label>
                  <input matInput [(ngModel)]="searchQuery" placeholder="Search...">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
              </div>

              <!-- Commands List -->
              <div class="commands-list">
                @for (command of filteredCommands(); track command.id) {
                  <mat-expansion-panel class="command-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-slide-toggle
                          [(ngModel)]="command.enabled"
                          (change)="chatbot.toggleCommand(command.id)"
                          (click)="$event.stopPropagation()"
                          color="primary">
                        </mat-slide-toggle>
                        <span class="command-trigger">{{ config().prefix }}{{ command.trigger }}</span>
                        <mat-chip class="command-type">{{ command.type }}</mat-chip>
                        <mat-chip class="command-category">{{ command.category }}</mat-chip>
                      </mat-panel-title>
                      <mat-panel-description>
                        Usage: {{ command.usageCount }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="command-details">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Response</mat-label>
                        <textarea
                          matInput
                          [(ngModel)]="command.response"
                          (change)="chatbot.editCommand(command.id, { response: command.response })"
                          rows="3"></textarea>
                      </mat-form-field>

                      <div class="command-settings">
                        <mat-form-field appearance="outline">
                          <mat-label>Cooldown (seconds)</mat-label>
                          <input
                            matInput
                            type="number"
                            [(ngModel)]="command.cooldown"
                            (change)="chatbot.editCommand(command.id, { cooldown: command.cooldown })">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Permission</mat-label>
                          <mat-select
                            [(ngModel)]="command.permission"
                            (selectionChange)="chatbot.editCommand(command.id, { permission: command.permission })">
                            <mat-option value="everyone">Everyone</mat-option>
                            <mat-option value="subscriber">Subscribers</mat-option>
                            <mat-option value="moderator">Moderators</mat-option>
                            <mat-option value="broadcaster">Broadcaster Only</mat-option>
                          </mat-select>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Aliases (comma separated)</mat-label>
                          <input
                            matInput
                            [value]="command.aliases?.join(', ') || ''"
                            (change)="updateAliases(command.id, $event)">
                        </mat-form-field>
                      </div>

                      @if (command.type === 'custom') {
                        <div class="command-actions">
                          <button
                            mat-raised-button
                            color="warn"
                            (click)="deleteCommand(command.id)">
                            <mat-icon>delete</mat-icon>
                            Delete Command
                          </button>
                        </div>
                      }

                      @if (command.lastUsed) {
                        <div class="last-used">
                          Last used: {{ formatDate(command.lastUsed) }}
                        </div>
                      }
                    </div>
                  </mat-expansion-panel>
                }
              </div>

              <!-- Add Custom Command -->
              <mat-divider></mat-divider>

              <div class="add-command-section">
                <h3>Add Custom Command</h3>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Command Trigger</mat-label>
                  <input matInput [(ngModel)]="newCommand.trigger" placeholder="mycommand">
                  <span matPrefix>{{ config().prefix }}</span>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Response</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="newCommand.response"
                    placeholder="Your command response here..."
                    rows="3"></textarea>
                  <mat-hint>Use placeholders: {user}, {uptime}, {viewers}, {game}</mat-hint>
                </mat-form-field>

                <div class="command-options">
                  <mat-form-field appearance="outline">
                    <mat-label>Cooldown (seconds)</mat-label>
                    <input matInput type="number" [(ngModel)]="newCommand.cooldown">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Permission</mat-label>
                    <mat-select [(ngModel)]="newCommand.permission">
                      <mat-option value="everyone">Everyone</mat-option>
                      <mat-option value="subscriber">Subscribers</mat-option>
                      <mat-option value="moderator">Moderators</mat-option>
                      <mat-option value="broadcaster">Broadcaster Only</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <button
                  mat-raised-button
                  color="primary"
                  (click)="addCommand()"
                  [disabled]="!newCommand.trigger || !newCommand.response">
                  <mat-icon>add</mat-icon>
                  Add Command
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Settings Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">settings</mat-icon>
              Settings
            </ng-template>

            <div class="tab-content settings-tab">
              <h3>General Settings</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Command Prefix</mat-label>
                <input
                  matInput
                  [(ngModel)]="config().prefix"
                  (change)="updateConfig()">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Global Cooldown (seconds)</mat-label>
                <input
                  matInput
                  type="number"
                  [(ngModel)]="config().globalCooldown"
                  (change)="updateConfig()">
              </mat-form-field>

              <div class="checkbox-group">
                <mat-checkbox
                  [(ngModel)]="config().respondToMentions"
                  (change)="updateConfig()">
                  Respond to @mentions
                </mat-checkbox>

                <mat-checkbox
                  [(ngModel)]="config().autoGreetNewFollowers"
                  (change)="updateConfig()">
                  Auto-greet new followers
                </mat-checkbox>

                <mat-checkbox
                  [(ngModel)]="config().autoThankSubscribers"
                  (change)="updateConfig()">
                  Auto-thank subscribers
                </mat-checkbox>

                <mat-checkbox
                  [(ngModel)]="config().autoThankDonations"
                  (change)="updateConfig()">
                  Auto-thank donations
                </mat-checkbox>
              </div>

              <mat-divider></mat-divider>

              <h3>Auto Messages</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Follower Greeting</mat-label>
                <input
                  matInput
                  [(ngModel)]="config().greetingMessage"
                  (change)="updateConfig()">
                <mat-hint>Use {user} for the follower's name</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Subscription Thank You</mat-label>
                <input
                  matInput
                  [(ngModel)]="config().subscriptionMessage"
                  (change)="updateConfig()">
                <mat-hint>Use {user} for the subscriber's name</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Donation Thank You</mat-label>
                <input
                  matInput
                  [(ngModel)]="config().donationMessage"
                  (change)="updateConfig()">
                <mat-hint>Use {user} and {amount}</mat-hint>
              </mat-form-field>
            </div>
          </mat-tab>

          <!-- Command History Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">history</mat-icon>
              History
            </ng-template>

            <div class="tab-content history-tab">
              <div class="history-header">
                <h3>Command Usage History</h3>
                <button mat-stroked-button (click)="chatbot.clearHistory()">
                  <mat-icon>clear</mat-icon>
                  Clear History
                </button>
              </div>

              <div class="history-list">
                @if (chatbot.commandHistory().length === 0) {
                  <div class="empty-state">
                    <mat-icon>inbox</mat-icon>
                    <p>No command history yet</p>
                  </div>
                } @else {
                  @for (entry of chatbot.commandHistory(); track entry.timestamp) {
                    <div class="history-entry">
                      <div class="entry-header">
                        <span class="username">{{ entry.username }}</span>
                        <span class="command">{{ getCommandTrigger(entry.commandId) }}</span>
                        <span class="timestamp">{{ formatDate(entry.timestamp) }}</span>
                      </div>
                      <div class="entry-response">{{ entry.response }}</div>
                    </div>
                  }
                }
              </div>
            </div>
          </mat-tab>

          <!-- Import/Export Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">swap_horiz</mat-icon>
              Import/Export
            </ng-template>

            <div class="tab-content import-export-tab">
              <h3>Export Commands</h3>
              <p>Export your custom commands to share or back up.</p>

              <button mat-raised-button color="primary" (click)="exportCommands()">
                <mat-icon>file_download</mat-icon>
                Export Commands
              </button>

              <mat-divider></mat-divider>

              <h3>Import Commands</h3>
              <p>Import commands from a JSON file.</p>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Paste JSON</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="importJson"
                  rows="10"
                  placeholder='[{"trigger": "example", "response": "..."}]'></textarea>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                (click)="importCommands()"
                [disabled]="!importJson">
                <mat-icon>file_upload</mat-icon>
                Import Commands
              </button>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chatbot-config {
      max-height: 90vh;
      overflow: auto;
    }

    mat-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .header-actions {
      margin-left: auto;
    }

    .tab-content {
      padding: 1.5rem 0;
    }

    .tab-icon {
      margin-right: 0.5rem;
    }

    .stats-row {
      margin-bottom: 1rem;
    }

    .filter-section {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }

    .filter-section mat-form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .commands-list {
      margin: 1rem 0;
      max-height: 500px;
      overflow-y: auto;
    }

    .command-panel {
      margin-bottom: 0.5rem;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .command-trigger {
      font-weight: bold;
      font-family: monospace;
    }

    .command-type {
      font-size: 0.75rem;
    }

    .command-category {
      font-size: 0.75rem;
    }

    .command-details {
      padding: 1rem;
    }

    .command-settings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .command-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .last-used {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #666;
    }

    .add-command-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .add-command-section h3 {
      margin-top: 0;
    }

    .command-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .settings-tab {
      max-width: 800px;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .history-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .history-entry {
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .entry-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .username {
      font-weight: bold;
      color: #1976d2;
    }

    .command {
      font-family: monospace;
      color: #666;
    }

    .timestamp {
      margin-left: auto;
      color: #999;
      font-size: 0.85rem;
    }

    .entry-response {
      color: #333;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .import-export-tab {
      max-width: 800px;
    }

    .import-export-tab h3 {
      margin-bottom: 0.5rem;
    }

    .import-export-tab p {
      color: #666;
      margin-bottom: 1rem;
    }
  `]
})
export class ChatbotConfigComponent {
  readonly chatbot = inject(StreamChatbotService);

  readonly config = this.chatbot.config;
  botEnabled = this.config().enabled;

  selectedCategory = 'all';
  searchQuery = '';

  newCommand = {
    trigger: '',
    response: '',
    cooldown: 10,
    permission: 'everyone' as ChatCommand['permission']
  };

  importJson = '';

  readonly filteredCommands = computed(() => {
    let commands = this.chatbot.commands();

    // Filter by category
    if (this.selectedCategory !== 'all') {
      commands = commands.filter(cmd => cmd.category === this.selectedCategory);
    }

    // Filter by search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      commands = commands.filter(cmd =>
        cmd.trigger.toLowerCase().includes(query) ||
        cmd.response.toLowerCase().includes(query)
      );
    }

    return commands;
  });

  toggleBot(): void {
    this.chatbot.updateConfig({ enabled: this.botEnabled });
  }

  updateConfig(): void {
    this.chatbot.updateConfig(this.config());
  }

  addCommand(): void {
    this.chatbot.addCustomCommand(
      this.newCommand.trigger,
      this.newCommand.response,
      {
        cooldown: this.newCommand.cooldown,
        permission: this.newCommand.permission
      }
    );

    // Reset form
    this.newCommand = {
      trigger: '',
      response: '',
      cooldown: 10,
      permission: 'everyone'
    };
  }

  deleteCommand(id: string): void {
    if (confirm('Are you sure you want to delete this command?')) {
      this.chatbot.deleteCommand(id);
    }
  }

  updateAliases(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const aliases = input.value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    this.chatbot.editCommand(id, { aliases });
  }

  getCommandTrigger(commandId: string): string {
    const command = this.chatbot.commands().find(c => c.id === commandId);
    return command ? this.config().prefix + command.trigger : '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  exportCommands(): void {
    const json = this.chatbot.exportCommands();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot-commands.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importCommands(): void {
    try {
      this.chatbot.importCommands(this.importJson);
      this.importJson = '';
      alert('Commands imported successfully!');
    } catch (error) {
      alert('Failed to import commands. Please check the JSON format.');
    }
  }
}
