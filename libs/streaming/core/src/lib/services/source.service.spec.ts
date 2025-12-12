import { TestBed } from '@angular/core/testing';
import { SourceService } from './source.service';
import { SourceType } from '../models/source.model';

describe('SourceService', () => {
  let service: SourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SourceService]
    });
    service = TestBed.inject(SourceService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty sources', () => {
      expect(service.sources()).toEqual([]);
    });
  });

  describe('Create Source', () => {
    it('should create a display capture source', () => {
      const source = service.createSource('Screen Capture', SourceType.DISPLAY_CAPTURE, {
        monitor: 0
      });

      expect(source.id).toBeDefined();
      expect(source.name).toBe('Screen Capture');
      expect(source.type).toBe(SourceType.DISPLAY_CAPTURE);
      expect(source.enabled).toBe(true);
      expect(source.visible).toBe(true);
      expect(source.locked).toBe(false);
      expect(source.muted).toBe(false);
      expect(source.volume).toBe(1.0);
      expect(source.filters).toEqual([]);
    });

    it('should create a camera source', () => {
      const source = service.createSource('Webcam', SourceType.VIDEO_CAPTURE, {
        deviceId: 'camera-123'
      });

      expect(source.type).toBe(SourceType.VIDEO_CAPTURE);
      expect(source.settings.deviceId).toBe('camera-123');
    });

    it('should create an image source', () => {
      const source = service.createSource('Logo', SourceType.IMAGE, {
        file: '/path/to/logo.png'
      });

      expect(source.type).toBe(SourceType.IMAGE);
      expect(source.settings.file).toBe('/path/to/logo.png');
    });

    it('should create a text source', () => {
      const source = service.createSource('Title', SourceType.TEXT, {
        text: 'Stream Title',
        font: 'Arial',
        size: 48
      });

      expect(source.type).toBe(SourceType.TEXT);
      expect(source.settings.text).toBe('Stream Title');
    });

    it('should create a browser source', () => {
      const source = service.createSource('Chat Overlay', SourceType.BROWSER_SOURCE, {
        url: 'https://example.com/chat'
      });

      expect(source.type).toBe(SourceType.BROWSER_SOURCE);
      expect(source.settings.url).toBe('https://example.com/chat');
    });

    it('should create a media source', () => {
      const source = service.createSource('Intro Video', SourceType.MEDIA_SOURCE, {
        file: '/path/to/intro.mp4',
        loop: true
      });

      expect(source.type).toBe(SourceType.MEDIA_SOURCE);
      expect(source.settings.loop).toBe(true);
    });

    it('should create a color source', () => {
      const source = service.createSource('Background', SourceType.COLOR_SOURCE, {
        color: '#00FF00'
      });

      expect(source.type).toBe(SourceType.COLOR_SOURCE);
      expect(source.settings.color).toBe('#00FF00');
    });

    it('should generate unique IDs for each source', () => {
      const source1 = service.createSource('Source 1', SourceType.IMAGE);
      const source2 = service.createSource('Source 2', SourceType.IMAGE);
      const source3 = service.createSource('Source 3', SourceType.IMAGE);

      expect(source1.id).not.toBe(source2.id);
      expect(source2.id).not.toBe(source3.id);
      expect(source1.id).not.toBe(source3.id);
    });

    it('should add source to sources list', () => {
      expect(service.sources().length).toBe(0);

      service.createSource('Test Source', SourceType.IMAGE);

      expect(service.sources().length).toBe(1);
    });

    it('should initialize with default transform', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      expect(source.transform).toEqual({
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
        alignment: 5,
        boundsType: 'none',
        boundsAlignment: 0,
        bounds: { x: 1920, y: 1080 }
      });
    });
  });

  describe('Delete Source', () => {
    it('should delete a source by ID', () => {
      const source = service.createSource('To Delete', SourceType.IMAGE);
      expect(service.sources().length).toBe(1);

      service.deleteSource(source.id);

      expect(service.sources().length).toBe(0);
    });

    it('should not error when deleting non-existent source', () => {
      expect(() => service.deleteSource('non-existent-id')).not.toThrow();
    });

    it('should only delete the specified source', () => {
      const source1 = service.createSource('Source 1', SourceType.IMAGE);
      const source2 = service.createSource('Source 2', SourceType.IMAGE);
      const source3 = service.createSource('Source 3', SourceType.IMAGE);

      service.deleteSource(source2.id);

      const remaining = service.sources();
      expect(remaining.length).toBe(2);
      expect(remaining.find(s => s.id === source1.id)).toBeTruthy();
      expect(remaining.find(s => s.id === source3.id)).toBeTruthy();
      expect(remaining.find(s => s.id === source2.id)).toBeFalsy();
    });
  });

  describe('Get Source', () => {
    it('should get source by ID', () => {
      const created = service.createSource('Find Me', SourceType.IMAGE);

      const found = service.getSource(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Find Me');
    });

    it('should return null for non-existent source', () => {
      const found = service.getSource('non-existent-id');
      expect(found).toBeNull();
    });

    it('should return null when no sources exist', () => {
      const found = service.getSource('any-id');
      expect(found).toBeNull();
    });
  });

  describe('Update Source Settings', () => {
    it('should update source settings', () => {
      const source = service.createSource('Image', SourceType.IMAGE, {
        file: '/old/path.png'
      });

      service.updateSourceSettings(source.id, {
        file: '/new/path.png',
        width: 1920,
        height: 1080
      });

      const updated = service.getSource(source.id);
      expect(updated?.settings.file).toBe('/new/path.png');
      expect(updated?.settings.width).toBe(1920);
      expect(updated?.settings.height).toBe(1080);
    });

    it('should not affect other sources', () => {
      const source1 = service.createSource('Source 1', SourceType.IMAGE, { file: 'a.png' });
      const source2 = service.createSource('Source 2', SourceType.IMAGE, { file: 'b.png' });

      service.updateSourceSettings(source1.id, { file: 'c.png' });

      expect(service.getSource(source1.id)?.settings.file).toBe('c.png');
      expect(service.getSource(source2.id)?.settings.file).toBe('b.png');
    });
  });

  describe('Update Source Transform', () => {
    it('should update position', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSourceTransform(source.id, {
        position: { x: 100, y: 200 }
      });

      const updated = service.getSource(source.id);
      expect(updated?.transform.position).toEqual({ x: 100, y: 200 });
    });

    it('should update scale', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSourceTransform(source.id, {
        scale: { x: 2.0, y: 1.5 }
      });

      const updated = service.getSource(source.id);
      expect(updated?.transform.scale).toEqual({ x: 2.0, y: 1.5 });
    });

    it('should update rotation', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSourceTransform(source.id, {
        rotation: 45
      });

      const updated = service.getSource(source.id);
      expect(updated?.transform.rotation).toBe(45);
    });

    it('should update crop', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSourceTransform(source.id, {
        crop: { top: 10, bottom: 10, left: 5, right: 5 }
      });

      const updated = service.getSource(source.id);
      expect(updated?.transform.crop).toEqual({ top: 10, bottom: 10, left: 5, right: 5 });
    });

    it('should merge transform updates with existing values', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSourceTransform(source.id, {
        position: { x: 100, y: 200 }
      });

      service.updateSourceTransform(source.id, {
        rotation: 90
      });

      const updated = service.getSource(source.id);
      expect(updated?.transform.position).toEqual({ x: 100, y: 200 });
      expect(updated?.transform.rotation).toBe(90);
      expect(updated?.transform.scale).toEqual({ x: 1, y: 1 }); // Unchanged
    });
  });

  describe('Filters', () => {
    it('should add a filter to source', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      const filter = {
        id: 'filter-1',
        type: 'color-correction',
        enabled: true,
        settings: {
          brightness: 0.2,
          contrast: 1.1
        }
      };

      service.addFilter(source.id, filter);

      const updated = service.getSource(source.id);
      expect(updated?.filters.length).toBe(1);
      expect(updated?.filters[0]).toEqual(filter);
    });

    it('should add multiple filters', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.addFilter(source.id, {
        id: 'filter-1',
        type: 'color',
        enabled: true,
        settings: {}
      });

      service.addFilter(source.id, {
        id: 'filter-2',
        type: 'sharpen',
        enabled: true,
        settings: {}
      });

      const updated = service.getSource(source.id);
      expect(updated?.filters.length).toBe(2);
    });

    it('should remove a filter from source', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.addFilter(source.id, {
        id: 'filter-1',
        type: 'color',
        enabled: true,
        settings: {}
      });

      service.addFilter(source.id, {
        id: 'filter-2',
        type: 'sharpen',
        enabled: true,
        settings: {}
      });

      service.removeFilter(source.id, 'filter-1');

      const updated = service.getSource(source.id);
      expect(updated?.filters.length).toBe(1);
      expect(updated?.filters[0].id).toBe('filter-2');
    });

    it('should not error when removing non-existent filter', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      expect(() => service.removeFilter(source.id, 'non-existent')).not.toThrow();
    });

    it('should update filter settings', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.addFilter(source.id, {
        id: 'filter-1',
        type: 'color',
        enabled: true,
        settings: { brightness: 0 }
      });

      service.updateFilter(source.id, 'filter-1', {
        settings: { brightness: 0.5, contrast: 1.2 },
        enabled: false
      });

      const updated = service.getSource(source.id);
      expect(updated?.filters[0].settings.brightness).toBe(0.5);
      expect(updated?.filters[0].settings.contrast).toBe(1.2);
      expect(updated?.filters[0].enabled).toBe(false);
    });

    it('should only update specified filter', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.addFilter(source.id, {
        id: 'filter-1',
        type: 'color',
        enabled: true,
        settings: { value: 1 }
      });

      service.addFilter(source.id, {
        id: 'filter-2',
        type: 'sharpen',
        enabled: true,
        settings: { value: 2 }
      });

      service.updateFilter(source.id, 'filter-1', {
        settings: { value: 10 }
      });

      const updated = service.getSource(source.id);
      expect(updated?.filters[0].settings.value).toBe(10);
      expect(updated?.filters[1].settings.value).toBe(2);
    });
  });

  describe('Visibility', () => {
    it('should toggle visibility from true to false', () => {
      const source = service.createSource('Test', SourceType.IMAGE);
      expect(source.visible).toBe(true);

      service.toggleVisibility(source.id);

      expect(service.getSource(source.id)?.visible).toBe(false);
    });

    it('should toggle visibility from false to true', () => {
      const source = service.createSource('Test', SourceType.IMAGE);
      service.updateSource(source.id, { visible: false });

      service.toggleVisibility(source.id);

      expect(service.getSource(source.id)?.visible).toBe(true);
    });

    it('should handle toggling non-existent source', () => {
      expect(() => service.toggleVisibility('non-existent')).not.toThrow();
    });
  });

  describe('Volume', () => {
    it('should set volume', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);

      service.setVolume(source.id, 0.5);

      expect(service.getSource(source.id)?.volume).toBe(0.5);
    });

    it('should clamp volume to maximum of 1.0', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);

      service.setVolume(source.id, 2.0);

      expect(service.getSource(source.id)?.volume).toBe(1.0);
    });

    it('should clamp volume to minimum of 0.0', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);

      service.setVolume(source.id, -0.5);

      expect(service.getSource(source.id)?.volume).toBe(0.0);
    });

    it('should allow volume of exactly 0', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);

      service.setVolume(source.id, 0);

      expect(service.getSource(source.id)?.volume).toBe(0);
    });

    it('should allow volume of exactly 1', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);

      service.setVolume(source.id, 1);

      expect(service.getSource(source.id)?.volume).toBe(1);
    });
  });

  describe('Mute', () => {
    it('should mute source', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);
      expect(source.muted).toBe(false);

      service.mute(source.id);

      expect(service.getSource(source.id)?.muted).toBe(true);
    });

    it('should unmute source', () => {
      const source = service.createSource('Audio', SourceType.AUDIO_INPUT);
      service.mute(source.id);
      expect(service.getSource(source.id)?.muted).toBe(true);

      service.unmute(source.id);

      expect(service.getSource(source.id)?.muted).toBe(false);
    });
  });

  describe('Lock', () => {
    it('should lock source', () => {
      const source = service.createSource('Test', SourceType.IMAGE);
      expect(source.locked).toBe(false);

      service.lock(source.id);

      expect(service.getSource(source.id)?.locked).toBe(true);
    });

    it('should unlock source', () => {
      const source = service.createSource('Test', SourceType.IMAGE);
      service.lock(source.id);
      expect(service.getSource(source.id)?.locked).toBe(true);

      service.unlock(source.id);

      expect(service.getSource(source.id)?.locked).toBe(false);
    });
  });

  describe('Duplicate Source', () => {
    it('should duplicate a source', () => {
      const original = service.createSource('Original', SourceType.IMAGE, {
        file: '/path/to/image.png'
      });

      const duplicate = service.duplicateSource(original.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.name).toBe('Original (Copy)');
      expect(duplicate?.type).toBe(original.type);
      expect(duplicate?.settings).toEqual(original.settings);
    });

    it('should offset duplicated source position', () => {
      const original = service.createSource('Original', SourceType.IMAGE);

      const duplicate = service.duplicateSource(original.id);

      expect(duplicate?.transform.position.x).toBe(original.transform.position.x + 20);
      expect(duplicate?.transform.position.y).toBe(original.transform.position.y + 20);
    });

    it('should return null for non-existent source', () => {
      const duplicate = service.duplicateSource('non-existent');
      expect(duplicate).toBeNull();
    });

    it('should add duplicate to sources list', () => {
      const original = service.createSource('Original', SourceType.IMAGE);
      expect(service.sources().length).toBe(1);

      service.duplicateSource(original.id);

      expect(service.sources().length).toBe(2);
    });

    it('should deep copy filters', () => {
      const original = service.createSource('Original', SourceType.IMAGE);
      service.addFilter(original.id, {
        id: 'filter-1',
        type: 'color',
        enabled: true,
        settings: { brightness: 0.5 }
      });

      const duplicate = service.duplicateSource(original.id);

      expect(duplicate?.filters.length).toBe(1);
      expect(duplicate?.filters[0]).toEqual(original.filters[0]);
    });
  });

  describe('Update Source', () => {
    it('should update source properties', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      service.updateSource(source.id, {
        name: 'Updated Name',
        enabled: false,
        volume: 0.8
      });

      const updated = service.getSource(source.id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.enabled).toBe(false);
      expect(updated?.volume).toBe(0.8);
    });

    it('should only update specified properties', () => {
      const source = service.createSource('Original Name', SourceType.IMAGE);

      service.updateSource(source.id, { volume: 0.5 });

      const updated = service.getSource(source.id);
      expect(updated?.volume).toBe(0.5);
      expect(updated?.name).toBe('Original Name');
      expect(updated?.enabled).toBe(true);
    });

    it('should not affect other sources', () => {
      const source1 = service.createSource('Source 1', SourceType.IMAGE);
      const source2 = service.createSource('Source 2', SourceType.IMAGE);

      service.updateSource(source1.id, { name: 'Updated' });

      expect(service.getSource(source1.id)?.name).toBe('Updated');
      expect(service.getSource(source2.id)?.name).toBe('Source 2');
    });
  });

  describe('Signal Reactivity', () => {
    it('should emit new sources array when source created', () => {
      let emittedSources = service.sources();
      expect(emittedSources.length).toBe(0);

      service.createSource('New Source', SourceType.IMAGE);

      emittedSources = service.sources();
      expect(emittedSources.length).toBe(1);
    });

    it('should emit updated sources array when source deleted', () => {
      const source = service.createSource('To Delete', SourceType.IMAGE);
      expect(service.sources().length).toBe(1);

      service.deleteSource(source.id);

      expect(service.sources().length).toBe(0);
    });

    it('should emit updated sources array when source updated', () => {
      const source = service.createSource('Original', SourceType.IMAGE);
      let currentSources = service.sources();
      expect(currentSources[0].name).toBe('Original');

      service.updateSource(source.id, { name: 'Updated' });

      currentSources = service.sources();
      expect(currentSources[0].name).toBe('Updated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on non-existent sources gracefully', () => {
      expect(() => service.updateSourceSettings('fake-id', {})).not.toThrow();
      expect(() => service.updateSourceTransform('fake-id', {})).not.toThrow();
      expect(() => service.addFilter('fake-id', { id: '1', type: 'test', enabled: true, settings: {} })).not.toThrow();
      expect(() => service.setVolume('fake-id', 0.5)).not.toThrow();
      expect(() => service.mute('fake-id')).not.toThrow();
      expect(() => service.unmute('fake-id')).not.toThrow();
      expect(() => service.lock('fake-id')).not.toThrow();
      expect(() => service.unlock('fake-id')).not.toThrow();
    });

    it('should handle creating source with empty settings', () => {
      const source = service.createSource('Empty Settings', SourceType.IMAGE);

      expect(source.settings).toEqual({});
    });

    it('should handle creating source with undefined settings', () => {
      const source = service.createSource('Undefined Settings', SourceType.IMAGE, undefined);

      expect(source.settings).toEqual({});
    });

    it('should maintain source order', () => {
      const source1 = service.createSource('First', SourceType.IMAGE);
      const source2 = service.createSource('Second', SourceType.IMAGE);
      const source3 = service.createSource('Third', SourceType.IMAGE);

      const sources = service.sources();
      expect(sources[0].id).toBe(source1.id);
      expect(sources[1].id).toBe(source2.id);
      expect(sources[2].id).toBe(source3.id);
    });

    it('should handle rapid updates', () => {
      const source = service.createSource('Test', SourceType.IMAGE);

      for (let i = 0; i < 100; i++) {
        service.updateSource(source.id, { volume: i / 100 });
      }

      expect(service.getSource(source.id)?.volume).toBe(0.99);
    });
  });
});
