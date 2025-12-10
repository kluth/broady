import { Injectable, signal } from '@angular/core';

/**
 * Automation Service
 * Visual workflow automation system with drag-and-drop nodes
 * Like n8n but for streaming!
 */

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: Record<string, any>;
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
  tags: string[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'event' | 'schedule' | 'webhook' | 'hotkey';
  config: {
    event?: string; // 'stream-start', 'donation', 'follower', etc.
    schedule?: string; // cron expression
    webhook?: string; // webhook URL
    hotkey?: string; // keyboard shortcut
    conditions?: WorkflowCondition[];
  };
}

export interface WorkflowNode {
  id: string;
  type: string; // 'action', 'condition', 'loop', 'delay', 'script'
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string; // 'success', 'failure', 'true', 'false'
  targetHandle?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains' | 'regex';
  value: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  results: Record<string, any>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  nodeId?: string;
  message: string;
}

export interface NodeTemplate {
  id: string;
  category: 'trigger' | 'action' | 'logic' | 'data' | 'integration';
  name: string;
  description: string;
  icon: string;
  inputs: NodeParameter[];
  outputs: NodeParameter[];
  config: Record<string, any>;
}

export interface NodeParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  default?: any;
  options?: Array<{ label: string; value: any }>;
}

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  readonly workflows = signal<AutomationWorkflow[]>([]);
  readonly activeExecutions = signal<WorkflowExecution[]>([]);
  
  readonly nodeTemplates = signal<NodeTemplate[]>([
    // TRIGGER NODES
    {
      id: 'trigger-stream-start',
      category: 'trigger',
      name: 'Stream Started',
      description: 'Triggers when stream starts',
      icon: '▶️',
      inputs: [],
      outputs: [{ name: 'output', type: 'string', required: false }],
      config: {}
    },
    {
      id: 'trigger-donation',
      category: 'trigger',
      name: 'Donation Received',
      description: 'Triggers on donation',
      icon: '💰',
      inputs: [],
      outputs: [
        { name: 'amount', type: 'number', required: true },
        { name: 'donor', type: 'string', required: true },
        { name: 'message', type: 'string', required: false }
      ],
      config: {
        minAmount: 0
      }
    },
    {
      id: 'trigger-follower',
      category: 'trigger',
      name: 'New Follower',
      description: 'Triggers on new follower',
      icon: '👤',
      inputs: [],
      outputs: [{ name: 'username', type: 'string', required: true }],
      config: {}
    },
    {
      id: 'trigger-schedule',
      category: 'trigger',
      name: 'Schedule',
      description: 'Triggers on schedule (cron)',
      icon: '⏰',
      inputs: [],
      outputs: [{ name: 'timestamp', type: 'string', required: true }],
      config: {
        cron: '0 * * * *' // Every hour
      }
    },
    
    // ACTION NODES
    {
      id: 'action-switch-scene',
      category: 'action',
      name: 'Switch Scene',
      description: 'Change active scene',
      icon: '🎬',
      inputs: [{ name: 'sceneName', type: 'string', required: true }],
      outputs: [{ name: 'success', type: 'boolean', required: true }],
      config: {}
    },
    {
      id: 'action-play-sound',
      category: 'action',
      name: 'Play Sound',
      description: 'Play sound effect',
      icon: '🔊',
      inputs: [
        { name: 'soundId', type: 'string', required: true },
        { name: 'volume', type: 'number', required: false, default: 1.0 }
      ],
      outputs: [{ name: 'played', type: 'boolean', required: true }],
      config: {}
    },
    {
      id: 'action-show-alert',
      category: 'action',
      name: 'Show Alert',
      description: 'Display on-screen alert',
      icon: '🔔',
      inputs: [
        { name: 'title', type: 'string', required: true },
        { name: 'message', type: 'string', required: false },
        { name: 'duration', type: 'number', required: false, default: 5 }
      ],
      outputs: [],
      config: {}
    },
    {
      id: 'action-tts',
      category: 'action',
      name: 'Text to Speech',
      description: 'Speak text message',
      icon: '🗣️',
      inputs: [
        { name: 'text', type: 'string', required: true },
        { name: 'voice', type: 'string', required: false }
      ],
      outputs: [],
      config: {}
    },
    {
      id: 'action-send-tweet',
      category: 'action',
      name: 'Send Tweet',
      description: 'Post to Twitter',
      icon: '🐦',
      inputs: [{ name: 'message', type: 'string', required: true }],
      outputs: [{ name: 'tweetId', type: 'string', required: false }],
      config: {}
    },
    {
      id: 'action-create-clip',
      category: 'action',
      name: 'Create Clip',
      description: 'Auto-create stream clip',
      icon: '✂️',
      inputs: [
        { name: 'duration', type: 'number', required: false, default: 30 },
        { name: 'title', type: 'string', required: false }
      ],
      outputs: [{ name: 'clipId', type: 'string', required: true }],
      config: {}
    },
    {
      id: 'action-lower-third',
      category: 'action',
      name: 'Show Lower Third',
      description: 'Display lower third',
      icon: '📺',
      inputs: [
        { name: 'title', type: 'string', required: true },
        { name: 'subtitle', type: 'string', required: false },
        { name: 'duration', type: 'number', required: false, default: 10 }
      ],
      outputs: [],
      config: {}
    },
    
    // LOGIC NODES
    {
      id: 'logic-condition',
      category: 'logic',
      name: 'If/Else',
      description: 'Conditional branching',
      icon: '🔀',
      inputs: [
        { name: 'value', type: 'string', required: true },
        { name: 'operator', type: 'select', required: true, options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Greater than', value: 'greater' },
          { label: 'Less than', value: 'less' },
          { label: 'Contains', value: 'contains' }
        ]},
        { name: 'compare', type: 'string', required: true }
      ],
      outputs: [
        { name: 'true', type: 'boolean', required: true },
        { name: 'false', type: 'boolean', required: true }
      ],
      config: {}
    },
    {
      id: 'logic-delay',
      category: 'logic',
      name: 'Delay',
      description: 'Wait for specified time',
      icon: '⏱️',
      inputs: [{ name: 'seconds', type: 'number', required: true, default: 5 }],
      outputs: [{ name: 'output', type: 'string', required: false }],
      config: {}
    },
    {
      id: 'logic-loop',
      category: 'logic',
      name: 'Loop',
      description: 'Repeat actions',
      icon: '🔁',
      inputs: [
        { name: 'count', type: 'number', required: true, default: 3 },
        { name: 'delay', type: 'number', required: false, default: 1 }
      ],
      outputs: [{ name: 'iteration', type: 'number', required: true }],
      config: {}
    },
    
    // DATA NODES
    {
      id: 'data-variable',
      category: 'data',
      name: 'Set Variable',
      description: 'Store data in variable',
      icon: '📦',
      inputs: [
        { name: 'name', type: 'string', required: true },
        { name: 'value', type: 'string', required: true }
      ],
      outputs: [{ name: 'output', type: 'string', required: true }],
      config: {}
    },
    {
      id: 'data-random',
      category: 'data',
      name: 'Random Number',
      description: 'Generate random number',
      icon: '🎲',
      inputs: [
        { name: 'min', type: 'number', required: true, default: 1 },
        { name: 'max', type: 'number', required: true, default: 100 }
      ],
      outputs: [{ name: 'value', type: 'number', required: true }],
      config: {}
    },
    {
      id: 'data-http',
      category: 'data',
      name: 'HTTP Request',
      description: 'Make API call',
      icon: '🌐',
      inputs: [
        { name: 'url', type: 'string', required: true },
        { name: 'method', type: 'select', required: true, options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' }
        ]}
      ],
      outputs: [{ name: 'response', type: 'string', required: true }],
      config: {}
    }
  ]);

  readonly statistics = signal({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 100
  });

  // Pre-built workflow templates
  readonly workflowTemplates = signal<Partial<AutomationWorkflow>[]>([
    {
      name: 'Welcome New Followers',
      description: 'Show alert and speak when someone follows',
      tags: ['followers', 'alerts'],
      trigger: {
        type: 'event',
        config: { event: 'follower' }
      }
    },
    {
      name: 'Big Donation Celebration',
      description: 'Special effects for donations over $100',
      tags: ['donations', 'effects'],
      trigger: {
        type: 'event',
        config: {
          event: 'donation',
          conditions: [{ field: 'amount', operator: 'greater', value: 100 }]
        }
      }
    },
    {
      name: 'Hourly Scene Rotation',
      description: 'Automatically rotate scenes every hour',
      tags: ['schedule', 'scenes'],
      trigger: {
        type: 'schedule',
        config: { schedule: '0 * * * *' }
      }
    }
  ]);

  createWorkflow(name: string, description?: string): AutomationWorkflow {
    const workflow: AutomationWorkflow = {
      id: crypto.randomUUID(),
      name,
      description,
      enabled: false,
      trigger: {
        type: 'manual',
        config: {}
      },
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date(),
      runCount: 0,
      tags: []
    };

    this.workflows.update(w => [...w, workflow]);
    this.updateStatistics();
    
    return workflow;
  }

  createFromTemplate(templateIndex: number): AutomationWorkflow {
    const template = this.workflowTemplates()[templateIndex];
    if (!template) throw new Error('Template not found');

    const workflow = this.createWorkflow(template.name!, template.description);
    
    if (template.trigger) {
      this.updateWorkflow(workflow.id, { trigger: template.trigger });
    }

    return workflow;
  }

  updateWorkflow(workflowId: string, updates: Partial<AutomationWorkflow>): void {
    this.workflows.update(workflows =>
      workflows.map(w => w.id === workflowId ? { ...w, ...updates } : w)
    );
  }

  deleteWorkflow(workflowId: string): void {
    this.workflows.update(w => w.filter(workflow => workflow.id !== workflowId));
    this.updateStatistics();
  }

  toggleWorkflow(workflowId: string): void {
    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId ? { ...w, enabled: !w.enabled } : w
      )
    );
    this.updateStatistics();
  }

  addNode(workflowId: string, templateId: string, position: { x: number; y: number }): void {
    const template = this.nodeTemplates().find(t => t.id === templateId);
    if (!template) return;

    const node: WorkflowNode = {
      id: crypto.randomUUID(),
      type: templateId,
      name: template.name,
      position,
      config: { ...template.config },
      enabled: true
    };

    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId
          ? { ...w, nodes: [...w.nodes, node] }
          : w
      )
    );
  }

  removeNode(workflowId: string, nodeId: string): void {
    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId
          ? {
              ...w,
              nodes: w.nodes.filter(n => n.id !== nodeId),
              connections: w.connections.filter(
                c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
              )
            }
          : w
      )
    );
  }

  connectNodes(workflowId: string, sourceNodeId: string, targetNodeId: string): void {
    const connection: WorkflowConnection = {
      id: crypto.randomUUID(),
      sourceNodeId,
      targetNodeId
    };

    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId
          ? { ...w, connections: [...w.connections, connection] }
          : w
      )
    );
  }

  disconnectNodes(workflowId: string, connectionId: string): void {
    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId
          ? { ...w, connections: w.connections.filter(c => c.id !== connectionId) }
          : w
      )
    );
  }

  async executeWorkflow(workflowId: string, context?: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows().find(w => w.id === workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflowId,
      startTime: new Date(),
      status: 'running',
      results: {},
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `Starting workflow: ${workflow.name}`
      }]
    };

    this.activeExecutions.update(e => [...e, execution]);

    try {
      // Execute nodes in order
      for (const node of workflow.nodes) {
        if (!node.enabled) continue;

        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          nodeId: node.id,
          message: `Executing node: ${node.name}`
        });

        await this.executeNode(node, context || {}, execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();

      execution.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Workflow completed successfully'
      });

    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = new Date();
      
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Workflow failed: ${error.message}`
      });
    }

    // Update workflow stats
    this.workflows.update(workflows =>
      workflows.map(w =>
        w.id === workflowId
          ? { ...w, lastRun: new Date(), runCount: w.runCount + 1 }
          : w
      )
    );

    // Remove from active executions
    this.activeExecutions.update(e => e.filter(ex => ex.id !== execution.id));
    this.updateStatistics();

    return execution;
  }

  private async executeNode(node: WorkflowNode, context: Record<string, any>, execution: WorkflowExecution): Promise<void> {
    // Simulate node execution based on type
    switch (node.type) {
      case 'action-switch-scene':
        console.log(`Switching to scene: ${node.config.sceneName}`);
        await this.delay(500);
        break;

      case 'action-play-sound':
        console.log(`Playing sound: ${node.config.soundId}`);
        await this.delay(300);
        break;

      case 'action-show-alert':
        console.log(`Showing alert: ${node.config.title}`);
        await this.delay(200);
        break;

      case 'logic-delay':
        await this.delay((node.config.seconds || 1) * 1000);
        break;

      case 'data-random':
        const random = Math.floor(
          Math.random() * (node.config.max - node.config.min + 1)
        ) + node.config.min;
        execution.results[node.id] = random;
        break;

      default:
        console.log(`Executing node type: ${node.type}`);
        await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateStatistics(): void {
    const workflows = this.workflows();
    this.statistics.set({
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.enabled).length,
      totalExecutions: workflows.reduce((sum, w) => sum + w.runCount, 0),
      successRate: 100
    });
  }

  exportWorkflow(workflowId: string): string {
    const workflow = this.workflows().find(w => w.id === workflowId);
    return workflow ? JSON.stringify(workflow, null, 2) : '';
  }

  importWorkflow(workflowJson: string): boolean {
    try {
      const workflow = JSON.parse(workflowJson) as AutomationWorkflow;
      workflow.id = crypto.randomUUID();
      workflow.createdAt = new Date();
      this.workflows.update(w => [...w, workflow]);
      this.updateStatistics();
      return true;
    } catch {
      return false;
    }
  }

  duplicateWorkflow(workflowId: string): AutomationWorkflow | null {
    const workflow = this.workflows().find(w => w.id === workflowId);
    if (!workflow) return null;

    const duplicate: AutomationWorkflow = {
      ...workflow,
      id: crypto.randomUUID(),
      name: `${workflow.name} (Copy)`,
      createdAt: new Date(),
      lastRun: undefined,
      runCount: 0,
      enabled: false
    };

    this.workflows.update(w => [...w, duplicate]);
    this.updateStatistics();
    
    return duplicate;
  }
}
