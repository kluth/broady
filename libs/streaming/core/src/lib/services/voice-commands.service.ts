import { Injectable, signal } from '@angular/core';

/**
 * Voice Commands Service
 * Speech recognition for hands-free control of streaming
 */

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters?: Record<string, unknown>;
  enabled: boolean;
  confidence: number; // 0-1, minimum confidence to trigger
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  timestamp: Date;
  commandMatched?: VoiceCommand;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceCommandsService {
  readonly isListening = signal(false);
  readonly isSupported = signal(typeof (window as any).webkitSpeechRecognition !== 'undefined' || typeof (window as any).SpeechRecognition !== 'undefined');
  
  readonly commands = signal<VoiceCommand[]>([
    { id: '1', phrase: 'start streaming', action: 'startStream', enabled: true, confidence: 0.8 },
    { id: '2', phrase: 'stop streaming', action: 'stopStream', enabled: true, confidence: 0.8 },
    { id: '3', phrase: 'start recording', action: 'startRecording', enabled: true, confidence: 0.8 },
    { id: '4', phrase: 'stop recording', action: 'stopRecording', enabled: true, confidence: 0.8 },
    { id: '5', phrase: 'mute microphone', action: 'muteMic', enabled: true, confidence: 0.8 },
    { id: '6', phrase: 'unmute microphone', action: 'unmuteMic', enabled: true, confidence: 0.8 },
    { id: '7', phrase: 'switch scene', action: 'nextScene', enabled: true, confidence: 0.7 },
    { id: '8', phrase: 'previous scene', action: 'previousScene', enabled: true, confidence: 0.7 },
    { id: '9', phrase: 'save replay', action: 'saveReplay', enabled: true, confidence: 0.8 },
    { id: '10', phrase: 'take screenshot', action: 'screenshot', enabled: true, confidence: 0.8 },
    { id: '11', phrase: 'show chat', action: 'toggleChat', enabled: true, confidence: 0.7 },
    { id: '12', phrase: 'hide chat', action: 'toggleChat', enabled: true, confidence: 0.7 },
    { id: '13', phrase: 'emergency stop', action: 'emergencyStop', enabled: true, confidence: 0.9 },
  ]);

  readonly recognitionHistory = signal<VoiceRecognitionResult[]>([]);
  readonly lastRecognized = signal<string>('');
  readonly language = signal('en-US');

  private recognition: any = null;
  private recognitionTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (!this.isSupported()) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language();
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcript = result[0].transcript.trim().toLowerCase();
      const confidence = result[0].confidence;

      this.lastRecognized.set(transcript);

      if (result.isFinal) {
        this.processVoiceInput(transcript, confidence);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        this.restartRecognition();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening()) {
        this.restartRecognition();
      }
    };
  }

  startListening(): void {
    if (!this.isSupported() || this.isListening()) return;

    try {
      this.recognition.start();
      this.isListening.set(true);
      console.log('Voice recognition started');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  }

  stopListening(): void {
    if (!this.isListening()) return;

    try {
      this.recognition.stop();
      this.isListening.set(false);
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  private restartRecognition(): void {
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
    }

    this.recognitionTimeout = setTimeout(() => {
      if (this.isListening()) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    }, 1000);
  }

  private processVoiceInput(transcript: string, confidence: number): void {
    const matchedCommand = this.findMatchingCommand(transcript, confidence);

    const result: VoiceRecognitionResult = {
      transcript,
      confidence,
      timestamp: new Date(),
      commandMatched: matchedCommand
    };

    this.recognitionHistory.update(h => [result, ...h].slice(0, 50));

    if (matchedCommand) {
      this.executeCommand(matchedCommand);
    }
  }

  private findMatchingCommand(transcript: string, confidence: number): VoiceCommand | undefined {
    const activeCommands = this.commands().filter(c => c.enabled);

    for (const command of activeCommands) {
      const phrase = command.phrase.toLowerCase();
      
      if (transcript.includes(phrase) && confidence >= command.confidence) {
        return command;
      }
    }

    return undefined;
  }

  private executeCommand(command: VoiceCommand): void {
    console.log(`Executing voice command: ${command.phrase} -> ${command.action}`);

    window.dispatchEvent(new CustomEvent('voice-command', {
      detail: {
        action: command.action,
        parameters: command.parameters,
        command
      }
    }));
  }

  addCommand(phrase: string, action: string, confidence: number = 0.8, parameters?: Record<string, unknown>): void {
    const command: VoiceCommand = {
      id: crypto.randomUUID(),
      phrase: phrase.toLowerCase(),
      action,
      enabled: true,
      confidence,
      parameters
    };

    this.commands.update(cmds => [...cmds, command]);
    console.log(`Added voice command: "${phrase}"`);
  }

  removeCommand(id: string): void {
    this.commands.update(cmds => cmds.filter(c => c.id !== id));
  }

  toggleCommand(id: string): void {
    this.commands.update(cmds =>
      cmds.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
    );
  }

  setLanguage(lang: string): void {
    this.language.set(lang);
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  clearHistory(): void {
    this.recognitionHistory.set([]);
  }
}
