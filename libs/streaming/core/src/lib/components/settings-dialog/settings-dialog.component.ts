import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SettingsService } from '../../services/settings.service';

interface SettingsTab {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'streaming-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent {
  // Events
  readonly onClose = output<void>();
  readonly onSettingsSaved = output<void>();

  // UI State
  private isOpenSignal = signal<boolean>(false);
  private selectedTabSignal = signal<string>('general');
  private hasUnsavedChangesSignal = signal<boolean>(false);
  selectedTabIndex = 0;

  readonly isOpen = this.isOpenSignal.asReadonly();
  readonly selectedTab = this.selectedTabSignal.asReadonly();
  readonly hasUnsavedChanges = this.hasUnsavedChangesSignal.asReadonly();

  // Settings tabs
  readonly tabs: SettingsTab[] = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'stream', name: 'Stream', icon: '📡' },
    { id: 'output', name: 'Output', icon: '📤' },
    { id: 'audio', name: 'Audio', icon: '🎵' },
    { id: 'video', name: 'Video', icon: '📹' },
    { id: 'hotkeys', name: 'Hotkeys', icon: '⌨️' },
    { id: 'advanced', name: 'Advanced', icon: '🔧' },
    { id: 'ai', name: 'AI Features', icon: '🤖' },
    { id: 'cloud', name: 'Cloud & Sync', icon: '☁️' }
  ];

  // General settings
  private languageSignal = signal<string>('en');
  private themeSignal = signal<string>('dark');
  private autoStartSignal = signal<boolean>(false);
  private minimizeToTraySignal = signal<boolean>(true);

  readonly language = this.languageSignal.asReadonly();
  readonly theme = this.themeSignal.asReadonly();
  readonly autoStart = this.autoStartSignal.asReadonly();
  readonly minimizeToTray = this.minimizeToTraySignal.asReadonly();

  // Stream settings
  private streamServerSignal = signal<string>('rtmp://live.twitch.tv/app/');
  private streamKeySignal = signal<string>('');
  private serviceSignal = signal<string>('twitch');

  readonly streamServer = this.streamServerSignal.asReadonly();
  readonly streamKey = this.streamKeySignal.asReadonly();
  readonly service = this.serviceSignal.asReadonly();

  // Output settings
  private videoBitrateSignal = signal<number>(6000);
  private audioBitrateSignal = signal<number>(160);
  private encoderSignal = signal<string>('x264');
  private recordingFormatSignal = signal<string>('mp4');
  private recordingPathSignal = signal<string>('~/Videos/Recordings');

  readonly videoBitrate = this.videoBitrateSignal.asReadonly();
  readonly audioBitrate = this.audioBitrateSignal.asReadonly();
  readonly encoder = this.encoderSignal.asReadonly();
  readonly recordingFormat = this.recordingFormatSignal.asReadonly();
  readonly recordingPath = this.recordingPathSignal.asReadonly();

  // Video settings
  private baseResolutionSignal = signal<string>('1920x1080');
  private outputResolutionSignal = signal<string>('1920x1080');
  private fpsSignal = signal<number>(60);
  private downscaleFilterSignal = signal<string>('bicubic');

  readonly baseResolution = this.baseResolutionSignal.asReadonly();
  readonly outputResolution = this.outputResolutionSignal.asReadonly();
  readonly fps = this.fpsSignal.asReadonly();
  readonly downscaleFilter = this.downscaleFilterSignal.asReadonly();

  // Audio settings
  private sampleRateSignal = signal<number>(48000);
  private channelsSignal = signal<string>('stereo');
  private desktopAudioDeviceSignal = signal<string>('default');
  private micAudioDeviceSignal = signal<string>('default');

  readonly sampleRate = this.sampleRateSignal.asReadonly();
  readonly channels = this.channelsSignal.asReadonly();
  readonly desktopAudioDevice = this.desktopAudioDeviceSignal.asReadonly();
  readonly micAudioDevice = this.micAudioDeviceSignal.asReadonly();

  // Advanced settings
  private processPrioritySignal = signal<string>('normal');
  private rendererSignal = signal<string>('direct3d11');
  private colorFormatSignal = signal<string>('nv12');
  private colorSpaceSignal = signal<string>('709');
  private colorRangeSignal = signal<string>('partial');

  readonly processPriority = this.processPrioritySignal.asReadonly();
  readonly renderer = this.rendererSignal.asReadonly();
  readonly colorFormat = this.colorFormatSignal.asReadonly();
  readonly colorSpace = this.colorSpaceSignal.asReadonly();
  readonly colorRange = this.colorRangeSignal.asReadonly();

  // Available options
  readonly languages = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru'];
  readonly themes = ['dark', 'light', 'purple', 'blue', 'green'];
  readonly services = ['twitch', 'youtube', 'facebook', 'custom'];
  readonly encoders = ['x264', 'nvenc', 'qsv', 'amd'];
  readonly recordingFormats = ['mp4', 'mkv', 'flv', 'mov'];
  readonly resolutions = ['1920x1080', '2560x1440', '3840x2160', '1280x720'];
  readonly frameRates = [30, 60, 120, 144, 240];
  readonly filters = ['bicubic', 'bilinear', 'lanczos', 'area'];
  readonly sampleRates = [44100, 48000, 96000];
  readonly channelOptions = ['mono', 'stereo', '2.1', '4.0', '4.1', '5.1', '7.1'];
  readonly priorities = ['idle', 'normal', 'high', 'realtime'];
  readonly renderers = ['direct3d11', 'opengl', 'vulkan'];
  readonly colorFormats = ['nv12', 'i420', 'i444', 'rgb'];
  readonly colorSpaces = ['709', '601', '2020'];
  readonly colorRanges = ['partial', 'full'];

  constructor(private settingsService: SettingsService) {
    this.loadSettings();
  }

  open(): void {
    this.isOpenSignal.set(true);
  }

  close(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        this.isOpenSignal.set(false);
        this.onClose.emit();
      }
    } else {
      this.isOpenSignal.set(false);
      this.onClose.emit();
    }
  }

  selectTab(tabId: string): void {
    this.selectedTabSignal.set(tabId);
  }

  // Update methods
  updateLanguage(lang: string): void {
    this.languageSignal.set(lang);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateTheme(theme: string): void {
    this.themeSignal.set(theme);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateAutoStart(value: boolean): void {
    this.autoStartSignal.set(value);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateMinimizeToTray(value: boolean): void {
    this.minimizeToTraySignal.set(value);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateStreamServer(server: string): void {
    this.streamServerSignal.set(server);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateStreamKey(key: string): void {
    this.streamKeySignal.set(key);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateService(service: string): void {
    this.serviceSignal.set(service);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateVideoBitrate(bitrate: number): void {
    this.videoBitrateSignal.set(bitrate);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateAudioBitrate(bitrate: number): void {
    this.audioBitrateSignal.set(bitrate);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateEncoder(encoder: string): void {
    this.encoderSignal.set(encoder);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateRecordingFormat(format: string): void {
    this.recordingFormatSignal.set(format);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateRecordingPath(path: string): void {
    this.recordingPathSignal.set(path);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateBaseResolution(res: string): void {
    this.baseResolutionSignal.set(res);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateOutputResolution(res: string): void {
    this.outputResolutionSignal.set(res);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateFps(fps: number): void {
    this.fpsSignal.set(fps);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateDownscaleFilter(filter: string): void {
    this.downscaleFilterSignal.set(filter);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateSampleRate(rate: number): void {
    this.sampleRateSignal.set(rate);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateChannels(channels: string): void {
    this.channelsSignal.set(channels);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateDesktopAudioDevice(device: string): void {
    this.desktopAudioDeviceSignal.set(device);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateMicAudioDevice(device: string): void {
    this.micAudioDeviceSignal.set(device);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateProcessPriority(priority: string): void {
    this.processPrioritySignal.set(priority);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateRenderer(renderer: string): void {
    this.rendererSignal.set(renderer);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateColorFormat(format: string): void {
    this.colorFormatSignal.set(format);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateColorSpace(space: string): void {
    this.colorSpaceSignal.set(space);
    this.hasUnsavedChangesSignal.set(true);
  }

  updateColorRange(range: string): void {
    this.colorRangeSignal.set(range);
    this.hasUnsavedChangesSignal.set(true);
  }

  saveSettings(): void {
    // Save all settings
    const settings = {
      general: {
        language: this.language(),
        theme: this.theme(),
        autoStart: this.autoStart(),
        minimizeToTray: this.minimizeToTray()
      },
      stream: {
        server: this.streamServer(),
        key: this.streamKey(),
        service: this.service()
      },
      output: {
        videoBitrate: this.videoBitrate(),
        audioBitrate: this.audioBitrate(),
        encoder: this.encoder(),
        recordingFormat: this.recordingFormat(),
        recordingPath: this.recordingPath()
      },
      video: {
        baseResolution: this.baseResolution(),
        outputResolution: this.outputResolution(),
        fps: this.fps(),
        downscaleFilter: this.downscaleFilter()
      },
      audio: {
        sampleRate: this.sampleRate(),
        channels: this.channels(),
        desktopAudioDevice: this.desktopAudioDevice(),
        micAudioDevice: this.micAudioDevice()
      },
      advanced: {
        processPriority: this.processPriority(),
        renderer: this.renderer(),
        colorFormat: this.colorFormat(),
        colorSpace: this.colorSpace(),
        colorRange: this.colorRange()
      }
    };

    localStorage.setItem('streaming_settings', JSON.stringify(settings));
    this.hasUnsavedChangesSignal.set(false);
    this.onSettingsSaved.emit();
  }

  resetToDefaults(): void {
    if (confirm('Reset all settings to defaults?')) {
      this.languageSignal.set('en');
      this.themeSignal.set('dark');
      this.autoStartSignal.set(false);
      this.minimizeToTraySignal.set(true);
      this.videoBitrateSignal.set(6000);
      this.audioBitrateSignal.set(160);
      this.encoderSignal.set('x264');
      this.recordingFormatSignal.set('mp4');
      this.baseResolutionSignal.set('1920x1080');
      this.outputResolutionSignal.set('1920x1080');
      this.fpsSignal.set(60);
      this.downscaleFilterSignal.set('bicubic');
      this.sampleRateSignal.set(48000);
      this.channelsSignal.set('stereo');
      this.processPrioritySignal.set('normal');
      this.rendererSignal.set('direct3d11');
      this.colorFormatSignal.set('nv12');
      this.colorSpaceSignal.set('709');
      this.colorRangeSignal.set('partial');
      this.hasUnsavedChangesSignal.set(true);
    }
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('streaming_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);

        if (settings.general) {
          this.languageSignal.set(settings.general.language || 'en');
          this.themeSignal.set(settings.general.theme || 'dark');
          this.autoStartSignal.set(settings.general.autoStart || false);
          this.minimizeToTraySignal.set(settings.general.minimizeToTray ?? true);
        }

        if (settings.stream) {
          this.streamServerSignal.set(settings.stream.server || 'rtmp://live.twitch.tv/app/');
          this.streamKeySignal.set(settings.stream.key || '');
          this.serviceSignal.set(settings.stream.service || 'twitch');
        }

        if (settings.output) {
          this.videoBitrateSignal.set(settings.output.videoBitrate || 6000);
          this.audioBitrateSignal.set(settings.output.audioBitrate || 160);
          this.encoderSignal.set(settings.output.encoder || 'x264');
          this.recordingFormatSignal.set(settings.output.recordingFormat || 'mp4');
          this.recordingPathSignal.set(settings.output.recordingPath || '~/Videos/Recordings');
        }

        if (settings.video) {
          this.baseResolutionSignal.set(settings.video.baseResolution || '1920x1080');
          this.outputResolutionSignal.set(settings.video.outputResolution || '1920x1080');
          this.fpsSignal.set(settings.video.fps || 60);
          this.downscaleFilterSignal.set(settings.video.downscaleFilter || 'bicubic');
        }

        if (settings.audio) {
          this.sampleRateSignal.set(settings.audio.sampleRate || 48000);
          this.channelsSignal.set(settings.audio.channels || 'stereo');
          this.desktopAudioDeviceSignal.set(settings.audio.desktopAudioDevice || 'default');
          this.micAudioDeviceSignal.set(settings.audio.micAudioDevice || 'default');
        }

        if (settings.advanced) {
          this.processPrioritySignal.set(settings.advanced.processPriority || 'normal');
          this.rendererSignal.set(settings.advanced.renderer || 'direct3d11');
          this.colorFormatSignal.set(settings.advanced.colorFormat || 'nv12');
          this.colorSpaceSignal.set(settings.advanced.colorSpace || '709');
          this.colorRangeSignal.set(settings.advanced.colorRange || 'partial');
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }
}
