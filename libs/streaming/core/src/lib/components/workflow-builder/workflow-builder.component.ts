import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AutomationService, AutomationWorkflow, WorkflowNode } from '../../services/automation.service';

/**
 * Workflow Builder Component
 * Visual drag-and-drop workflow editor (like n8n)
 */

@Component({
  selector: 'lib-workflow-builder',
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
    MatTooltipModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  template: `
    <mat-card class="workflow-builder">
      <!-- Toolbar -->
      <mat-card-header class="toolbar">
        <button mat-raised-button color="primary" (click)="createNewWorkflow()">
          <mat-icon>add</mat-icon>
          New Workflow
        </button>

        <mat-form-field appearance="outline" class="workflow-select">
          <mat-label>Select workflow</mat-label>
          <mat-select [(ngModel)]="selectedWorkflowId" (ngModelChange)="loadWorkflow()">
            <mat-option value="">Select workflow...</mat-option>
            @for (workflow of workflows(); track workflow.id) {
              <mat-option [value]="workflow.id">{{ workflow.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (currentWorkflow()) {
          <button mat-raised-button color="accent" (click)="executeCurrentWorkflow()">
            <mat-icon>play_arrow</mat-icon>
            Run
          </button>
          <button mat-stroked-button (click)="toggleWorkflow()" [color]="currentWorkflow()?.enabled ? 'warn' : 'primary'">
            <mat-icon>{{ currentWorkflow()?.enabled ? 'pause' : 'play_arrow' }}</mat-icon>
            {{ currentWorkflow()?.enabled ? 'Disable' : 'Enable' }}
          </button>
          <button mat-button color="warn" (click)="deleteCurrentWorkflow()">
            <mat-icon>delete</mat-icon>
            Delete
          </button>
        }
      </mat-card-header>

      <mat-divider></mat-divider>

      @if (currentWorkflow()) {
        <div class="workflow-editor">
          <!-- Node Palette -->
          <div class="node-palette">
            <h3>Add Nodes</h3>

            <div class="node-categories">
              @for (category of categories(); track category) {
                <div class="category">
                  <h4>{{ category }}</h4>

                  @for (template of getTemplatesByCategory(category); track template.id) {
                    <button
                      mat-stroked-button
                      class="node-template"
                      (click)="addNode(template.id)"
                      [matTooltip]="template.description">
                      {{ template.icon }} {{ template.name }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Canvas -->
          <div class="canvas" (drop)="onDrop($event)" (dragover)="onDragOver($event)">
            <div class="canvas-header">
              <h2>{{ currentWorkflow()?.name }}</h2>
              <p>{{ currentWorkflow()?.description }}</p>
            </div>

            <!-- Trigger -->
            <div class="trigger-node">
              <div class="node-header">⚡ Trigger</div>
              <div class="node-body">
                <select [(ngModel)]="triggerType" (ngModelChange)="updateTrigger()">
                  <option value="manual">Manual</option>
                  <option value="event">Event</option>
                  <option value="schedule">Schedule</option>
                  <option value="hotkey">Hotkey</option>
                </select>

                @if (triggerType === 'event') {
                  <input
                    type="text"
                    [(ngModel)]="triggerEvent"
                    (ngModelChange)="updateTrigger()"
                    placeholder="Event name..."
                    class="trigger-input" />
                }

                @if (triggerType === 'schedule') {
                  <input
                    type="text"
                    [(ngModel)]="triggerSchedule"
                    (ngModelChange)="updateTrigger()"
                    placeholder="Cron expression..."
                    class="trigger-input" />
                }
              </div>
            </div>

            <!-- Workflow Nodes -->
            @for (node of currentWorkflow()?.nodes || []; track node.id) {
              <div
                class="workflow-node"
                [class.disabled]="!node.enabled"
                [style.left.px]="node.position.x"
                [style.top.px]="node.position.y"
                draggable="true"
                (dragstart)="onNodeDragStart($event, node.id)">

                <div class="node-header">
                  <span>{{ getNodeTemplate(node.type)?.icon }} {{ node.name }}</span>
                  <button mat-icon-button (click)="removeNode(node.id)" class="btn-remove">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="node-body">
                  <!-- Node configuration -->
                  @for (param of getNodeTemplate(node.type)?.inputs || []; track param.name) {
                    <div class="node-param">
                      <label>{{ param.name }}</label>

                      @if (param.type === 'string') {
                        <input
                          type="text"
                          [(ngModel)]="node.config[param.name]"
                          [placeholder]="param.default" />
                      }

                      @if (param.type === 'number') {
                        <input
                          type="number"
                          [(ngModel)]="node.config[param.name]"
                          [placeholder]="param.default" />
                      }

                      @if (param.type === 'boolean') {
                        <input
                          type="checkbox"
                          [(ngModel)]="node.config[param.name]" />
                      }

                      @if (param.type === 'select' && param.options) {
                        <select [(ngModel)]="node.config[param.name]">
                          @for (option of param.options; track option.value) {
                            <option [value]="option.value">{{ option.label }}</option>
                          }
                        </select>
                      }
                    </div>
                  }
                </div>

                <div class="node-footer">
                  <div class="node-handle input">⬤</div>
                  <div class="node-handle output">⬤</div>
                </div>
              </div>
            }

            @if ((currentWorkflow()?.nodes?.length || 0) === 0) {
              <div class="empty-canvas">
                <p>👈 Add nodes from the palette to build your workflow</p>
              </div>
            }
          </div>

          <!-- Properties Panel -->
          <div class="properties-panel">
            <h3>Workflow Info</h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input
                matInput
                type="text"
                [(ngModel)]="workflowName"
                (ngModelChange)="updateWorkflowName()"
                placeholder="Workflow name..." />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                [(ngModel)]="workflowDescription"
                (ngModelChange)="updateWorkflowDescription()"
                placeholder="Describe what this workflow does..."
                rows="3"></textarea>
            </mat-form-field>

            <div class="property">
              <label>Status</label>
              <div class="status-badge" [class.enabled]="currentWorkflow()?.enabled">
                {{ currentWorkflow()?.enabled ? '✓ Enabled' : '○ Disabled' }}
              </div>
            </div>

            <div class="property">
              <label>Statistics</label>
              <div class="stats">
                <div>Runs: {{ currentWorkflow()?.runCount || 0 }}</div>
                <div>Nodes: {{ currentWorkflow()?.nodes?.length || 0 }}</div>
                @if (currentWorkflow()?.lastRun) {
                  <div>Last run: {{ formatDate(currentWorkflow()!.lastRun!) }}</div>
                }
              </div>
            </div>

            <mat-divider></mat-divider>

            <h3>Quick Actions</h3>

            <button mat-stroked-button (click)="duplicateWorkflow()" class="full-width">
              <mat-icon>content_copy</mat-icon>
              Duplicate
            </button>

            <button mat-stroked-button (click)="exportWorkflow()" class="full-width">
              <mat-icon>download</mat-icon>
              Export JSON
            </button>

            <button mat-stroked-button (click)="importWorkflow()" class="full-width">
              <mat-icon>upload</mat-icon>
              Import JSON
            </button>

            <mat-divider></mat-divider>

            <h3>Templates</h3>

            @for (template of workflowTemplates(); track $index) {
              <button
                mat-stroked-button
                (click)="loadTemplate($index)"
                class="full-width"
                [matTooltip]="template.description">
                {{ template.name }}
              </button>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon class="empty-icon">movie</mat-icon>
          <h2>Create Your First Workflow</h2>
          <p>Build powerful automations with our visual workflow builder</p>
          <button mat-raised-button color="primary" (click)="createNewWorkflow()">
            <mat-icon>add</mat-icon>
            Get Started
          </button>
        </div>
      }

      <!-- Execution Stats -->
      <mat-card-footer class="stats-bar">
        <mat-chip-set>
          <mat-chip>Workflows: {{ automation.statistics().totalWorkflows }}</mat-chip>
          <mat-chip>Active: {{ automation.statistics().activeWorkflows }}</mat-chip>
          <mat-chip>Total Executions: {{ automation.statistics().totalExecutions }}</mat-chip>
          <mat-chip>Success Rate: {{ automation.statistics().successRate }}%</mat-chip>
        </mat-chip-set>
      </mat-card-footer>
    </mat-card>
  `,
  styles: [`
    .workflow-builder {
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

    .workflow-select {
      flex: 1;
      padding: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
    }

    .workflow-editor {
      display: grid;
      grid-template-columns: 250px 1fr 300px;
      flex: 1;
      overflow: hidden;
    }

    .node-palette {
      background: #2a2a2a;
      border-right: 1px solid #3a3a3a;
      overflow-y: auto;
      padding: 1rem;
    }

    .node-palette h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .node-categories h4 {
      margin: 1rem 0 0.5rem;
      font-size: 0.875rem;
      color: #888;
      text-transform: uppercase;
    }

    .node-template {
      display: block;
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 0.25rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }

    .node-template:hover {
      background: #3a3a3a;
      border-color: #4a90e2;
    }

    .canvas {
      position: relative;
      background: #1a1a1a;
      overflow: auto;
      min-height: 600px;
    }

    .canvas-header {
      padding: 1rem;
      background: #2a2a2a;
      border-bottom: 1px solid #3a3a3a;
    }

    .canvas-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .canvas-header p {
      margin: 0.25rem 0 0;
      color: #888;
    }

    .trigger-node {
      position: absolute;
      top: 100px;
      left: 50px;
      width: 250px;
      background: #2a2a2a;
      border: 2px solid #4a90e2;
      border-radius: 8px;
      overflow: hidden;
    }

    .workflow-node {
      position: absolute;
      width: 250px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      overflow: hidden;
      cursor: move;
    }

    .workflow-node.disabled {
      opacity: 0.5;
    }

    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #3a3a3a;
      font-weight: 600;
    }

    .node-body {
      padding: 1rem;
    }

    .node-param {
      margin-bottom: 0.75rem;
    }

    .node-param label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
      color: #888;
    }

    .node-param input,
    .node-param select {
      width: 100%;
      padding: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
    }

    .trigger-input {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
    }

    .empty-canvas {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
      font-size: 1.25rem;
    }

    .properties-panel {
      background: #2a2a2a;
      border-left: 1px solid #3a3a3a;
      overflow-y: auto;
      padding: 1rem;
    }

    .properties-panel h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .property {
      margin-bottom: 1rem;
    }

    .property label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
      color: #888;
    }

    .property input,
    .property textarea {
      width: 100%;
      padding: 0.5rem;
      background: #1a1a1a;
      color: white;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      font-family: inherit;
    }

    .status-badge {
      padding: 0.5rem;
      background: #3a3a3a;
      border-radius: 4px;
      text-align: center;
    }

    .status-badge.enabled {
      background: #2a5a2a;
      color: #4ade80;
    }

    .stats div {
      padding: 0.25rem 0;
      font-size: 0.875rem;
      color: #888;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 2rem;
    }

    .empty-state h2 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
    }

    .empty-state p {
      margin: 0 0 2rem;
      color: #888;
    }

    .stats-bar {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1rem;
      background: #2a2a2a;
      border-top: 1px solid #3a3a3a;
      font-size: 0.875rem;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-remove {
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

    .btn-remove {
      padding: 0.25rem 0.5rem;
      background: transparent;
      font-size: 1rem;
    }

    .btn-primary:hover { background: #357abd; }
    .btn-secondary:hover { background: #4a4a4a; }
    .btn-success:hover { background: #3a7a3a; }
    .btn-danger:hover { background: #7a3a3a; }
    .btn-remove:hover { color: #ff6b6b; }

    .btn-primary.active { background: #2a5a2a; }

    .full-width {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    hr {
      border: none;
      border-top: 1px solid #3a3a3a;
      margin: 1.5rem 0;
    }
  `]
})
export class WorkflowBuilderComponent {
  protected automation = inject(AutomationService);

  protected selectedWorkflowId = '';
  protected currentWorkflow = signal<AutomationWorkflow | null>(null);

  protected workflowName = '';
  protected workflowDescription = '';

  protected triggerType = 'manual';
  protected triggerEvent = '';
  protected triggerSchedule = '';

  protected readonly workflows = this.automation.workflows;
  protected readonly workflowTemplates = this.automation.workflowTemplates;
  protected readonly categories = computed(() => [
    'trigger',
    'action',
    'logic',
    'data'
  ]);

  createNewWorkflow(): void {
    const workflow = this.automation.createWorkflow('New Workflow', 'Describe your workflow');
    this.selectedWorkflowId = workflow.id;
    this.loadWorkflow();
  }

  loadWorkflow(): void {
    const workflow = this.workflows().find(w => w.id === this.selectedWorkflowId);
    this.currentWorkflow.set(workflow || null);

    if (workflow) {
      this.workflowName = workflow.name;
      this.workflowDescription = workflow.description || '';
      this.triggerType = workflow.trigger.type;
      this.triggerEvent = workflow.trigger.config.event || '';
      this.triggerSchedule = workflow.trigger.config.schedule || '';
    }
  }

  deleteCurrentWorkflow(): void {
    if (this.currentWorkflow() && confirm('Delete this workflow?')) {
      this.automation.deleteWorkflow(this.currentWorkflow()!.id);
      this.selectedWorkflowId = '';
      this.currentWorkflow.set(null);
    }
  }

  toggleWorkflow(): void {
    if (this.currentWorkflow()) {
      this.automation.toggleWorkflow(this.currentWorkflow()!.id);
      this.loadWorkflow();
    }
  }

  async executeCurrentWorkflow(): Promise<void> {
    if (this.currentWorkflow()) {
      try {
        await this.automation.executeWorkflow(this.currentWorkflow()!.id);
        alert('Workflow executed successfully!');
        this.loadWorkflow();
      } catch (error: any) {
        alert(`Execution failed: ${error.message}`);
      }
    }
  }

  updateWorkflowName(): void {
    if (this.currentWorkflow()) {
      this.automation.updateWorkflow(this.currentWorkflow()!.id, {
        name: this.workflowName
      });
    }
  }

  updateWorkflowDescription(): void {
    if (this.currentWorkflow()) {
      this.automation.updateWorkflow(this.currentWorkflow()!.id, {
        description: this.workflowDescription
      });
    }
  }

  updateTrigger(): void {
    if (this.currentWorkflow()) {
      this.automation.updateWorkflow(this.currentWorkflow()!.id, {
        trigger: {
          type: this.triggerType as any,
          config: {
            event: this.triggerEvent,
            schedule: this.triggerSchedule
          }
        }
      });
    }
  }

  getTemplatesByCategory(category: string) {
    return this.automation.nodeTemplates().filter(t => t.category === category);
  }

  getNodeTemplate(type: string) {
    return this.automation.nodeTemplates().find(t => t.id === type);
  }

  addNode(templateId: string): void {
    if (this.currentWorkflow()) {
      const position = {
        x: 100 + (this.currentWorkflow()!.nodes.length * 50),
        y: 300 + (this.currentWorkflow()!.nodes.length * 50)
      };
      this.automation.addNode(this.currentWorkflow()!.id, templateId, position);
      this.loadWorkflow();
    }
  }

  removeNode(nodeId: string): void {
    if (this.currentWorkflow()) {
      this.automation.removeNode(this.currentWorkflow()!.id, nodeId);
      this.loadWorkflow();
    }
  }

  duplicateWorkflow(): void {
    if (this.currentWorkflow()) {
      const duplicate = this.automation.duplicateWorkflow(this.currentWorkflow()!.id);
      if (duplicate) {
        this.selectedWorkflowId = duplicate.id;
        this.loadWorkflow();
      }
    }
  }

  exportWorkflow(): void {
    if (this.currentWorkflow()) {
      const json = this.automation.exportWorkflow(this.currentWorkflow()!.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentWorkflow()!.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  importWorkflow(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = this.automation.importWorkflow(e.target.result);
          if (success) {
            alert('Workflow imported successfully!');
          } else {
            alert('Failed to import workflow');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  loadTemplate(index: number): void {
    const workflow = this.automation.createFromTemplate(index);
    this.selectedWorkflowId = workflow.id;
    this.loadWorkflow();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onNodeDragStart(event: DragEvent, nodeId: string): void {
    event.dataTransfer?.setData('nodeId', nodeId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
