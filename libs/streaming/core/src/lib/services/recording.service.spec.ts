import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { RecordingService } from './recording.service';
import { RecordingFormat, VideoEncoder, AudioEncoder } from '../models/streaming.model';

describe('RecordingService', () => {
  let service: RecordingService;
  let mockMediaRecorder: jasmine.SpyObj<MediaRecorder>;
  let mockMediaStream: jasmine.SpyObj<MediaStream>;

  beforeEach(() => {
    // Mock MediaStream
    mockMediaStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getTracks']);
    mockMediaStream.getTracks.and.returnValue([
      jasmine.createSpyObj('MediaStreamTrack', ['stop'])
    ] as any);

    // Mock MediaRecorder
    mockMediaRecorder = jasmine.createSpyObj<MediaRecorder>('MediaRecorder', [
      'start',
      'stop',
      'pause',
      'resume'
    ]);
    Object.defineProperty(mockMediaRecorder, 'state', {
      value: 'inactive',
      writable: true
    });

    // Spy on MediaRecorder.isTypeSupported
    spyOn(MediaRecorder, 'isTypeSupported').and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [RecordingService]
    });
    service = TestBed.inject(RecordingService);
  });

  afterEach(() => {
    if (service.isRecording()) {
      service.stopRecording().catch(() => {});
    }
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with isRecording as false', () => {
      expect(service.isRecording()).toBe(false);
    });

    it('should initialize with isPaused as false', () => {
      expect(service.isPaused()).toBe(false);
    });

    it('should initialize with default recording settings', () => {
      const settings = service.recordingSettings();

      expect(settings.format).toBe(RecordingFormat.MP4);
      expect(settings.path).toBe('./recordings');
      expect(settings.videoEncoder).toBe(VideoEncoder.X264);
      expect(settings.audioEncoder).toBe(AudioEncoder.AAC);
      expect(settings.videoBitrate).toBe(40000);
      expect(settings.audioBitrate).toBe(160);
      expect(settings.resolution).toEqual({ width: 1920, height: 1080 });
      expect(settings.fps).toBe(60);
      expect(settings.multitrack).toBe(false);
    });

    it('should provide isRecording$ as alias for backwards compatibility', () => {
      expect(service.isRecording$()).toBe(service.isRecording());
    });

    it('should initialize replayBuffer as disabled', () => {
      const replayBuffer = service.replayBuffer();
      expect(replayBuffer.enabled).toBe(false);
      expect(replayBuffer.duration).toBe(30);
    });

    it('should initialize currentRecordingPath as null', () => {
      expect(service.currentRecordingPath()).toBeNull();
    });

    it('should initialize recordingStartTime as null', () => {
      expect(service.recordingStartTime()).toBeNull();
    });
  });

  describe('Recording Settings', () => {
    it('should update recording settings', () => {
      service.updateSettings({
        format: RecordingFormat.MKV,
        videoBitrate: 50000,
        fps: 30
      });

      const settings = service.recordingSettings();
      expect(settings.format).toBe(RecordingFormat.MKV);
      expect(settings.videoBitrate).toBe(50000);
      expect(settings.fps).toBe(30);
      // Other settings remain unchanged
      expect(settings.audioEncoder).toBe(AudioEncoder.AAC);
    });

    it('should update only specified settings', () => {
      const originalSettings = service.recordingSettings();

      service.updateSettings({ fps: 120 });

      const updatedSettings = service.recordingSettings();
      expect(updatedSettings.fps).toBe(120);
      expect(updatedSettings.format).toBe(originalSettings.format);
      expect(updatedSettings.videoBitrate).toBe(originalSettings.videoBitrate);
    });

    it('should handle empty updates', () => {
      const originalSettings = service.recordingSettings();

      service.updateSettings({});

      expect(service.recordingSettings()).toEqual(originalSettings);
    });
  });

  describe('Recording Duration', () => {
    it('should compute recording duration as 0 when not recording', () => {
      expect(service.recordingDuration()).toBe(0);
    });

    it('should format duration correctly', () => {
      // Test 0 seconds
      expect(service.formattedDuration()).toBe('00:00:00');
    });

    it('should format duration with hours, minutes, and seconds', fakeAsync(() => {
      // Mock start time to 1 hour, 23 minutes, and 45 seconds ago
      const startTime = new Date(Date.now() - (1 * 3600 + 23 * 60 + 45) * 1000);
      (service as any).recordingStartTimeSignal.set(startTime);

      tick(0);

      const formatted = service.formattedDuration();
      expect(formatted).toMatch(/01:23:4[56]/); // Allow for timing variance
    }));

    it('should pad single digits with zeros', fakeAsync(() => {
      // Mock start time to 5 seconds ago
      const startTime = new Date(Date.now() - 5000);
      (service as any).recordingStartTimeSignal.set(startTime);

      tick(0);

      const formatted = service.formattedDuration();
      expect(formatted).toMatch(/00:00:0[456]/); // Allow for timing variance
    }));
  });

  describe('Start Recording', () => {
    it('should throw error when already recording', async () => {
      spyOn<any>(service, 'getDisplayMedia').and.returnValue(Promise.resolve(mockMediaStream));
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);

      await expectAsync(service.startRecording(mockMediaStream))
        .toBeRejectedWithError('Already recording');

      await service.stopRecording();
    });

    it('should start recording with provided stream', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      const path = await service.startRecording(mockMediaStream);

      expect(service.isRecording()).toBe(true);
      expect(path).toContain('./recordings/recording-');
      expect(path).toContain('.mp4');
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    it('should request display media when no stream provided', async () => {
      const getDisplayMediaSpy = spyOn<any>(service, 'getDisplayMedia')
        .and.returnValue(Promise.resolve(mockMediaStream));
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording();

      expect(getDisplayMediaSpy).toHaveBeenCalled();
      expect(service.isRecording()).toBe(true);

      await service.stopRecording();
    });

    it('should generate filename from template', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      service.updateSettings({
        filename: 'test-%YYYY%-%MM%-%DD%-recording'
      });

      const path = await service.startRecording(mockMediaStream);

      expect(path).toMatch(/test-\d{4}-\d{2}-\d{2}-recording\.mp4/);

      await service.stopRecording();
    });

    it('should set recording start time', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      const beforeStart = new Date();
      await service.startRecording(mockMediaStream);
      const afterStart = new Date();

      const startTime = service.recordingStartTime();
      expect(startTime).not.toBeNull();
      expect(startTime!.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
      expect(startTime!.getTime()).toBeLessThanOrEqual(afterStart.getTime());

      await service.stopRecording();
    });

    it('should use correct MIME type based on format', async () => {
      const mediaRecorderSpy = spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      service.updateSettings({ format: RecordingFormat.MP4 });
      await service.startRecording(mockMediaStream);

      expect(mediaRecorderSpy).toHaveBeenCalledWith(
        mockMediaStream,
        jasmine.objectContaining({ mimeType: 'video/mp4' })
      );

      await service.stopRecording();
    });
  });

  describe('Stop Recording', () => {
    it('should throw error when not recording', async () => {
      await expectAsync(service.stopRecording())
        .toBeRejectedWithError('Not currently recording');
    });

    it('should stop recording', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);
      expect(service.isRecording()).toBe(true);

      await service.stopRecording();

      expect(service.isRecording()).toBe(false);
      expect(service.isPaused()).toBe(false);
      expect(service.recordingStartTime()).toBeNull();
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it('should return recording path', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      const startPath = await service.startRecording(mockMediaStream);
      const stopPath = await service.stopRecording();

      expect(stopPath).toBe(startPath);
    });

    it('should handle MediaRecorder already inactive', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);
      Object.defineProperty(mockMediaRecorder, 'state', { value: 'inactive' });

      await service.startRecording(mockMediaStream);
      await service.stopRecording();

      // Should not throw
      expect(service.isRecording()).toBe(false);
    });
  });

  describe('Pause and Resume', () => {
    it('should pause recording', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);
      Object.defineProperty(mockMediaRecorder, 'state', { value: 'recording', writable: true });

      await service.startRecording(mockMediaStream);

      service.pauseRecording();

      expect(mockMediaRecorder.pause).toHaveBeenCalled();
      expect(service.isPaused()).toBe(true);

      await service.stopRecording();
    });

    it('should throw error when pausing while not recording', () => {
      expect(() => service.pauseRecording())
        .toThrowError('Not currently recording');
    });

    it('should resume recording', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);
      Object.defineProperty(mockMediaRecorder, 'state', { value: 'paused', writable: true });

      await service.startRecording(mockMediaStream);
      (service as any).isPausedSignal.set(true);

      service.resumeRecording();

      expect(mockMediaRecorder.resume).toHaveBeenCalled();
      expect(service.isPaused()).toBe(false);

      await service.stopRecording();
    });

    it('should throw error when resuming while not recording', () => {
      expect(() => service.resumeRecording())
        .toThrowError('Not currently recording');
    });
  });

  describe('Replay Buffer', () => {
    it('should enable replay buffer', () => {
      service.enableReplayBuffer(60);

      const buffer = service.replayBuffer();
      expect(buffer.enabled).toBe(true);
      expect(buffer.duration).toBe(60);
    });

    it('should disable replay buffer', () => {
      service.enableReplayBuffer(30);
      expect(service.replayBuffer().enabled).toBe(true);

      service.disableReplayBuffer();

      expect(service.replayBuffer().enabled).toBe(false);
      expect(service.replayBuffer().duration).toBe(0);
    });

    it('should throw error when saving empty replay buffer', async () => {
      service.enableReplayBuffer(30);

      await expectAsync(service.saveReplayBuffer())
        .toBeRejectedWithError('Replay buffer is empty');
    });

    it('should throw error when saving with replay buffer disabled', async () => {
      await expectAsync(service.saveReplayBuffer())
        .toBeRejectedWithError('Replay buffer is not enabled');
    });

    it('should save replay buffer', async () => {
      service.enableReplayBuffer(30);

      // Mock replay buffer data
      const mockBlob = new Blob(['test data'], { type: 'video/mp4' });
      (service as any).replayBufferData = [mockBlob];

      const downloadSpy = spyOn<any>(service, 'downloadRecording').and.returnValue(Promise.resolve());

      const path = await service.saveReplayBuffer();

      expect(path).toContain('replay-');
      expect(downloadSpy).toHaveBeenCalled();
    });

    it('should cleanup buffer interval on disable', fakeAsync(() => {
      service.enableReplayBuffer(30);

      // Verify interval was set
      expect((service as any).replayBufferInterval).not.toBeNull();

      service.disableReplayBuffer();

      expect((service as any).replayBufferInterval).toBeNull();

      flush();
    }));
  });

  describe('Split Recording', () => {
    it('should throw error when not recording', async () => {
      await expectAsync(service.splitRecording())
        .toThrowError('Not currently recording');
    });

    it('should split recording by stopping and starting new one', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);
      const firstPath = service.currentRecordingPath();

      await service.splitRecording();

      const secondPath = service.currentRecordingPath();
      expect(firstPath).not.toBe(secondPath);
      expect(service.isRecording()).toBe(true);

      await service.stopRecording();
    });
  });

  describe('Filename Generation', () => {
    it('should replace year placeholder', () => {
      const filename = (service as any).generateFilename('recording-%YYYY%');
      const currentYear = new Date().getFullYear();
      expect(filename).toContain(currentYear.toString());
    });

    it('should replace all date placeholders', () => {
      const filename = (service as any).generateFilename('rec-%YYYY%-%MM%-%DD%-%hh%-%mm%-%ss%');

      expect(filename).toMatch(/rec-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
    });

    it('should pad month and day with zeros', () => {
      const filename = (service as any).generateFilename('%MM%-%DD%');

      // Should always be 2 digits
      expect(filename).toMatch(/\d{2}-\d{2}/);
    });

    it('should handle templates without placeholders', () => {
      const filename = (service as any).generateFilename('simple-recording');
      expect(filename).toBe('simple-recording');
    });
  });

  describe('MIME Type Selection', () => {
    it('should return MP4 MIME type when supported', () => {
      (MediaRecorder.isTypeSupported as jasmine.Spy).and.returnValue(true);

      const mimeType = (service as any).getMimeType(RecordingFormat.MP4);
      expect(mimeType).toBe('video/mp4');
    });

    it('should return MKV MIME type when supported', () => {
      (MediaRecorder.isTypeSupported as jasmine.Spy).and.returnValue(true);

      const mimeType = (service as any).getMimeType(RecordingFormat.MKV);
      expect(mimeType).toBe('video/x-matroska');
    });

    it('should fallback to WebM VP9 when format not supported', () => {
      (MediaRecorder.isTypeSupported as jasmine.Spy).and.callFake((type: string) => {
        return type.includes('webm') && type.includes('vp9');
      });

      const mimeType = (service as any).getMimeType(RecordingFormat.MP4);
      expect(mimeType).toBe('video/webm;codecs=vp9');
    });

    it('should fallback to WebM VP8 when VP9 not supported', () => {
      (MediaRecorder.isTypeSupported as jasmine.Spy).and.callFake((type: string) => {
        return type.includes('webm') && type.includes('vp8');
      });

      const mimeType = (service as any).getMimeType(RecordingFormat.MP4);
      expect(mimeType).toBe('video/webm;codecs=vp8');
    });

    it('should fallback to generic WebM when nothing else supported', () => {
      (MediaRecorder.isTypeSupported as jasmine.Spy).and.returnValue(false);

      const mimeType = (service as any).getMimeType(RecordingFormat.MP4);
      expect(mimeType).toBe('video/webm');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on service destroy', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);

      // Trigger cleanup
      (service as any).cleanup();

      expect(mockMediaStream.getTracks).toHaveBeenCalled();
    });

    it('should stop media stream tracks on cleanup', async () => {
      const trackStopSpy = jasmine.createSpy('stop');
      const mockTrack = { stop: trackStopSpy };
      mockMediaStream.getTracks.and.returnValue([mockTrack] as any);

      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);
      (service as any).cleanup();

      expect(trackStopSpy).toHaveBeenCalled();
    });

    it('should cleanup replay buffer interval', () => {
      service.enableReplayBuffer(30);

      (service as any).cleanup();

      expect((service as any).replayBufferInterval).toBeNull();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update recordingDuration based on start time', fakeAsync(() => {
      const startTime = new Date(Date.now() - 10000); // 10 seconds ago
      (service as any).recordingStartTimeSignal.set(startTime);

      tick(0);

      const duration = service.recordingDuration();
      expect(duration).toBeGreaterThanOrEqual(9);
      expect(duration).toBeLessThanOrEqual(11);
    }));

    it('should update formattedDuration reactively', fakeAsync(() => {
      const startTime = new Date(Date.now() - 125000); // 2 minutes 5 seconds ago
      (service as any).recordingStartTimeSignal.set(startTime);

      tick(0);

      const formatted = service.formattedDuration();
      expect(formatted).toMatch(/00:02:0[456]/); // Allow for timing variance
    }));
  });

  describe('Edge Cases', () => {
    it('should handle multiple pause/resume cycles', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      await service.startRecording(mockMediaStream);

      for (let i = 0; i < 3; i++) {
        Object.defineProperty(mockMediaRecorder, 'state', { value: 'recording', writable: true });
        service.pauseRecording();
        expect(service.isPaused()).toBe(true);

        Object.defineProperty(mockMediaRecorder, 'state', { value: 'paused', writable: true });
        service.resumeRecording();
        expect(service.isPaused()).toBe(false);
      }

      await service.stopRecording();
    });

    it('should handle recording with different formats', async () => {
      spyOn(window, 'MediaRecorder').and.returnValue(mockMediaRecorder as any);

      const formats = [
        RecordingFormat.MP4,
        RecordingFormat.MKV,
        RecordingFormat.FLV,
        RecordingFormat.MOV,
        RecordingFormat.TS
      ];

      for (const format of formats) {
        service.updateSettings({ format });

        await service.startRecording(mockMediaStream);
        const path = service.currentRecordingPath();
        expect(path).toContain(`.${format}`);

        await service.stopRecording();
      }
    });
  });
});
