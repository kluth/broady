import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { StreamingService } from './streaming.service';
import { StreamingPlatform, StreamingProtocol, VideoEncoder, AudioEncoder } from '../models/streaming.model';

describe('StreamingService', () => {
  let service: StreamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StreamingService]
    });
    service = TestBed.inject(StreamingService);
  });

  afterEach(() => {
    // Cleanup any running streams
    if (service.isStreaming()) {
      service.stopStreaming();
    }
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty destinations', () => {
      expect(service.destinations()).toEqual([]);
    });

    it('should initialize with isStreaming as false', () => {
      expect(service.isStreaming()).toBe(false);
    });

    it('should initialize streaming state with default values', () => {
      const state = service.streamingState();
      expect(state.isStreaming).toBe(false);
      expect(state.isRecording).toBe(false);
      expect(state.droppedFrames).toBe(0);
      expect(state.totalFrames).toBe(0);
      expect(state.fps).toBe(0);
      expect(state.bitrate).toBe(0);
      expect(state.cpuUsage).toBe(0);
      expect(state.memoryUsage).toBe(0);
    });

    it('should provide streamingState$ as alias for backwards compatibility', () => {
      expect(service.streamingState$()).toEqual(service.streamingState());
    });
  });

  describe('Destination Management', () => {
    it('should add a destination', () => {
      const destination = service.addDestination({
        name: 'Twitch Main',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://live.twitch.tv/app/',
        streamKey: 'test-key-123',
        enabled: true,
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 6000,
          audioBitrate: 160,
          resolution: { width: 1920, height: 1080 },
          fps: 60,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'high',
          tune: 'zerolatency'
        }
      });

      expect(destination.id).toBeDefined();
      expect(destination.name).toBe('Twitch Main');
      expect(service.destinations().length).toBe(1);
    });

    it('should generate unique IDs for destinations', () => {
      const dest1 = service.addDestination({
        name: 'Destination 1',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test1.com',
        streamKey: 'key1',
        enabled: true,
        settings: {} as any
      });

      const dest2 = service.addDestination({
        name: 'Destination 2',
        platform: StreamingPlatform.YOUTUBE,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test2.com',
        streamKey: 'key2',
        enabled: true,
        settings: {} as any
      });

      expect(dest1.id).not.toBe(dest2.id);
    });

    it('should remove a destination', () => {
      const dest = service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      expect(service.destinations().length).toBe(1);

      service.removeDestination(dest.id);

      expect(service.destinations().length).toBe(0);
    });

    it('should not error when removing non-existent destination', () => {
      expect(() => service.removeDestination('non-existent-id')).not.toThrow();
    });

    it('should update a destination', () => {
      const dest = service.addDestination({
        name: 'Original Name',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      service.updateDestination(dest.id, {
        name: 'Updated Name',
        url: 'rtmp://updated.com'
      });

      const updated = service.destinations()[0];
      expect(updated.name).toBe('Updated Name');
      expect(updated.url).toBe('rtmp://updated.com');
      expect(updated.platform).toBe(StreamingPlatform.TWITCH); // Unchanged
    });

    it('should toggle destination enabled state', () => {
      const dest = service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      service.toggleDestination(dest.id, false);
      expect(service.destinations()[0].enabled).toBe(false);

      service.toggleDestination(dest.id, true);
      expect(service.destinations()[0].enabled).toBe(true);
    });

    it('should filter enabled destinations', () => {
      service.addDestination({
        name: 'Enabled 1',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test1.com',
        streamKey: 'key1',
        enabled: true,
        settings: {} as any
      });

      service.addDestination({
        name: 'Disabled',
        platform: StreamingPlatform.YOUTUBE,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test2.com',
        streamKey: 'key2',
        enabled: false,
        settings: {} as any
      });

      service.addDestination({
        name: 'Enabled 2',
        platform: StreamingPlatform.FACEBOOK,
        protocol: StreamingProtocol.RTMPS,
        url: 'rtmps://test3.com',
        streamKey: 'key3',
        enabled: true,
        settings: {} as any
      });

      const enabled = service.enabledDestinations();
      expect(enabled.length).toBe(2);
      expect(enabled[0].name).toBe('Enabled 1');
      expect(enabled[1].name).toBe('Enabled 2');
    });
  });

  describe('Streaming', () => {
    it('should throw error when starting stream with no enabled destinations', async () => {
      await expectAsync(service.startStreaming()).toBeRejectedWithError('No streaming destinations enabled');
    });

    it('should start streaming with enabled destinations', fakeAsync(async () => {
      service.addDestination({
        name: 'Test Destination',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      await service.startStreaming();
      tick(1000);

      expect(service.isStreaming()).toBe(true);
      expect(service.streamingState().isStreaming).toBe(true);
      expect(service.streamingState().streamStartTime).toBeDefined();
    }));

    it('should stop streaming', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      await service.startStreaming();
      tick(1000);
      expect(service.isStreaming()).toBe(true);

      await service.stopStreaming();

      expect(service.isStreaming()).toBe(false);
      expect(service.streamingState().isStreaming).toBe(false);
    }));

    it('should collect streaming statistics', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      await service.startStreaming();
      tick(1000);

      // Wait for stats collection
      tick(2000);

      const state = service.streamingState();
      expect(state.totalFrames).toBeGreaterThan(0);
      expect(state.fps).toBeGreaterThan(0);
      expect(state.bitrate).toBeGreaterThan(0);
      expect(state.cpuUsage).toBeGreaterThan(0);
      expect(state.memoryUsage).toBeGreaterThan(0);

      await service.stopStreaming();
      flush();
    }));

    it('should calculate uptime correctly', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      expect(service.getUptime()).toBe(0);

      await service.startStreaming();
      tick(1000);
      tick(5000); // 5 seconds

      const uptime = service.getUptime();
      expect(uptime).toBeGreaterThanOrEqual(5);
      expect(uptime).toBeLessThan(7); // Allow for timing variance

      await service.stopStreaming();
      flush();
    }));

    it('should return 0 uptime when not streaming', () => {
      expect(service.getUptime()).toBe(0);
    });

    it('should calculate drop percentage correctly', fakeAsync(() => {
      // Initially should be 0
      expect(service.getDropPercentage()).toBe(0);

      // Manually update state to test calculation
      const state = service.streamingState();
      (service as any).streamingStateSignal.set({
        ...state,
        totalFrames: 1000,
        droppedFrames: 50
      });

      expect(service.getDropPercentage()).toBe(5);
    }));

    it('should handle drop percentage with 0 total frames', () => {
      const state = service.streamingState();
      (service as any).streamingStateSignal.set({
        ...state,
        totalFrames: 0,
        droppedFrames: 0
      });

      expect(service.getDropPercentage()).toBe(0);
    });

    it('should stream to multiple destinations', fakeAsync(async () => {
      service.addDestination({
        name: 'Twitch',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://twitch.tv',
        streamKey: 'key1',
        enabled: true,
        settings: {} as any
      });

      service.addDestination({
        name: 'YouTube',
        platform: StreamingPlatform.YOUTUBE,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://youtube.com',
        streamKey: 'key2',
        enabled: true,
        settings: {} as any
      });

      const consoleLog = spyOn(console, 'log');
      await service.startStreaming();
      tick(2000);

      expect(consoleLog).toHaveBeenCalledWith(jasmine.stringContaining('Started streaming to 2 destination(s)'));

      await service.stopStreaming();
      flush();
    }));
  });

  describe('Platform Presets', () => {
    it('should create Twitch preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.TWITCH);

      expect(preset.platform).toBe(StreamingPlatform.TWITCH);
      expect(preset.protocol).toBe(StreamingProtocol.RTMP);
      expect(preset.url).toBe('rtmp://live.twitch.tv/app/');
      expect(preset.settings?.videoEncoder).toBe(VideoEncoder.X264);
      expect(preset.settings?.videoBitrate).toBe(6000);
      expect(preset.settings?.fps).toBe(60);
    });

    it('should create YouTube preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.YOUTUBE);

      expect(preset.platform).toBe(StreamingPlatform.YOUTUBE);
      expect(preset.protocol).toBe(StreamingProtocol.RTMP);
      expect(preset.url).toBe('rtmp://a.rtmp.youtube.com/live2/');
      expect(preset.settings?.videoBitrate).toBe(9000);
      expect(preset.settings?.fps).toBe(60);
    });

    it('should create Facebook preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.FACEBOOK);

      expect(preset.platform).toBe(StreamingPlatform.FACEBOOK);
      expect(preset.protocol).toBe(StreamingProtocol.RTMPS);
      expect(preset.url).toBe('rtmps://live-api-s.facebook.com:443/rtmp/');
      expect(preset.settings?.resolution).toEqual({ width: 1280, height: 720 });
      expect(preset.settings?.fps).toBe(30);
    });

    it('should create TikTok preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.TIKTOK);

      expect(preset.platform).toBe(StreamingPlatform.TIKTOK);
      expect(preset.settings?.resolution).toEqual({ width: 1080, height: 1920 }); // Vertical
    });

    it('should create Twitter preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.TWITTER);

      expect(preset.platform).toBe(StreamingPlatform.TWITTER);
      expect(preset.settings?.videoBitrate).toBe(2500);
    });

    it('should create LinkedIn preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.LINKEDIN);

      expect(preset.platform).toBe(StreamingPlatform.LINKEDIN);
      expect(preset.settings?.videoBitrate).toBe(3000);
    });

    it('should create custom preset', () => {
      const preset = service.createPresetForPlatform(StreamingPlatform.CUSTOM);

      expect(preset.platform).toBe(StreamingPlatform.CUSTOM);
      expect(preset.url).toBe('');
    });

    it('should have all presets with AAC audio encoder', () => {
      const platforms = [
        StreamingPlatform.TWITCH,
        StreamingPlatform.YOUTUBE,
        StreamingPlatform.FACEBOOK,
        StreamingPlatform.TIKTOK,
        StreamingPlatform.TWITTER,
        StreamingPlatform.LINKEDIN,
        StreamingPlatform.CUSTOM
      ];

      platforms.forEach(platform => {
        const preset = service.createPresetForPlatform(platform);
        expect(preset.settings?.audioEncoder).toBe(AudioEncoder.AAC);
      });
    });

    it('should have all presets with x264 video encoder', () => {
      const platforms = [
        StreamingPlatform.TWITCH,
        StreamingPlatform.YOUTUBE,
        StreamingPlatform.FACEBOOK,
        StreamingPlatform.TIKTOK,
        StreamingPlatform.TWITTER,
        StreamingPlatform.LINKEDIN,
        StreamingPlatform.CUSTOM
      ];

      platforms.forEach(platform => {
        const preset = service.createPresetForPlatform(platform);
        expect(preset.settings?.videoEncoder).toBe(VideoEncoder.X264);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating non-existent destination', () => {
      service.updateDestination('non-existent', { name: 'Updated' });
      expect(service.destinations().length).toBe(0);
    });

    it('should handle toggling non-existent destination', () => {
      expect(() => service.toggleDestination('non-existent', true)).not.toThrow();
    });

    it('should handle multiple start/stop cycles', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      for (let i = 0; i < 3; i++) {
        await service.startStreaming();
        tick(1000);
        expect(service.isStreaming()).toBe(true);

        await service.stopStreaming();
        expect(service.isStreaming()).toBe(false);
      }

      flush();
    }));

    it('should cleanup intervals on service destroy', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      await service.startStreaming();
      tick(1000);

      // Trigger cleanup
      TestBed.resetTestingModule();

      // Should not throw
      flush();
    }));
  });

  describe('Signal Reactivity', () => {
    it('should update enabledDestinations when destinations change', () => {
      const dest1 = service.addDestination({
        name: 'Test 1',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      expect(service.enabledDestinations().length).toBe(1);

      service.toggleDestination(dest1.id, false);
      expect(service.enabledDestinations().length).toBe(0);

      service.toggleDestination(dest1.id, true);
      expect(service.enabledDestinations().length).toBe(1);
    });

    it('should update isStreaming computed signal', fakeAsync(async () => {
      service.addDestination({
        name: 'Test',
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://test.com',
        streamKey: 'key',
        enabled: true,
        settings: {} as any
      });

      expect(service.isStreaming()).toBe(false);

      await service.startStreaming();
      tick(1000);
      expect(service.isStreaming()).toBe(true);

      await service.stopStreaming();
      expect(service.isStreaming()).toBe(false);

      flush();
    }));
  });
});
