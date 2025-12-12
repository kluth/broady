import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { ScriptingService, Script } from '../../services/scripting.service';

/**
 * Script Editor Component
 * Text-based scripting with easy-to-learn language
 */

@Component({
  selector: 'lib-script-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="script-editor">
      <!-- Toolbar -->
      <mat-card-header class="toolbar">
        <button mat-raised-button color="primary" (click)="createNewScript()">
          <mat-icon>add</mat-icon>
          New Script
        </button>

        <mat-form-field appearance="outline" class="script-select">
          <mat-label>Select script</mat-label>
          <mat-select [(ngModel)]="selectedScriptId" (ngModelChange)="loadScript()">
            <mat-option value="">Select script...</mat-option>
            @for (script of scripts(); track script.id) {
              <mat-option [value]="script.id">{{ script.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (currentScript()) {
          <button mat-raised-button color="accent" (click)="executeCurrentScript()">
            <mat-icon>play_arrow</mat-icon>
            Run
          </button>
          <button mat-stroked-button (click)="validateCurrentScript()">
            <mat-icon>check_circle</mat-icon>
            Validate
          </button>
          <button mat-stroked-button (click)="toggleScript()" [color]="currentScript()?.enabled ? 'warn' : 'primary'">
            <mat-icon>{{ currentScript()?.enabled ? 'pause' : 'play_arrow' }}</mat-icon>
            {{ currentScript()?.enabled ? 'Disable' : 'Enable' }}
          </button>
          <button mat-stroked-button (click)="convertToWorkflow()">
            <mat-icon>swap_horiz</mat-icon>
            Convert to Workflow
          </button>
          <button mat-button color="warn" (click)="deleteCurrentScript()">
            <mat-icon>delete</mat-icon>
            Delete
          </button>
        }
      </mat-card-header>

      <mat-divider></mat-divider>

      <div class="editor-container">
        @if (currentScript()) {
          <!-- Code Editor -->
          <div class="editor-panel">
            <div class="editor-header">
              <input
                type="text"
                [(ngModel)]="scriptName"
                (ngModelChange)="updateScriptName()"
                placeholder="Script name..."
                class="script-name-input" />
            </div>

            <textarea
              [(ngModel)]="scriptCode"
              (ngModelChange)="onCodeChange()"
              class="code-editor"
              spellcheck="false"
              [placeholder]="placeholderText"></textarea>

            <!-- Error Display -->
            @if (currentScript()?.errors && currentScript()!.errors.length > 0) {
              <div class="errors-panel">
                <h4>❌ Errors</h4>
                @for (error of currentScript()!.errors; track $index) {
                  <div class="error-item" [class.warning]="error.severity === 'warning'">
                    <span class="error-location">Line {{ error.line }}:{{ error.column }}</span>
                    <span class="error-message">{{ error.message }}</span>
                  </div>
                }
              </div>
            } @else if (scriptCode) {
              <div class="success-panel">
                ✓ No errors found
              </div>
            }

            <!-- Script Info -->
            <div class="script-info">
              <div class="info-item">
                <span class="label">Status:</span>
                <span [class.enabled]="currentScript()?.enabled" [class.disabled]="!currentScript()?.enabled">
                  {{ currentScript()?.enabled ? '✓ Enabled' : '○ Disabled' }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Runs:</span>
                <span>{{ currentScript()?.runCount || 0 }}</span>
              </div>
              @if (currentScript()?.lastRun) {
                <div class="info-item">
                  <span class="label">Last run:</span>
                  <span>{{ formatDate(currentScript()!.lastRun!) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">
            <!-- Quick Reference -->
            <div class="reference-section">
              <h3>
                <mat-icon>book</mat-icon>
                Quick Reference
              </h3>

              <mat-accordion>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Events</mat-panel-title>
                  </mat-expansion-panel-header>
                  <ul>
                    <li>follower</li>
                    <li>donation</li>
                    <li>subscriber</li>
                    <li>raid</li>
                    <li>chat</li>
                    <li>stream-start</li>
                    <li>voice-command</li>
                  </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Commands</mat-panel-title>
                  </mat-expansion-panel-header>
                  <ul>
                    @for (command of scripting.commands(); track command) {
                      <li>{{ command }}()</li>
                    }
                  </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Syntax</mat-panel-title>
                  </mat-expansion-panel-header>
                  <ul>
                    <li><code>on &lt;event&gt; do ... end</code></li>
                    <li><code>when &lt;condition&gt; then ... end</code></li>
                    <li><code>every &lt;time&gt; do ... end</code></li>
                    <li><code>if &lt;condition&gt; then ... end</code></li>
                    <li><code>set &lt;var&gt; = &lt;value&gt;</code></li>
                    <li><code>wait(&lt;seconds&gt;)</code></li>
                  </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Variables</mat-panel-title>
                  </mat-expansion-panel-header>
                  <ul ngNonBindable>
                    <li><code>{{username}}</code> - Username</li>
                    <li><code>{{donor}}</code> - Donor name</li>
                    <li><code>{{amount}}</code> - Donation amount</li>
                    <li><code>{{message}}</code> - Chat message</li>
                    <li><code>{{viewerCount}}</code> - Viewer count</li>
                  </ul>
                </mat-expansion-panel>
              </mat-accordion>
            </div>

            <!-- Example Scripts -->
            <div class="examples-section">
              <h3>
                <mat-icon>lightbulb</mat-icon>
                Examples
              </h3>

              @for (example of scripting.exampleScripts(); track example.name) {
                <button
                  mat-stroked-button
                  (click)="loadExample(example.code)"
                  class="example-btn full-width"
                  [title]="example.name">
                  {{ example.name }}
                </button>
              }
            </div>

            <!-- Documentation -->
            <div class="docs-section">
              <h3>
                <mat-icon>menu_book</mat-icon>
                Documentation
              </h3>
              <button mat-raised-button (click)="showDocumentation()" class="full-width">
                <mat-icon>description</mat-icon>
                View Full Docs
              </button>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon class="empty-icon">edit_note</mat-icon>
            <h2>Create Your First Script</h2>
            <p>Write powerful automations with our easy-to-learn scripting language</p>

            <div class="examples-grid">
              <h3>Try an example:</h3>
              @for (example of scripting.exampleScripts(); track example.name) {
                <mat-card
                  class="example-card"
                  (click)="createFromExample(example.name, example.code)">
                  <mat-card-header>
                    <mat-card-title>{{ example.name }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <pre>{{ getExamplePreview(example.code) }}</pre>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <button mat-raised-button color="primary" (click)="createNewScript()">
              <mat-icon>add</mat-icon>
              Start from Scratch
            </button>
          </div>
        }
      </div>

      <!-- Stats Bar -->
      <mat-card-footer class="stats-bar">
        <mat-chip-set>
          <mat-chip>Total Scripts: {{ scripts().length }}</mat-chip>
          <mat-chip>Active: {{ activeScripts().length }}</mat-chip>
          <mat-chip>Available Commands: {{ scripting.commands().length }}</mat-chip>
        </mat-chip-set>
      </mat-card-footer>
    </mat-card>
  `,
  styles: [`
    .script-editor {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      color: white;
    }

    .toolbar {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
    }

    .script-select {
      flex: 1;
      padding: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
    }

    .editor-container {
      display: grid;
      grid-template-columns: 1fr 300px;
      flex: 1;
      overflow: hidden;
    }

    .editor-panel {
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .editor-header {
      padding: 1rem;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
    }

    .script-name-input {
      width: 100%;
      padding: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .code-editor {
      flex: 1;
      padding: 1rem;
      background: #0d1117;
      color: #c9d1d9;
      border: none;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      tab-size: 2;
    }

    .code-editor:focus {
      outline: none;
    }

    .errors-panel {
      padding: 1rem;
      background: #3a2a2a;
      border-top: 2px solid #aa3a3a;
    }

    .errors-panel h4 {
      margin: 0 0 0.5rem;
      color: #ff6b6b;
    }

    .error-item {
      padding: 0.5rem;
      margin-bottom: 0.25rem;
      background: #2a1a1a;
      border-left: 3px solid #aa3a3a;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .error-item.warning {
      border-left-color: #aa8a3a;
    }

    .error-location {
      color: #888;
      margin-right: 0.5rem;
    }

    .error-message {
      color: #ff6b6b;
    }

    .success-panel {
      padding: 0.5rem 1rem;
      background: #2a3a2a;
      border-top: 2px solid #4ade80;
      color: #4ade80;
      text-align: center;
      font-size: 0.875rem;
    }

    .script-info {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1rem;
      background: #2a2a2a;
      border-top: 1px solid #3a3a3a;
      font-size: 0.875rem;
    }

    .info-item {
      display: flex;
      gap: 0.5rem;
    }

    .info-item .label {
      color: #888;
    }

    .info-item .enabled {
      color: #4ade80;
    }

    .info-item .disabled {
      color: #888;
    }

    .sidebar {
      background: #2a2a2a;
      border-left: 1px solid #3a3a3a;
      overflow-y: auto;
      padding: 1rem;
    }

    .sidebar h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .reference-section,
    .examples-section,
    .docs-section {
      margin-bottom: 2rem;
    }

    details {
      margin-bottom: 0.5rem;
      background: #1a1a1a;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
    }

    summary {
      padding: 0.5rem;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
    }

    summary:hover {
      background: #3a3a3a;
    }

    details ul {
      margin: 0;
      padding: 0.5rem 1rem;
      list-style: none;
    }

    details li {
      padding: 0.25rem 0;
      font-family: monospace;
      font-size: 0.875rem;
      color: #888;
    }

    details code {
      color: #4a90e2;
    }

    .example-btn {
      display: block;
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }

    .example-btn:hover {
      background: #3a3a3a;
      border-color: #4a90e2;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      grid-column: 1 / -1;
    }

    .empty-state h2 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
    }

    .empty-state p {
      margin: 0 0 2rem;
      color: #888;
    }

    .examples-grid {
      width: 100%;
      max-width: 800px;
      margin-bottom: 2rem;
    }

    .examples-grid h3 {
      margin: 0 0 1rem;
      text-align: center;
    }

    .example-card {
      display: block;
      width: 100%;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #2a2a2a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }

    .example-card:hover {
      border-color: #4a90e2;
      transform: translateY(-2px);
    }

    .example-card h4 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .example-card pre {
      margin: 0;
      padding: 0.5rem;
      background: #1a1a1a;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #888;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stats-bar {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1rem;
      background: #2a2a2a;
      border-top: 1px solid #3a3a3a;
      font-size: 0.875rem;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-danger {
      padding: 0.5rem 1rem;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #3a3a3a;
    }

    .btn-success {
      background: #2a5a2a;
    }

    .btn-danger {
      background: #5a2a2a;
    }

    .btn-primary:hover { background: #357abd; }
    .btn-secondary:hover { background: #4a4a4a; }
    .btn-success:hover { background: #3a7a3a; }
    .btn-danger:hover { background: #7a3a3a; }

    .btn-primary.active { background: #2a5a2a; }

    .full-width {
      width: 100%;
    }
  `]
})
export class ScriptEditorComponent {
  protected scripting = inject(ScriptingService);

  protected selectedScriptId = '';
  protected currentScript = signal<Script | null>(null);

  protected scriptName = '';
  protected scriptCode = '';
  protected placeholderText = `Write your script here...

Example:
on follower do
  showAlert('New Follower', '{{username}} just followed!', 5)
  speak('Thank you for following!')
end`;

  protected readonly scripts = this.scripting.scripts;
  protected readonly activeScripts = this.scripting.activeScripts;

  createNewScript(): void {
    const script = this.scripting.createScript('New Script', '');
    this.selectedScriptId = script.id;
    this.loadScript();
  }

  loadScript(): void {
    const script = this.scripts().find(s => s.id === this.selectedScriptId);
    this.currentScript.set(script || null);

    if (script) {
      this.scriptName = script.name;
      this.scriptCode = script.code;
    }
  }

  deleteCurrentScript(): void {
    if (this.currentScript() && confirm('Delete this script?')) {
      this.scripting.deleteScript(this.currentScript()!.id);
      this.selectedScriptId = '';
      this.currentScript.set(null);
    }
  }

  toggleScript(): void {
    if (this.currentScript()) {
      this.scripting.toggleScript(this.currentScript()!.id);
      this.loadScript();
    }
  }

  async executeCurrentScript(): Promise<void> {
    if (this.currentScript()) {
      try {
        await this.scripting.executeScript(this.currentScript()!.id);
        alert('Script executed successfully!');
        this.loadScript();
      } catch (error: any) {
        alert(`Execution failed: ${error.message}`);
      }
    }
  }

  validateCurrentScript(): void {
    if (this.currentScript()) {
      const errors = this.scripting.validate(this.scriptCode);
      if (errors.length === 0) {
        alert('✓ Script is valid!');
      } else {
        alert(`❌ Found ${errors.length} error(s)`);
      }
    }
  }

  convertToWorkflow(): void {
    if (this.currentScript()) {
      try {
        const workflow = this.scripting.convertToWorkflow(this.currentScript()!.id);
        alert(`Converted to workflow: ${workflow.name}`);
      } catch (error: any) {
        alert(`Conversion failed: ${error.message}`);
      }
    }
  }

  updateScriptName(): void {
    // Auto-save happens on code change
  }

  onCodeChange(): void {
    if (this.currentScript()) {
      this.scripting.updateScript(this.currentScript()!.id, this.scriptCode);
      this.loadScript();
    }
  }

  loadExample(code: string): void {
    this.scriptCode = code;
    this.onCodeChange();
  }

  createFromExample(name: string, code: string): void {
    const script = this.scripting.createScript(name, code);
    this.selectedScriptId = script.id;
    this.loadScript();
  }

  showDocumentation(): void {
    const docs = this.scripting.getDocumentation();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Broady Scripting Documentation</title>
            <style>
              body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; background: #1a1a1a; color: white; }
              pre { background: #2a2a2a; padding: 1rem; border-radius: 4px; overflow-x: auto; }
              code { background: #2a2a2a; padding: 0.2rem 0.4rem; border-radius: 3px; }
              h1, h2, h3 { color: #4a90e2; }
            </style>
          </head>
          <body>${docs.replace(/\n/g, '<br>').replace(/```/g, '<pre>').replace(/`([^`]+)`/g, '<code>$1</code>')}</body>
        </html>
      `);
    }
  }

  getExamplePreview(code: string): string {
    const lines = code.split('\n');
    return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
