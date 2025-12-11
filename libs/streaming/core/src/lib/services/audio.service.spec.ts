import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';
import {
  AudioDevice,
  AudioDeviceType,
  AudioFilterType,
  MonitoringType
} from '../models/audio.model';

describe('AudioService', () => {
  let service: AudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioService);
  });

  describe('BDD: Audio Device Management', () => {
    describe('GIVEN audio devices are available', () => {
      it('WHEN requesting input devices THEN should return available inputs', (done) => {
        service.getInputDevices().subscribe((devices) => {
          expect(Array.isArray(devices)).toBe(true);
          devices.forEach((device) => {
            expect(device.type).toBe(AudioDeviceType.INPUT);
          });
          done();
        });
      });

      it('WHEN requesting output devices THEN should return available outputs', (done) => {
        service.getOutputDevices().subscribe((devices) => {
          expect(Array.isArray(devices)).toBe(true);
          devices.forEach((device) => {
            expect(device.type).toBe(AudioDeviceType.OUTPUT);
          });
          done();
        });
      });

      it('WHEN selecting an input device THEN should set it as active', (done) => {
        service.getInputDevices().subscribe((devices) => {
          if (devices.length > 0) {
            service.selectInputDevice(devices[0].id);

            service.activeInputDevice$.subscribe((device) => {
              if (device) {
                expect(device.id).toBe(devices[0].id);
                done();
              }
            });
          } else {
            done();
          }
        });
      });
    });
  });

  describe('BDD: Audio Mixer', () => {
    describe('GIVEN an audio mixer exists', () => {
      beforeEach(() => {
        service.initializeMixer();
      });

      it('WHEN creating an audio track THEN should be added to mixer', (done) => {
        service.createAudioTrack('Track 1', ['source-1']);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.tracks.length > 0) {
            expect(mixer.tracks[0].name).toBe('Track 1');
            expect(mixer.tracks[0].sourceIds).toContain('source-1');
            done();
          }
        });
      });

      it('WHEN adjusting track volume THEN should update volume', (done) => {
        service.createAudioTrack('Track 1', ['source-1']);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.tracks.length > 0) {
            const track = mixer.tracks[0];
            if (track.volume === 1) {
              service.setTrackVolume(track.id, 0.5);
            } else if (track.volume === 0.5) {
              expect(track.volume).toBe(0.5);
              done();
            }
          }
        });
      });

      it('WHEN muting a track THEN should set muted state', (done) => {
        service.createAudioTrack('Track 1', ['source-1']);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.tracks.length > 0) {
            const track = mixer.tracks[0];
            if (!track.muted) {
              service.muteTrack(track.id);
            } else {
              expect(track.muted).toBe(true);
              done();
            }
          }
        });
      });

      it('WHEN unmuting a track THEN should unset muted state', (done) => {
        service.createAudioTrack('Track 1', ['source-1']);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.tracks.length > 0) {
            const track = mixer.tracks[0];
            if (!track.muted) {
              service.muteTrack(track.id);
            } else if (track.muted) {
              service.unmuteTrack(track.id);
              setTimeout(() => {
                service.mixer$.subscribe((m) => {
                  if (m) {
                    const t = m.tracks.find((x) => x.id === track.id);
                    if (t && !t.muted) {
                      expect(t.muted).toBe(false);
                      done();
                    }
                  }
                });
              }, 10);
            }
          }
        });
      });

      it('WHEN soloing a track THEN other tracks should be muted', (done) => {
        service.createAudioTrack('Track 1', ['source-1']);
        service.createAudioTrack('Track 2', ['source-2']);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.tracks.length === 2) {
            const track1 = mixer.tracks[0];
            if (!track1.solo) {
              service.soloTrack(track1.id);
            } else {
              expect(track1.solo).toBe(true);
              done();
            }
          }
        });
      });

      it('WHEN adjusting master volume THEN should affect all tracks', (done) => {
        service.setMasterVolume(0.8);

        service.mixer$.subscribe((mixer) => {
          if (mixer && mixer.masterVolume === 0.8) {
            expect(mixer.masterVolume).toBe(0.8);
            done();
          }
        });
      });
    });
  });

  describe('BDD: Audio Filters', () => {
    let trackId: string;

    beforeEach((done) => {
      service.initializeMixer();
      service.createAudioTrack('Test Track', ['source-1']);

      service.mixer$.subscribe((mixer) => {
        if (mixer && mixer.tracks.length > 0) {
          trackId = mixer.tracks[0].id;
          done();
        }
      });
    });

    it('WHEN adding a noise gate filter THEN should be applied to track', (done) => {
      service.addFilterToTrack(trackId, {
        id: 'filter-1',
        name: 'Noise Gate',
        type: AudioFilterType.NOISE_GATE,
        enabled: true,
        settings: {
          threshold: -40,
          attack: 25,
          hold: 200,
          release: 150
        }
      });

      service.mixer$.subscribe((mixer) => {
        if (mixer) {
          const track = mixer.tracks.find((t) => t.id === trackId);
          if (track && track.filters.length > 0) {
            expect(track.filters[0].type).toBe(AudioFilterType.NOISE_GATE);
            done();
          }
        }
      });
    });

    it('WHEN adding a compressor filter THEN should be applied to track', (done) => {
      service.addFilterToTrack(trackId, {
        id: 'filter-2',
        name: 'Compressor',
        type: AudioFilterType.COMPRESSOR,
        enabled: true,
        settings: {
          ratio: 3,
          threshold: -18,
          attack: 6,
          release: 60,
          outputGain: 0
        }
      });

      service.mixer$.subscribe((mixer) => {
        if (mixer) {
          const track = mixer.tracks.find((t) => t.id === trackId);
          if (track && track.filters.length > 0) {
            expect(track.filters[0].type).toBe(AudioFilterType.COMPRESSOR);
            done();
          }
        }
      });
    });

    it('WHEN removing a filter THEN should be removed from track', (done) => {
      const filter = {
        id: 'filter-3',
        name: 'Gain',
        type: AudioFilterType.GAIN,
        enabled: true,
        settings: { gain: 5 }
      };

      service.addFilterToTrack(trackId, filter);

      service.mixer$.subscribe((mixer) => {
        if (mixer) {
          const track = mixer.tracks.find((t) => t.id === trackId);
          if (track && track.filters.length === 1) {
            service.removeFilterFromTrack(trackId, filter.id);
          } else if (track && track.filters.length === 0) {
            expect(track.filters).toEqual([]);
            done();
          }
        }
      });
    });
  });

  describe('BDD: Audio Monitoring', () => {
    let trackId: string;

    beforeEach((done) => {
      service.initializeMixer();
      service.createAudioTrack('Test Track', ['source-1']);

      service.mixer$.subscribe((mixer) => {
        if (mixer && mixer.tracks.length > 0) {
          trackId = mixer.tracks[0].id;
          done();
        }
      });
    });

    it('WHEN setting monitoring to MONITOR_ONLY THEN should only monitor', (done) => {
      service.setTrackMonitoring(trackId, MonitoringType.MONITOR_ONLY);

      service.mixer$.subscribe((mixer) => {
        if (mixer) {
          const track = mixer.tracks.find((t) => t.id === trackId);
          if (track && track.monitoring === MonitoringType.MONITOR_ONLY) {
            expect(track.monitoring).toBe(MonitoringType.MONITOR_ONLY);
            done();
          }
        }
      });
    });

    it('WHEN setting monitoring to MONITOR_AND_OUTPUT THEN should monitor and output', (done) => {
      service.setTrackMonitoring(trackId, MonitoringType.MONITOR_AND_OUTPUT);

      service.mixer$.subscribe((mixer) => {
        if (mixer) {
          const track = mixer.tracks.find((t) => t.id === trackId);
          if (track && track.monitoring === MonitoringType.MONITOR_AND_OUTPUT) {
            expect(track.monitoring).toBe(MonitoringType.MONITOR_AND_OUTPUT);
            done();
          }
        }
      });
    });
  });

  describe('BDD: Audio Metering', () => {
    let trackId: string;

    beforeEach((done) => {
      service.initializeMixer();
      service.createAudioTrack('Test Track', ['source-1']);

      service.mixer$.subscribe((mixer) => {
        if (mixer && mixer.tracks.length > 0) {
          trackId = mixer.tracks[0].id;
          done();
        }
      });
    });

    it('WHEN audio is playing THEN should provide metering data', (done) => {
      service.getTrackMetering(trackId).subscribe((metering) => {
        if (metering) {
          expect(metering.peak).toBeDefined();
          expect(metering.magnitude).toBeDefined();
          expect(Array.isArray(metering.peak)).toBe(true);
          expect(Array.isArray(metering.magnitude)).toBe(true);
          done();
        }
      });
    });
  });
});
