import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { ApplicationSettings } from '../models/settings.model';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings).toBeDefined();
        expect(settings.general).toBeDefined();
        expect(settings.video).toBeDefined();
        expect(settings.audio).toBeDefined();
        expect(settings.output).toBeDefined();
        expect(settings.advanced).toBeDefined();
        done();
      });
    });

    it('should have default general settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('en');
        expect(settings.general.theme).toBe('dark');
        expect(settings.general.confirmOnExit).toBe(true);
        expect(settings.general.snappingEnabled).toBe(true);
        expect(settings.general.snapDistance).toBe(10);
        done();
      });
    });

    it('should have default video settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings.video.baseResolution).toEqual({ width: 1920, height: 1080 });
        expect(settings.video.outputResolution).toEqual({ width: 1920, height: 1080 });
        expect(settings.video.fps).toBe(60);
        expect(settings.video.downscaleFilter).toBe('lanczos');
        done();
      });
    });

    it('should have default audio settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings.audio.sampleRate).toBe(48000);
        expect(settings.audio.channels).toBe('stereo');
        expect(settings.audio.desktopAudioDevice).toBe('default');
        done();
      });
    });

    it('should have default output settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings.output.mode).toBe('simple');
        expect(settings.output.streaming.videoBitrate).toBe(2500);
        expect(settings.output.recording.format).toBe('mp4');
        expect(settings.output.replayBuffer.enabled).toBe(false);
        done();
      });
    });

    it('should have default advanced settings', (done) => {
      service.settings$.subscribe(settings => {
        expect(settings.advanced.processRenderPriority).toBe('normal');
        expect(settings.advanced.colorFormat).toBe('nv12');
        expect(settings.advanced.automaticReconnect).toBe(true);
        expect(settings.advanced.reconnectDelay).toBe(10);
        done();
      });
    });

    it('should load settings from localStorage if available', () => {
      const customSettings: ApplicationSettings = {
        general: {
          language: 'es',
          theme: 'light',
          confirmOnExit: false,
          showConfirmationOnStreamStop: false,
          snappingEnabled: false,
          screenSnapping: false,
          sourceSnapping: false,
          centerSnapping: false,
          snapDistance: 5,
          recordWhenStreaming: true,
          keepRecordingWhenStreamStops: true,
          replayBufferWhileStreaming: true
        },
        video: {
          baseResolution: { width: 2560, height: 1440 },
          outputResolution: { width: 1920, height: 1080 },
          downscaleFilter: 'bicubic',
          fps: 30,
          fpsType: 'fractional',
          renderer: 'opengl'
        },
        audio: {
          sampleRate: 44100,
          channels: 'mono',
          desktopAudioDevice: 'custom',
          micAudioDevice: 'custom'
        },
        output: {
          mode: 'advanced',
          streaming: {
            videoBitrate: 6000,
            encoder: 'nvenc',
            audioTrack: 2,
            twitchVODTrack: true
          },
          recording: {
            type: 'custom',
            recordingPath: '/custom/path',
            generateTimestamp: false,
            format: 'mkv',
            videoEncoder: 'nvenc',
            audioEncoder: 'opus',
            videoTracks: 2,
            multitrackVideo: true
          },
          audio: {
            track1Bitrate: 320,
            track1Name: 'Main Audio'
          },
          replayBuffer: {
            enabled: true,
            duration: 60,
            prefix: 'Highlight',
            suffix: '-clip'
          }
        },
        hotkeys: {},
        advanced: {
          processRenderPriority: 'high',
          colorFormat: 'i444',
          colorSpace: '601',
          colorRange: 'full',
          audioMonitoringDevice: 'custom',
          disableWindowsAudioDucking: false,
          automaticReconnect: false,
          reconnectDelay: 5,
          maxRetries: 10,
          networkBuffering: true,
          bindToIP: '192.168.1.1',
          enableNewNetworkCode: false,
          enableLowLatencyMode: true
        }
      };

      localStorage.setItem('streaming-settings', JSON.stringify(customSettings));

      // Create new service instance to trigger loadSettings
      const newService = TestBed.inject(SettingsService);

      newService.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('es');
        expect(settings.general.theme).toBe('light');
        expect(settings.video.fps).toBe(30);
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('streaming-settings', 'invalid json {]');

      const consoleError = spyOn(console, 'error');

      // Create new service instance
      const newService = TestBed.inject(SettingsService);

      expect(consoleError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load settings'), jasmine.any(Error));

      // Should still have default settings
      newService.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('en');
      });
    });
  });

  describe('Update Settings', () => {
    it('should update general settings', (done) => {
      service.updateSettings({
        general: {
          language: 'fr',
          theme: 'light'
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('fr');
        expect(settings.general.theme).toBe('light');
        // Other settings should remain default
        expect(settings.general.confirmOnExit).toBe(true);
        done();
      });
    });

    it('should update video settings', (done) => {
      service.updateSettings({
        video: {
          fps: 30,
          baseResolution: { width: 2560, height: 1440 }
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.video.fps).toBe(30);
        expect(settings.video.baseResolution).toEqual({ width: 2560, height: 1440 });
        expect(settings.video.downscaleFilter).toBe('lanczos'); // Unchanged
        done();
      });
    });

    it('should update audio settings', (done) => {
      service.updateSettings({
        audio: {
          sampleRate: 44100,
          channels: 'mono'
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.audio.sampleRate).toBe(44100);
        expect(settings.audio.channels).toBe('mono');
        done();
      });
    });

    it('should update nested output settings', (done) => {
      service.updateSettings({
        output: {
          streaming: {
            videoBitrate: 6000
          }
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.output.streaming.videoBitrate).toBe(6000);
        // Other nested properties should remain
        expect(settings.output.streaming.encoder).toBe('x264');
        expect(settings.output.recording.format).toBe('mp4');
        done();
      });
    });

    it('should update advanced settings', (done) => {
      service.updateSettings({
        advanced: {
          processRenderPriority: 'high',
          reconnectDelay: 15
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.advanced.processRenderPriority).toBe('high');
        expect(settings.advanced.reconnectDelay).toBe(15);
        expect(settings.advanced.maxRetries).toBe(20); // Unchanged
        done();
      });
    });

    it('should deep merge nested objects', (done) => {
      service.updateSettings({
        output: {
          replayBuffer: {
            enabled: true,
            duration: 45
          }
        } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.output.replayBuffer.enabled).toBe(true);
        expect(settings.output.replayBuffer.duration).toBe(45);
        // Should keep other replayBuffer properties
        expect(settings.output.replayBuffer.prefix).toBe('Replay');
        expect(settings.output.replayBuffer.suffix).toBe('');
        // Should keep other output properties
        expect(settings.output.mode).toBe('simple');
        done();
      });
    });

    it('should save settings to localStorage', () => {
      service.updateSettings({
        general: {
          language: 'de'
        } as any
      });

      const stored = localStorage.getItem('streaming-settings');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.general.language).toBe('de');
    });

    it('should handle multiple sequential updates', (done) => {
      service.updateSettings({
        general: { language: 'es' } as any
      });

      service.updateSettings({
        general: { theme: 'light' } as any
      });

      service.updateSettings({
        video: { fps: 120 } as any
      });

      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('es');
        expect(settings.general.theme).toBe('light');
        expect(settings.video.fps).toBe(120);
        done();
      });
    });

    it('should handle update errors gracefully', () => {
      const consoleError = spyOn(console, 'error');

      // Mock localStorage.setItem to throw
      spyOn(Storage.prototype, 'setItem').and.throwError('Storage full');

      service.updateSettings({
        general: { language: 'test' } as any
      });

      expect(consoleError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to save settings'),
        jasmine.any(Error)
      );
    });
  });

  describe('Reset Settings', () => {
    it('should reset to default settings', (done) => {
      // First update settings
      service.updateSettings({
        general: { language: 'es', theme: 'light' } as any,
        video: { fps: 30 } as any
      });

      // Then reset
      service.resetSettings();

      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('en');
        expect(settings.general.theme).toBe('dark');
        expect(settings.video.fps).toBe(60);
        done();
      });
    });

    it('should save default settings to localStorage', () => {
      service.updateSettings({
        general: { language: 'es' } as any
      });

      service.resetSettings();

      const stored = localStorage.getItem('streaming-settings');
      const parsed = JSON.parse(stored!);

      expect(parsed.general.language).toBe('en');
      expect(parsed.general.theme).toBe('dark');
    });
  });

  describe('Export Settings', () => {
    it('should export settings as JSON string', () => {
      const exported = service.exportSettings();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.general).toBeDefined();
      expect(parsed.video).toBeDefined();
      expect(parsed.audio).toBeDefined();
    });

    it('should export current settings state', () => {
      service.updateSettings({
        general: { language: 'ja', theme: 'light' } as any,
        video: { fps: 144 } as any
      });

      const exported = service.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.general.language).toBe('ja');
      expect(parsed.general.theme).toBe('light');
      expect(parsed.video.fps).toBe(144);
    });

    it('should export formatted JSON', () => {
      const exported = service.exportSettings();

      // Should have indentation (null, 2)
      expect(exported).toContain('\n');
      expect(exported).toContain('  ');
    });
  });

  describe('Import Settings', () => {
    it('should import valid settings JSON', () => {
      const settingsToImport = {
        general: {
          language: 'pt',
          theme: 'dark',
          confirmOnExit: false,
          showConfirmationOnStreamStop: true,
          snappingEnabled: false,
          screenSnapping: true,
          sourceSnapping: true,
          centerSnapping: true,
          snapDistance: 15,
          recordWhenStreaming: false,
          keepRecordingWhenStreamStops: false,
          replayBufferWhileStreaming: false
        },
        video: {
          baseResolution: { width: 3840, height: 2160 },
          outputResolution: { width: 1920, height: 1080 },
          downscaleFilter: 'bicubic',
          fps: 60,
          fpsType: 'common',
          renderer: 'direct3d11'
        },
        audio: {
          sampleRate: 48000,
          channels: 'stereo',
          desktopAudioDevice: 'default',
          micAudioDevice: 'default'
        },
        output: {
          mode: 'simple',
          streaming: {
            videoBitrate: 8000,
            encoder: 'nvenc',
            audioTrack: 1,
            twitchVODTrack: false
          },
          recording: {
            type: 'standard',
            recordingPath: './recordings',
            generateTimestamp: true,
            format: 'mkv',
            videoEncoder: 'nvenc',
            audioEncoder: 'aac',
            videoTracks: 1,
            multitrackVideo: false
          },
          audio: {
            track1Bitrate: 160,
            track1Name: 'Track 1'
          },
          replayBuffer: {
            enabled: false,
            duration: 30,
            prefix: 'Replay',
            suffix: ''
          }
        },
        hotkeys: {},
        advanced: {
          processRenderPriority: 'normal',
          colorFormat: 'nv12',
          colorSpace: '709',
          colorRange: 'partial',
          audioMonitoringDevice: 'default',
          disableWindowsAudioDucking: true,
          automaticReconnect: true,
          reconnectDelay: 10,
          maxRetries: 20,
          networkBuffering: false,
          bindToIP: 'default',
          enableNewNetworkCode: true,
          enableLowLatencyMode: false
        }
      };

      const result = service.importSettings(JSON.stringify(settingsToImport));

      expect(result).toBe(true);

      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe('pt');
        expect(settings.video.baseResolution.width).toBe(3840);
        expect(settings.output.streaming.videoBitrate).toBe(8000);
      });
    });

    it('should return false for invalid JSON', () => {
      const result = service.importSettings('invalid json {]');

      expect(result).toBe(false);
    });

    it('should log error for invalid JSON', () => {
      const consoleError = spyOn(console, 'error');

      service.importSettings('invalid json');

      expect(consoleError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to import settings'),
        jasmine.any(Error)
      );
    });

    it('should save imported settings to localStorage', () => {
      const settingsToImport = {
        general: { language: 'ko' } as any,
        video: {} as any,
        audio: {} as any,
        output: {} as any,
        hotkeys: {},
        advanced: {} as any
      };

      service.importSettings(JSON.stringify(settingsToImport));

      const stored = localStorage.getItem('streaming-settings');
      const parsed = JSON.parse(stored!);

      expect(parsed.general.language).toBe('ko');
    });

    it('should not update settings on import failure', (done) => {
      const originalLanguage = 'en';

      service.importSettings('invalid json');

      service.settings$.subscribe(settings => {
        expect(settings.general.language).toBe(originalLanguage);
        done();
      });
    });
  });

  describe('Deep Merge', () => {
    it('should merge simple properties', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects', () => {
      const target = {
        level1: {
          a: 1,
          level2: {
            b: 2,
            c: 3
          }
        }
      };

      const source = {
        level1: {
          level2: {
            c: 4,
            d: 5
          }
        }
      };

      const result = (service as any).deepMerge(target, source);

      expect(result.level1.a).toBe(1);
      expect(result.level1.level2.b).toBe(2);
      expect(result.level1.level2.c).toBe(4);
      expect(result.level1.level2.d).toBe(5);
    });

    it('should handle arrays by replacing', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };

      const result = (service as any).deepMerge(target, source);

      expect(result.arr).toEqual([4, 5]);
    });

    it('should handle null values', () => {
      const target = { a: 'value' };
      const source = { a: null };

      const result = (service as any).deepMerge(target, source);

      expect(result.a).toBeNull();
    });

    it('should not mutate original objects', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };

      (service as any).deepMerge(target, source);

      expect(target.a).toEqual({ b: 1 });
      expect(source.a).toEqual({ c: 2 });
    });
  });

  describe('Observable Updates', () => {
    it('should emit new settings when updated', (done) => {
      let emissionCount = 0;

      service.settings$.subscribe(() => {
        emissionCount++;
      });

      // First emission is immediate
      expect(emissionCount).toBe(1);

      service.updateSettings({
        general: { language: 'test' } as any
      });

      setTimeout(() => {
        expect(emissionCount).toBe(2);
        done();
      }, 10);
    });

    it('should emit same reference when no updates', (done) => {
      let firstSettings: ApplicationSettings;

      service.settings$.subscribe(settings => {
        firstSettings = settings;
      });

      setTimeout(() => {
        service.settings$.subscribe(settings => {
          expect(settings).toBe(firstSettings);
          done();
        });
      }, 10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty update object', (done) => {
      const originalSettings = (service as any).settingsSubject.value;

      service.updateSettings({});

      service.settings$.subscribe(settings => {
        expect(settings).toEqual(originalSettings);
        done();
      });
    });

    it('should handle very deep nested updates', (done) => {
      service.updateSettings({
        output: {
          recording: {
            multitrackVideo: true
          }
        }
      } as any);

      service.settings$.subscribe(settings => {
        expect(settings.output.recording.multitrackVideo).toBe(true);
        expect(settings.output.recording.format).toBe('mp4'); // Unchanged
        expect(settings.output.mode).toBe('simple'); // Unchanged
        done();
      });
    });

    it('should handle rapid sequential updates', (done) => {
      for (let i = 0; i < 10; i++) {
        service.updateSettings({
          general: { snapDistance: i } as any
        });
      }

      service.settings$.subscribe(settings => {
        expect(settings.general.snapDistance).toBe(9);
        done();
      });
    });
  });
});
