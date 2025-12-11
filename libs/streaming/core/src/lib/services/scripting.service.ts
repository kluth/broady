import { Injectable, signal } from '@angular/core';
import { AutomationService, AutomationWorkflow } from './automation.service';

/**
 * Scripting Service
 * Easy-to-learn scripting language for stream automation
 *
 * Example syntax:
 *
 * when donation > 100 then
 *   playSound('epic')
 *   switchScene('celebration')
 *   showAlert('Big donation!', 'Thank you!', 10)
 * end
 *
 * on follower do
 *   speak('Thank you for following!')
 *   showAlert('New Follower', '{{username}}', 5)
 * end
 *
 * every 1 hour do
 *   switchScene('next')
 *   speak('Time for a scene change!')
 * end
 */

export interface Script {
  id: string;
  name: string;
  description?: string;
  code: string;
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
  errors: ScriptError[];
}

export interface ScriptError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedScript {
  triggers: ScriptTrigger[];
  actions: ScriptAction[];
  conditions: ScriptCondition[];
  variables: Map<string, any>;
}

export interface ScriptTrigger {
  type: 'event' | 'schedule' | 'manual';
  event?: string;
  conditions?: ScriptCondition[];
  schedule?: string;
}

export interface ScriptAction {
  command: string;
  args: any[];
}

export interface ScriptCondition {
  left: string;
  operator: string;
  right: any;
}

interface Token {
  type: 'keyword' | 'identifier' | 'operator' | 'string' | 'number' | 'symbol';
  value: string;
  line: number;
  column: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptingService {
  readonly scripts = signal<Script[]>([]);
  readonly activeScripts = signal<Script[]>([]);

  // Available commands
  readonly commands = signal<string[]>([
    // Scene commands
    'switchScene', 'nextScene', 'previousScene',

    // Alert commands
    'showAlert', 'hideAlert',

    // Sound commands
    'playSound', 'stopSound', 'setVolume',

    // Text-to-Speech
    'speak', 'stopSpeaking',

    // Lower thirds
    'showLowerThird', 'hideLowerThird',

    // Clips
    'createClip', 'saveReplay',

    // Social media
    'tweet', 'postDiscord',

    // Viewer engagement
    'startPoll', 'endPoll', 'startPrediction',

    // Effects
    'enableChromaKey', 'disableChromaKey', 'enableBackgroundRemoval',

    // Recording
    'startRecording', 'stopRecording', 'pauseRecording',

    // Streaming
    'startStream', 'stopStream',

    // Variables
    'set', 'get', 'increment', 'decrement',

    // Logic
    'wait', 'repeat', 'random'
  ]);

  // Example scripts
  readonly exampleScripts = signal<Array<{ name: string; code: string }>>([
    {
      name: 'Welcome New Followers',
      code: `on follower do
  showAlert('New Follower', '{{username}} just followed!', 5)
  speak('Thank you {{username}} for following!')
  playSound('follower-alert')
end`
    },
    {
      name: 'Big Donation Effects',
      code: `when donation > 100 then
  playSound('epic-donation')
  switchScene('celebration')
  showAlert('EPIC DONATION!', '{{donor}} donated \${{amount}}!', 10)
  speak('Wow! {{donor}} just donated {{amount}} dollars!')
  createClip(30, 'Epic Donation from {{donor}}')
  wait(5)
  switchScene('gameplay')
end`
    },
    {
      name: 'Hourly Scene Rotation',
      code: `every 1 hour do
  set sceneIndex = get(sceneIndex) + 1
  if sceneIndex > 3 then
    set sceneIndex = 0
  end
  switchScene('scene-' + sceneIndex)
  speak('Switching to a new scene!')
end`
    },
    {
      name: 'Auto Clip on Keywords',
      code: `when chat contains 'clip that' then
  createClip(30, 'Viewer requested clip')
  showAlert('Creating Clip', 'Clipping the last 30 seconds!', 3)
end`
    },
    {
      name: 'Interactive Voice Commands',
      code: `on voice-command 'next scene' do
  nextScene()
  speak('Switching to the next scene!')
end

on voice-command 'start recording' do
  startRecording()
  speak('Recording started!')
  showAlert('Recording', 'Now recording!', 3)
end`
    },
    {
      name: 'Random Viewer Shoutout',
      code: `every 15 minutes do
  if viewerCount > 10 then
    set viewer = random(viewers)
    showLowerThird('Shoutout', 'Thanks {{viewer}} for watching!', 10)
    speak('Shoutout to {{viewer}} for hanging out!')
  end
end`
    }
  ]);

  constructor(private automationService: AutomationService) {}

  createScript(name: string, code: string = ''): Script {
    const script: Script = {
      id: crypto.randomUUID(),
      name,
      code,
      enabled: false,
      createdAt: new Date(),
      runCount: 0,
      errors: []
    };

    this.scripts.update(s => [...s, script]);
    return script;
  }

  updateScript(scriptId: string, code: string): void {
    this.scripts.update(scripts =>
      scripts.map(s => {
        if (s.id === scriptId) {
          const errors = this.validate(code);
          return { ...s, code, errors };
        }
        return s;
      })
    );
  }

  deleteScript(scriptId: string): void {
    this.scripts.update(s => s.filter(script => script.id !== scriptId));
  }

  toggleScript(scriptId: string): void {
    this.scripts.update(scripts =>
      scripts.map(s =>
        s.id === scriptId ? { ...s, enabled: !s.enabled } : s
      )
    );
    this.updateActiveScripts();
  }

  /**
   * Validate script syntax
   */
  validate(code: string): ScriptError[] {
    const errors: ScriptError[] = [];

    try {
      const tokens = this.tokenize(code);
      this.parse(tokens);
    } catch (error: any) {
      errors.push({
        line: error.line || 1,
        column: error.column || 1,
        message: error.message,
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Tokenize script code
   */
  private tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');

    const keywords = ['when', 'then', 'end', 'on', 'do', 'if', 'else', 'every', 'minutes', 'hour', 'hours', 'seconds'];
    const operators = ['>', '<', '>=', '<=', '==', '!=', '=', '+', '-', '*', '/', 'and', 'or', 'not', 'contains'];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let column = 0;

      while (column < line.length) {
        const char = line[column];

        // Skip whitespace
        if (/\s/.test(char)) {
          column++;
          continue;
        }

        // Skip comments
        if (char === '#' || (char === '/' && line[column + 1] === '/')) {
          break;
        }

        // String literals
        if (char === "'" || char === '"') {
          const quote = char;
          let value = '';
          column++;

          while (column < line.length && line[column] !== quote) {
            if (line[column] === '\\' && column + 1 < line.length) {
              column++;
              value += line[column];
            } else {
              value += line[column];
            }
            column++;
          }

          tokens.push({
            type: 'string',
            value,
            line: lineNum + 1,
            column
          });
          column++; // Skip closing quote
          continue;
        }

        // Numbers
        if (/\d/.test(char)) {
          let value = '';
          while (column < line.length && /[\d.]/.test(line[column])) {
            value += line[column];
            column++;
          }
          tokens.push({
            type: 'number',
            value,
            line: lineNum + 1,
            column
          });
          continue;
        }

        // Operators and symbols
        if ('(){}[]<>=!+-*/,'.includes(char)) {
          let value = char;
          column++;

          // Check for two-character operators
          if (column < line.length && '=<>!'.includes(char) && line[column] === '=') {
            value += line[column];
            column++;
          }

          tokens.push({
            type: operators.includes(value) ? 'operator' : 'symbol',
            value,
            line: lineNum + 1,
            column
          });
          continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(char)) {
          let value = '';
          while (column < line.length && /[a-zA-Z0-9_-]/.test(line[column])) {
            value += line[column];
            column++;
          }

          tokens.push({
            type: keywords.includes(value) || operators.includes(value) ? 'keyword' : 'identifier',
            value,
            line: lineNum + 1,
            column
          });
          continue;
        }

        column++;
      }
    }

    return tokens;
  }

  /**
   * Parse tokens into script structure
   */
  private parse(tokens: Token[]): ParsedScript {
    const script: ParsedScript = {
      triggers: [],
      actions: [],
      conditions: [],
      variables: new Map()
    };

    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      // Parse trigger blocks
      if (token.type === 'keyword' && (token.value === 'when' || token.value === 'on' || token.value === 'every')) {
        const block = this.parseTriggerBlock(tokens, i);
        script.triggers.push(block.trigger);
        script.actions.push(...block.actions);
        i = block.endIndex;
        continue;
      }

      i++;
    }

    return script;
  }

  /**
   * Parse trigger block (when/on/every)
   */
  private parseTriggerBlock(tokens: Token[], startIndex: number): {
    trigger: ScriptTrigger;
    actions: ScriptAction[];
    endIndex: number;
  } {
    const keyword = tokens[startIndex].value;
    let i = startIndex + 1;
    const actions: ScriptAction[] = [];

    let trigger: ScriptTrigger = { type: 'manual' };

    if (keyword === 'when') {
      // Parse condition: when donation > 100 then
      const eventName = tokens[i].value;
      i++;

      const condition: ScriptCondition = {
        left: eventName,
        operator: '',
        right: null
      };

      // Check for operator
      if (i < tokens.length && tokens[i].type === 'operator') {
        condition.operator = tokens[i].value;
        i++;
        condition.right = tokens[i].value;
        i++;
      }

      trigger = {
        type: 'event',
        event: eventName,
        conditions: condition.operator ? [condition] : undefined
      };

      // Skip 'then'
      if (i < tokens.length && tokens[i].value === 'then') {
        i++;
      }
    } else if (keyword === 'on') {
      // Parse event: on follower do
      const eventName = tokens[i].value;
      i++;

      trigger = {
        type: 'event',
        event: eventName
      };

      // Skip 'do'
      if (i < tokens.length && tokens[i].value === 'do') {
        i++;
      }
    } else if (keyword === 'every') {
      // Parse schedule: every 1 hour do
      const amount = tokens[i].value;
      i++;
      const unit = tokens[i].value;
      i++;

      trigger = {
        type: 'schedule',
        schedule: `${amount} ${unit}`
      };

      // Skip 'do'
      if (i < tokens.length && tokens[i].value === 'do') {
        i++;
      }
    }

    // Parse actions until 'end'
    while (i < tokens.length && tokens[i].value !== 'end') {
      if (tokens[i].type === 'identifier') {
        const command = tokens[i].value;
        i++;

        const args: any[] = [];

        // Parse arguments
        if (i < tokens.length && tokens[i].value === '(') {
          i++; // Skip opening paren

          while (i < tokens.length && tokens[i].value !== ')') {
            if (tokens[i].type === 'string' || tokens[i].type === 'number') {
              args.push(tokens[i].value);
              i++;
            } else if (tokens[i].value === ',') {
              i++; // Skip comma
            } else {
              i++;
            }
          }

          if (i < tokens.length && tokens[i].value === ')') {
            i++; // Skip closing paren
          }
        }

        actions.push({ command, args });
      } else {
        i++;
      }
    }

    // Skip 'end'
    if (i < tokens.length && tokens[i].value === 'end') {
      i++;
    }

    return { trigger, actions, endIndex: i };
  }

  /**
   * Execute script
   */
  async executeScript(scriptId: string, context?: Record<string, any>): Promise<void> {
    const script = this.scripts().find(s => s.id === scriptId);
    if (!script) throw new Error('Script not found');

    const errors = this.validate(script.code);
    if (errors.length > 0) {
      throw new Error(`Script has errors: ${errors[0].message}`);
    }

    try {
      const tokens = this.tokenize(script.code);
      const parsed = this.parse(tokens);

      // Execute actions
      for (const action of parsed.actions) {
        await this.executeAction(action, context || {});
      }

      // Update script stats
      this.scripts.update(scripts =>
        scripts.map(s =>
          s.id === scriptId
            ? { ...s, lastRun: new Date(), runCount: s.runCount + 1 }
            : s
        )
      );
    } catch (error: any) {
      console.error('Script execution error:', error);
      throw error;
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: ScriptAction, context: Record<string, any>): Promise<void> {
    const { command, args } = action;

    // Replace template variables in args
    const processedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '');
      }
      return arg;
    });

    console.log(`Executing: ${command}(${processedArgs.join(', ')})`);

    // Execute command
    switch (command) {
      case 'switchScene':
        // Integration with scene service would go here
        break;

      case 'showAlert':
        // Integration with alerts service
        break;

      case 'playSound':
        // Integration with sound alerts service
        break;

      case 'speak':
        // Integration with TTS service
        break;

      case 'wait':
        const seconds = parseFloat(processedArgs[0] || '1');
        await this.delay(seconds * 1000);
        break;

      case 'createClip':
        // Integration with clip creator service
        break;

      case 'tweet':
        // Integration with social media service
        break;

      case 'showLowerThird':
        // Integration with lower thirds service
        break;

      default:
        console.warn(`Unknown command: ${command}`);
    }
  }

  /**
   * Convert script to visual workflow
   */
  convertToWorkflow(scriptId: string): AutomationWorkflow {
    const script = this.scripts().find(s => s.id === scriptId);
    if (!script) throw new Error('Script not found');

    const tokens = this.tokenize(script.code);
    const parsed = this.parse(tokens);

    // Create new workflow
    const workflow = this.automationService.createWorkflow(
      script.name,
      `Generated from script: ${script.name}`
    );

    // Set trigger from first trigger in script
    if (parsed.triggers.length > 0) {
      const trigger = parsed.triggers[0];

      this.automationService.updateWorkflow(workflow.id, {
        trigger: {
          type: trigger.type === 'schedule' ? 'schedule' : 'event',
          config: {
            event: trigger.event,
            schedule: trigger.schedule
          }
        }
      });
    }

    // Add action nodes for each action
    let x = 100;
    const y = 200;
    let previousNodeId: string | null = null;

    for (const action of parsed.actions) {
      // Map script action to node template
      const templateId = this.mapActionToTemplate(action.command);
      if (templateId) {
        this.automationService.addNode(workflow.id, templateId, { x, y });

        // Get the last added node (hacky but works for now)
        const workflowData = this.automationService.workflows().find(w => w.id === workflow.id);
        if (workflowData && workflowData.nodes.length > 0) {
          const currentNode = workflowData.nodes[workflowData.nodes.length - 1];

          // Connect to previous node
          if (previousNodeId) {
            this.automationService.connectNodes(workflow.id, previousNodeId, currentNode.id);
          }

          previousNodeId = currentNode.id;
        }

        x += 200;
      }
    }

    return workflow;
  }

  /**
   * Map script action to node template ID
   */
  private mapActionToTemplate(command: string): string | null {
    const mapping: Record<string, string> = {
      'switchScene': 'action-switch-scene',
      'playSound': 'action-play-sound',
      'showAlert': 'action-show-alert',
      'speak': 'action-tts',
      'tweet': 'action-send-tweet',
      'createClip': 'action-create-clip',
      'showLowerThird': 'action-lower-third',
      'wait': 'logic-delay'
    };

    return mapping[command] || null;
  }

  private updateActiveScripts(): void {
    this.activeScripts.set(this.scripts().filter(s => s.enabled));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get script documentation
   */
  getDocumentation(): string {
    return `
# Broady Scripting Language

## Basic Syntax

### Event Triggers
\`\`\`
on <event> do
  <actions>
end
\`\`\`

### Conditional Triggers
\`\`\`
when <event> <operator> <value> then
  <actions>
end
\`\`\`

### Scheduled Triggers
\`\`\`
every <amount> <unit> do
  <actions>
end
\`\`\`

## Available Events
- follower, donation, subscriber, raid, host
- chat, voice-command
- stream-start, stream-end
- scene-changed

## Available Commands

### Scenes
- switchScene(name)
- nextScene()
- previousScene()

### Alerts
- showAlert(title, message, duration)
- hideAlert()

### Sounds
- playSound(soundId, volume)
- stopSound()

### Text-to-Speech
- speak(text, voice)
- stopSpeaking()

### Lower Thirds
- showLowerThird(title, subtitle, duration)
- hideLowerThird()

### Clips
- createClip(duration, title)
- saveReplay()

### Social Media
- tweet(message)
- postDiscord(message)

### Effects
- enableChromaKey()
- enableBackgroundRemoval()

### Recording/Streaming
- startRecording()
- stopRecording()
- startStream()
- stopStream()

### Variables
- set name = value
- get(name)

### Logic
- wait(seconds)
- if <condition> then ... end
- repeat(count) ... end

## Examples

### Welcome Followers
\`\`\`
on follower do
  showAlert('New Follower', '{{username}} just followed!', 5)
  speak('Thank you {{username}} for following!')
end
\`\`\`

### Big Donations
\`\`\`
when donation > 100 then
  playSound('epic')
  switchScene('celebration')
  wait(5)
  switchScene('gameplay')
end
\`\`\`

### Hourly Rotation
\`\`\`
every 1 hour do
  nextScene()
  speak('Switching scenes!')
end
\`\`\`
`;
  }
}
