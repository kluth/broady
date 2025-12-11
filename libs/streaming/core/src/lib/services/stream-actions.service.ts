import { Injectable, inject } from '@angular/core';

/**
 * Stream Actions Service
 * Centralized service for executing stream-related actions
 * Used by Stream Deck, Channel Rewards, Hotkeys, and other automation systems
 */

@Injectable({
  providedIn: 'root'
})
export class StreamActionsService {
  // Services will be lazily injected to avoid circular dependencies
  private sceneService?: any;
  private sourceService?: any;
  private streamingService?: any;
  private recordingService?: any;
  private audioService?: any;
  private scriptingService?: any;
  private automationService?: any;
  private ttsService?: any;
  private alertService?: any;

  /**
   * Execute a scene switch
   */
  async switchScene(sceneId: string): Promise<void> {
    try {
      // Lazy inject scene service
      if (!this.sceneService) {
        const { SceneService } = await import('./scene.service');
        this.sceneService = inject(SceneService);
      }

      await this.sceneService.switchToScene(sceneId);
    } catch (error) {
      console.error('Failed to switch scene:', error);
      throw error;
    }
  }

  /**
   * Toggle source visibility
   */
  async toggleSource(sourceId: string): Promise<void> {
    try {
      if (!this.sourceService) {
        const { SourceService } = await import('./source.service');
        this.sourceService = inject(SourceService);
      }

      await this.sourceService.toggleVisibility(sourceId);
    } catch (error) {
      console.error('Failed to toggle source:', error);
      throw error;
    }
  }

  /**
   * Start streaming
   */
  async startStream(): Promise<void> {
    try {
      if (!this.streamingService) {
        const { StreamingService } = await import('./streaming.service');
        this.streamingService = inject(StreamingService);
      }

      await this.streamingService.startStreaming();
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }

  /**
   * Stop streaming
   */
  async stopStream(): Promise<void> {
    try {
      if (!this.streamingService) {
        const { StreamingService } = await import('./streaming.service');
        this.streamingService = inject(StreamingService);
      }

      await this.streamingService.stopStreaming();
    } catch (error) {
      console.error('Failed to stop stream:', error);
      throw error;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.recordingService) {
        const { RecordingService } = await import('./recording.service');
        this.recordingService = inject(RecordingService);
      }

      await this.recordingService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<void> {
    try {
      if (!this.recordingService) {
        const { RecordingService } = await import('./recording.service');
        this.recordingService = inject(RecordingService);
      }

      await this.recordingService.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Mute audio source
   */
  async muteAudio(sourceId: string): Promise<void> {
    try {
      if (!this.audioService) {
        const { AudioService } = await import('./audio.service');
        this.audioService = inject(AudioService);
      }

      await this.audioService.muteSource(sourceId);
    } catch (error) {
      console.error('Failed to mute audio:', error);
      throw error;
    }
  }

  /**
   * Unmute audio source
   */
  async unmuteAudio(sourceId: string): Promise<void> {
    try {
      if (!this.audioService) {
        const { AudioService } = await import('./audio.service');
        this.audioService = inject(AudioService);
      }

      await this.audioService.unmuteSource(sourceId);
    } catch (error) {
      console.error('Failed to unmute audio:', error);
      throw error;
    }
  }

  /**
   * Play sound effect
   */
  async playSound(soundFile: string): Promise<void> {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.7; // Default volume
      await audio.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  /**
   * Show alert on stream
   */
  async showAlert(options: {
    message: string;
    title?: string;
    duration?: number;
    sound?: string;
    imageUrl?: string;
  }): Promise<void> {
    try {
      if (!this.alertService) {
        // Alert service would handle overlay rendering
        // For now, we'll create a simple implementation
        this.createAlertOverlay(options);
      } else {
        await this.alertService.showAlert(options);
      }
    } catch (error) {
      console.error('Failed to show alert:', error);
      throw error;
    }
  }

  /**
   * Run custom script
   */
  async runScript(scriptId: string): Promise<void> {
    try {
      if (!this.scriptingService) {
        const { ScriptingService } = await import('./scripting.service');
        this.scriptingService = inject(ScriptingService);
      }

      await this.scriptingService.executeScript(scriptId);
    } catch (error) {
      console.error('Failed to run script:', error);
      throw error;
    }
  }

  /**
   * Run workflow
   */
  async runWorkflow(workflowId: string): Promise<void> {
    try {
      if (!this.automationService) {
        const { AutomationService } = await import('./automation.service');
        this.automationService = inject(AutomationService);
      }

      await this.automationService.executeWorkflow(workflowId);
    } catch (error) {
      console.error('Failed to run workflow:', error);
      throw error;
    }
  }

  /**
   * Text-to-speech
   */
  async speak(text: string, options?: { voice?: string; rate?: number; pitch?: number }): Promise<void> {
    try {
      if (!this.ttsService) {
        const { TTSService } = await import('./tts.service');
        this.ttsService = inject(TTSService);
      }

      await this.ttsService.speak(text, options);
    } catch (error) {
      console.error('Failed to speak text:', error);
      // Fallback to browser TTS
      this.fallbackTTS(text, options);
    }
  }

  /**
   * Trigger screen shake effect
   */
  triggerScreenShake(intensity: number = 10, duration: number = 500): void {
    const element = document.body;
    const originalTransform = element.style.transform;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const currentIntensity = intensity * (1 - progress);
        const x = (Math.random() - 0.5) * currentIntensity;
        const y = (Math.random() - 0.5) * currentIntensity;
        element.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
      } else {
        element.style.transform = originalTransform;
      }
    };

    animate();
  }

  /**
   * Apply color filter effect
   */
  applyColorEffect(effect: string, duration: number = 3000): void {
    const element = document.body;
    const originalFilter = element.style.filter;

    const filterMap: Record<string, string> = {
      'sepia': 'sepia(100%)',
      'grayscale': 'grayscale(100%)',
      'invert': 'invert(100%)',
      'hue-rotate': 'hue-rotate(180deg)',
      'saturate': 'saturate(300%)',
      'brightness': 'brightness(150%)',
      'contrast': 'contrast(200%)'
    };

    element.style.filter = filterMap[effect] || effect;

    setTimeout(() => {
      element.style.filter = originalFilter;
    }, duration);
  }

  /**
   * Highlight message (would integrate with chat overlay)
   */
  highlightMessage(username: string, message?: string): void {
    // This would integrate with the chat overlay system
    // For now, we'll create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `⭐ Highlighted: ${username}${message ? ` - ${message}` : ''}`;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Open website
   */
  openWebsite(url: string): void {
    window.open(url, '_blank');
  }

  // Private helper methods

  private createAlertOverlay(options: {
    message: string;
    title?: string;
    duration?: number;
    sound?: string;
    imageUrl?: string;
  }): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      text-align: center;
      min-width: 300px;
      animation: alertPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;

    if (options.title) {
      const title = document.createElement('h2');
      title.style.cssText = 'margin: 0 0 15px 0; font-size: 28px;';
      title.textContent = options.title;
      overlay.appendChild(title);
    }

    if (options.imageUrl) {
      const img = document.createElement('img');
      img.src = options.imageUrl;
      img.style.cssText = 'max-width: 200px; margin: 15px 0; border-radius: 10px;';
      overlay.appendChild(img);
    }

    const message = document.createElement('p');
    message.style.cssText = 'margin: 0; font-size: 18px;';
    message.textContent = options.message;
    overlay.appendChild(message);

    document.body.appendChild(overlay);

    // Play sound if specified
    if (options.sound) {
      this.playSound(options.sound).catch(console.error);
    }

    // Remove after duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      overlay.style.animation = 'alertPop 0.3s ease-in reverse';
      setTimeout(() => overlay.remove(), 300);
    }, duration);
  }

  private fallbackTTS(text: string, options?: { voice?: string; rate?: number; pitch?: number }): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      window.speechSynthesis.speak(utterance);
    }
  }
}
