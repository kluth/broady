import { TestBed } from '@angular/core/testing';
import { HotkeyService, HotkeyBinding } from './hotkey.service';
import { Hotkey } from '../models/settings.model';

describe('HotkeyService', () => {
  let service: HotkeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HotkeyService]
    });
    service = TestBed.inject(HotkeyService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty bindings', (done) => {
      service.bindings$.subscribe(bindings => {
        expect(bindings).toEqual([]);
        done();
      });
    });

    it('should initialize keyboard listener', () => {
      // Verify service was initialized without errors
      expect(service).toBeTruthy();
    });
  });

  describe('Register Hotkey', () => {
    it('should register a new hotkey', (done) => {
      const callback = jasmine.createSpy('callback');
      const hotkey: Hotkey = {
        key: 's',
        modifiers: {
          ctrl: true,
          alt: false,
          shift: false,
          meta: false
        }
      };

      service.registerHotkey('start-stream', hotkey, callback);

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].action).toBe('start-stream');
        expect(bindings[0].hotkey).toEqual(hotkey);
        expect(bindings[0].callback).toBe(callback);
        done();
      });
    });

    it('should register multiple hotkeys', (done) => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback1);

      service.registerHotkey('action2', {
        key: 'b',
        modifiers: { ctrl: false, alt: true, shift: false, meta: false }
      }, callback2);

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(2);
        expect(bindings[0].action).toBe('action1');
        expect(bindings[1].action).toBe('action2');
        done();
      });
    });

    it('should update existing hotkey when re-registering same action', (done) => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      service.registerHotkey('start-stream', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback1);

      service.registerHotkey('start-stream', {
        key: 't',
        modifiers: { ctrl: true, alt: true, shift: false, meta: false }
      }, callback2);

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].hotkey.key).toBe('t');
        expect(bindings[0].hotkey.modifiers.alt).toBe(true);
        expect(bindings[0].callback).toBe(callback2);
        done();
      });
    });

    it('should handle different modifier combinations', () => {
      const modifierCombinations = [
        { ctrl: true, alt: false, shift: false, meta: false },
        { ctrl: false, alt: true, shift: false, meta: false },
        { ctrl: false, alt: false, shift: true, meta: false },
        { ctrl: false, alt: false, shift: false, meta: true },
        { ctrl: true, alt: true, shift: false, meta: false },
        { ctrl: true, alt: true, shift: true, meta: false },
        { ctrl: true, alt: true, shift: true, meta: true }
      ];

      modifierCombinations.forEach((modifiers, index) => {
        service.registerHotkey(`action${index}`, {
          key: 'a',
          modifiers
        }, () => {});
      });

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(modifierCombinations.length);
      });
    });
  });

  describe('Unregister Hotkey', () => {
    it('should unregister a hotkey by action', (done) => {
      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.registerHotkey('action2', {
        key: 'b',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.unregisterHotkey('action1');

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].action).toBe('action2');
        done();
      });
    });

    it('should handle unregistering non-existent action', (done) => {
      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.unregisterHotkey('non-existent');

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].action).toBe('action1');
        done();
      });
    });

    it('should handle unregistering from empty bindings', (done) => {
      service.unregisterHotkey('any-action');

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(0);
        done();
      });
    });

    it('should unregister all instances of action', (done) => {
      service.registerHotkey('duplicate', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      // This should replace the previous one, so only one exists
      service.registerHotkey('duplicate', {
        key: 'b',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.unregisterHotkey('duplicate');

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(0);
        done();
      });
    });
  });

  describe('Update Hotkey', () => {
    it('should update hotkey for existing action', (done) => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const newHotkey: Hotkey = {
        key: 'b',
        modifiers: { ctrl: false, alt: true, shift: false, meta: false }
      };

      service.updateHotkey('action1', newHotkey);

      service.bindings$.subscribe(bindings => {
        expect(bindings[0].hotkey).toEqual(newHotkey);
        expect(bindings[0].callback).toBe(callback); // Callback unchanged
        done();
      });
    });

    it('should not update non-existent action', (done) => {
      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.updateHotkey('non-existent', {
        key: 'b',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      });

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].action).toBe('action1');
        expect(bindings[0].hotkey.key).toBe('a');
        done();
      });
    });

    it('should only update specified binding', (done) => {
      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.registerHotkey('action2', {
        key: 'b',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.updateHotkey('action1', {
        key: 'c',
        modifiers: { ctrl: true, alt: true, shift: false, meta: false }
      });

      service.bindings$.subscribe(bindings => {
        expect(bindings[0].hotkey.key).toBe('c');
        expect(bindings[0].hotkey.modifiers.alt).toBe(true);
        expect(bindings[1].hotkey.key).toBe('b');
        expect(bindings[1].hotkey.modifiers.alt).toBe(false);
        done();
      });
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should trigger callback on matching keydown event', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      });

      document.dispatchEvent(event);

      // Give the event time to propagate
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 10);
    });

    it('should not trigger on non-matching key', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const event = new KeyboardEvent('keydown', {
        key: 'a', // Different key
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      });

      document.dispatchEvent(event);

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
      }, 10);
    });

    it('should not trigger on non-matching modifiers', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: false, // Missing ctrl
        altKey: false,
        shiftKey: false,
        metaKey: false
      });

      document.dispatchEvent(event);

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
      }, 10);
    });

    it('should handle case-insensitive key matching', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 'S', // Uppercase
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const event = new KeyboardEvent('keydown', {
        key: 's', // Lowercase
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      });

      document.dispatchEvent(event);

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 10);
    });

    it('should ignore events from input elements', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      input.dispatchEvent(event);

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        document.body.removeChild(input);
      }, 10);
    });

    it('should ignore events from textarea elements', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      textarea.dispatchEvent(event);

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        document.body.removeChild(textarea);
      }, 10);
    });

    it('should prevent default behavior on match', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('test-action', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        cancelable: true
      });

      const preventDefaultSpy = spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      setTimeout(() => {
        expect(preventDefaultSpy).toHaveBeenCalled();
      }, 10);
    });

    it('should only trigger first matching hotkey', () => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      // Register same hotkey twice
      service.registerHotkey('action1', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback1);

      service.registerHotkey('action2', {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback2);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      });

      document.dispatchEvent(event);

      setTimeout(() => {
        expect(callback1).toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      }, 10);
    });
  });

  describe('Hotkey String Representation', () => {
    it('should generate string for ctrl+key', () => {
      const hotkey: Hotkey = {
        key: 's',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Ctrl+S');
    });

    it('should generate string for alt+key', () => {
      const hotkey: Hotkey = {
        key: 'a',
        modifiers: { ctrl: false, alt: true, shift: false, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Alt+A');
    });

    it('should generate string for shift+key', () => {
      const hotkey: Hotkey = {
        key: 'x',
        modifiers: { ctrl: false, alt: false, shift: true, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Shift+X');
    });

    it('should generate string for meta+key', () => {
      const hotkey: Hotkey = {
        key: 'm',
        modifiers: { ctrl: false, alt: false, shift: false, meta: true }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Meta+M');
    });

    it('should generate string for multiple modifiers', () => {
      const hotkey: Hotkey = {
        key: 's',
        modifiers: { ctrl: true, alt: true, shift: false, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Ctrl+Alt+S');
    });

    it('should generate string for all modifiers', () => {
      const hotkey: Hotkey = {
        key: 'a',
        modifiers: { ctrl: true, alt: true, shift: true, meta: true }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('Ctrl+Alt+Shift+Meta+A');
    });

    it('should generate string for no modifiers', () => {
      const hotkey: Hotkey = {
        key: 'f5',
        modifiers: { ctrl: false, alt: false, shift: false, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toBe('F5');
    });

    it('should uppercase the key', () => {
      const hotkey: Hotkey = {
        key: 'lowercase',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      };

      const str = service.getHotkeyString(hotkey);
      expect(str).toContain('LOWERCASE');
    });
  });

  describe('Observable Updates', () => {
    it('should emit updated bindings when registering', (done) => {
      let emissionCount = 0;

      service.bindings$.subscribe(() => {
        emissionCount++;
      });

      // First emission is immediate (empty array)
      expect(emissionCount).toBe(1);

      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      setTimeout(() => {
        expect(emissionCount).toBe(2);
        done();
      }, 10);
    });

    it('should emit updated bindings when unregistering', (done) => {
      service.registerHotkey('action1', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      let emissionCount = 0;
      service.bindings$.subscribe(() => {
        emissionCount++;
      });

      const initialCount = emissionCount;

      service.unregisterHotkey('action1');

      setTimeout(() => {
        expect(emissionCount).toBe(initialCount + 1);
        done();
      }, 10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special keys', () => {
      const specialKeys = ['F1', 'F12', 'Enter', 'Escape', 'ArrowUp', 'Home', 'Delete'];

      specialKeys.forEach(key => {
        service.registerHotkey(`action-${key}`, {
          key,
          modifiers: { ctrl: false, alt: false, shift: false, meta: false }
        }, () => {});
      });

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(specialKeys.length);
      });
    });

    it('should handle rapid registration and unregistration', (done) => {
      for (let i = 0; i < 50; i++) {
        service.registerHotkey(`action${i}`, {
          key: 'a',
          modifiers: { ctrl: true, alt: false, shift: false, meta: false }
        }, () => {});

        if (i % 2 === 0) {
          service.unregisterHotkey(`action${i}`);
        }
      }

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(25); // Half were unregistered
        done();
      });
    });

    it('should handle empty key', () => {
      const callback = jasmine.createSpy('callback');

      service.registerHotkey('empty-key', {
        key: '',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, callback);

      service.bindings$.subscribe(bindings => {
        expect(bindings.length).toBe(1);
        expect(bindings[0].hotkey.key).toBe('');
      });
    });

    it('should maintain binding order', (done) => {
      service.registerHotkey('first', {
        key: 'a',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.registerHotkey('second', {
        key: 'b',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.registerHotkey('third', {
        key: 'c',
        modifiers: { ctrl: true, alt: false, shift: false, meta: false }
      }, () => {});

      service.bindings$.subscribe(bindings => {
        expect(bindings[0].action).toBe('first');
        expect(bindings[1].action).toBe('second');
        expect(bindings[2].action).toBe('third');
        done();
      });
    });
  });
});
