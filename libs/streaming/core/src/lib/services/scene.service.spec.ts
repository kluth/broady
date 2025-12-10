import { TestBed } from '@angular/core/testing';
import { SceneService } from './scene.service';
import { Scene, SceneItem, TransitionType } from '../models/scene.model';
import { Source, SourceType } from '../models/source.model';

describe('SceneService', () => {
  let service: SceneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneService);
  });

  describe('BDD: Scene Management', () => {
    describe('GIVEN no scenes exist', () => {
      it('WHEN requesting all scenes THEN should return empty array', (done) => {
        service.scenes$.subscribe((scenes) => {
          expect(scenes).toEqual([]);
          done();
        });
      });

      it('WHEN creating a new scene THEN should add it to the collection', (done) => {
        const sceneName = 'Test Scene';
        service.createScene(sceneName);

        service.scenes$.subscribe((scenes) => {
          expect(scenes.length).toBe(1);
          expect(scenes[0].name).toBe(sceneName);
          expect(scenes[0].sources).toEqual([]);
          done();
        });
      });
    });

    describe('GIVEN multiple scenes exist', () => {
      beforeEach(() => {
        service.createScene('Scene 1');
        service.createScene('Scene 2');
        service.createScene('Scene 3');
      });

      it('WHEN requesting all scenes THEN should return all scenes', (done) => {
        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 3) {
            expect(scenes.map((s) => s.name)).toEqual(['Scene 1', 'Scene 2', 'Scene 3']);
            done();
          }
        });
      });

      it('WHEN deleting a scene THEN should remove it from collection', (done) => {
        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 3) {
            const sceneToDelete = scenes[1];
            service.deleteScene(sceneToDelete.id);
          } else if (scenes.length === 2) {
            expect(scenes.map((s) => s.name)).toEqual(['Scene 1', 'Scene 3']);
            done();
          }
        });
      });

      it('WHEN renaming a scene THEN should update scene name', (done) => {
        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 3 && scenes[0].name === 'Scene 1') {
            service.renameScene(scenes[0].id, 'Renamed Scene');
          } else if (scenes.length === 3 && scenes[0].name === 'Renamed Scene') {
            expect(scenes[0].name).toBe('Renamed Scene');
            done();
          }
        });
      });

      it('WHEN duplicating a scene THEN should create a copy', (done) => {
        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 3) {
            service.duplicateScene(scenes[0].id);
          } else if (scenes.length === 4) {
            expect(scenes[3].name).toContain('Scene 1');
            done();
          }
        });
      });
    });

    describe('GIVEN an active scene', () => {
      let activeSceneId: string;

      beforeEach((done) => {
        service.createScene('Active Scene');
        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 1) {
            activeSceneId = scenes[0].id;
            service.setActiveScene(activeSceneId);
            done();
          }
        });
      });

      it('WHEN requesting active scene THEN should return the active scene', (done) => {
        service.activeScene$.subscribe((scene) => {
          if (scene) {
            expect(scene.id).toBe(activeSceneId);
            expect(scene.name).toBe('Active Scene');
            done();
          }
        });
      });

      it('WHEN switching to another scene THEN should update active scene', (done) => {
        service.createScene('New Active Scene');

        service.scenes$.subscribe((scenes) => {
          if (scenes.length === 2) {
            const newScene = scenes.find((s) => s.name === 'New Active Scene');
            if (newScene) {
              service.setActiveScene(newScene.id);
            }
          }
        });

        service.activeScene$.subscribe((scene) => {
          if (scene && scene.name === 'New Active Scene') {
            expect(scene.name).toBe('New Active Scene');
            done();
          }
        });
      });
    });
  });

  describe('BDD: Scene Item Management', () => {
    let testScene: Scene;
    let testSource: Source;

    beforeEach((done) => {
      service.createScene('Test Scene');

      testSource = {
        id: 'source-1',
        name: 'Test Source',
        type: SourceType.VIDEO_CAPTURE,
        enabled: true,
        settings: {},
        transform: {
          position: { x: 0, y: 0 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          crop: { top: 0, bottom: 0, left: 0, right: 0 },
          alignment: 0,
          boundsType: 'none',
          boundsAlignment: 0,
          bounds: { x: 1920, y: 1080 }
        },
        filters: [],
        volume: 1,
        muted: false,
        locked: false,
        visible: true
      };

      service.scenes$.subscribe((scenes) => {
        if (scenes.length === 1) {
          testScene = scenes[0];
          done();
        }
      });
    });

    it('WHEN adding a source to scene THEN should appear in scene items', (done) => {
      service.addSourceToScene(testScene.id, testSource);

      service.getScene(testScene.id).subscribe((scene) => {
        if (scene && scene.sources.length > 0) {
          expect(scene.sources.length).toBe(1);
          expect(scene.sources[0].sourceId).toBe(testSource.id);
          done();
        }
      });
    });

    it('WHEN removing a source from scene THEN should be removed from items', (done) => {
      service.addSourceToScene(testScene.id, testSource);

      service.getScene(testScene.id).subscribe((scene) => {
        if (scene && scene.sources.length === 1) {
          service.removeSourceFromScene(testScene.id, scene.sources[0].id);
        } else if (scene && scene.sources.length === 0) {
          expect(scene.sources).toEqual([]);
          done();
        }
      });
    });

    it('WHEN reordering sources THEN should update order', (done) => {
      const source2: Source = { ...testSource, id: 'source-2', name: 'Source 2' };
      const source3: Source = { ...testSource, id: 'source-3', name: 'Source 3' };

      service.addSourceToScene(testScene.id, testSource);
      service.addSourceToScene(testScene.id, source2);
      service.addSourceToScene(testScene.id, source3);

      service.getScene(testScene.id).subscribe((scene) => {
        if (scene && scene.sources.length === 3 && scene.sources[0].sourceId !== 'source-3') {
          const items = scene.sources;
          service.reorderSceneItem(testScene.id, items[2].id, 0);
        } else if (scene && scene.sources.length === 3) {
          expect(scene.sources[0].sourceId).toBe('source-3');
          expect(scene.sources[1].sourceId).toBe('source-1');
          expect(scene.sources[2].sourceId).toBe('source-2');
          done();
        }
      });
    });
  });

  describe('BDD: Scene Transitions', () => {
    let scene1: Scene;
    let scene2: Scene;

    beforeEach((done) => {
      service.createScene('Scene 1');
      service.createScene('Scene 2');

      service.scenes$.subscribe((scenes) => {
        if (scenes.length === 2) {
          scene1 = scenes[0];
          scene2 = scenes[1];
          done();
        }
      });
    });

    it('WHEN transitioning between scenes THEN should emit transition state', (done) => {
      service.setActiveScene(scene1.id);

      service.transitionToScene(scene2.id, {
        type: TransitionType.FADE,
        duration: 300,
        settings: {}
      });

      service.isTransitioning$.subscribe((transitioning) => {
        if (transitioning) {
          expect(transitioning).toBe(true);
          done();
        }
      });
    });

    it('WHEN transition completes THEN active scene should be updated', (done) => {
      service.setActiveScene(scene1.id);

      service.transitionToScene(scene2.id, {
        type: TransitionType.CUT,
        duration: 0,
        settings: {}
      });

      setTimeout(() => {
        service.activeScene$.subscribe((scene) => {
          if (scene && scene.id === scene2.id) {
            expect(scene.id).toBe(scene2.id);
            done();
          }
        });
      }, 100);
    });

    it('WHEN setting transition duration THEN should use custom duration', (done) => {
      const customDuration = 500;

      service.setTransitionDuration(customDuration);
      service.defaultTransition$.subscribe((transition) => {
        if (transition.duration === customDuration) {
          expect(transition.duration).toBe(customDuration);
          done();
        }
      });
    });
  });

  describe('BDD: Scene Collections', () => {
    it('WHEN creating a scene collection THEN should contain all scenes', (done) => {
      service.createScene('Scene A');
      service.createScene('Scene B');

      service.createSceneCollection('Collection 1');

      service.sceneCollections$.subscribe((collections) => {
        if (collections.length > 0) {
          expect(collections[0].name).toBe('Collection 1');
          expect(collections[0].scenes.length).toBe(2);
          done();
        }
      });
    });

    it('WHEN switching collections THEN should load different scenes', (done) => {
      service.createSceneCollection('Collection 1');
      service.createScene('Scene 1');

      service.createSceneCollection('Collection 2');
      service.createScene('Scene 2');

      service.loadSceneCollection('Collection 1');

      service.scenes$.subscribe((scenes) => {
        if (scenes.length > 0 && scenes[0].name === 'Scene 1') {
          expect(scenes[0].name).toBe('Scene 1');
          done();
        }
      });
    });
  });
});
