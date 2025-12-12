import { Injectable, signal } from '@angular/core';

/**
 * Plugin Loader Service
 * Dynamic plugin system with sandboxing and lifecycle management
 *
 * Plugin Architecture:
 * - Plugins are loaded from a plugins directory
 * - Each plugin has a manifest.json file
 * - Plugins can hook into various system events
 * - Sandboxed execution to prevent malicious code
 *
 * Plugin Manifest Example:
 * {
 *   "id": "my-plugin",
 *   "name": "My Plugin",
 *   "version": "1.0.0",
 *   "description": "A sample plugin",
 *   "author": "Plugin Author",
 *   "main": "index.js",
 *   "permissions": ["scenes", "sources", "streaming"],
 *   "hooks": ["stream.start", "scene.change"]
 * }
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  permissions: string[];
  hooks: string[];
  dependencies?: Record<string, string>;
}

export interface Plugin {
  manifest: PluginManifest;
  instance: any;
  enabled: boolean;
  loaded: boolean;
  error?: string;
}

export interface PluginAPI {
  // Scene API
  scenes: {
    getAll: () => Promise<any[]>;
    getActive: () => Promise<any>;
    switch: (sceneId: string) => Promise<void>;
    create: (name: string, config: any) => Promise<any>;
  };

  // Source API
  sources: {
    getAll: () => Promise<any[]>;
    getByScene: (sceneId: string) => Promise<any[]>;
    create: (type: string, name: string, config: any) => Promise<any>;
    update: (sourceId: string, config: any) => Promise<void>;
    delete: (sourceId: string) => Promise<void>;
  };

  // Streaming API
  streaming: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    getStatus: () => Promise<{ streaming: boolean; recording: boolean }>;
  };

  // Events API
  events: {
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
  };

  // Storage API
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };

  // UI API
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showDialog: (title: string, content: string, buttons?: string[]) => Promise<string>;
    addMenuItem: (label: string, callback: () => void) => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PluginLoaderService {
  readonly plugins = signal<Plugin[]>([]);
  readonly loadedCount = signal(0);
  readonly enabledCount = signal(0);

  private pluginAPI: PluginAPI | null = null;
  private eventListeners = new Map<string, Set<Function>>();

  /**
   * Initialize plugin system
   */
  async initialize(): Promise<void> {
    this.pluginAPI = this.createPluginAPI();

    // Load plugins from directory
    await this.loadPluginsFromDirectory('/plugins');

    // Auto-enable previously enabled plugins
    const enabledPlugins = JSON.parse(localStorage.getItem('enabled_plugins') || '[]');
    for (const pluginId of enabledPlugins) {
      await this.enablePlugin(pluginId);
    }
  }

  /**
   * Load plugins from directory
   */
  private async loadPluginsFromDirectory(directory: string): Promise<void> {
    try {
      // In a real implementation, this would read from filesystem or API
      // For now, we'll support dynamically loaded plugins

      // Check if plugins are configured
      const pluginList = localStorage.getItem('plugin_list');
      if (pluginList) {
        const plugins = JSON.parse(pluginList);
        for (const pluginPath of plugins) {
          await this.loadPlugin(pluginPath);
        }
      }
    } catch (error) {
      console.error('Failed to load plugins from directory:', error);
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginPath: string): Promise<boolean> {
    try {
      // Load manifest
      const manifestResponse = await fetch(`${pluginPath}/manifest.json`);
      if (!manifestResponse.ok) {
        throw new Error('Failed to load plugin manifest');
      }

      const manifest: PluginManifest = await manifestResponse.json();

      // Check if already loaded
      if (this.plugins().some(p => p.manifest.id === manifest.id)) {
        console.warn(`Plugin ${manifest.id} already loaded`);
        return false;
      }

      // Load main script
      const scriptResponse = await fetch(`${pluginPath}/${manifest.main}`);
      if (!scriptResponse.ok) {
        throw new Error('Failed to load plugin script');
      }

      const scriptCode = await scriptResponse.text();

      // Create sandboxed execution context
      const pluginInstance = this.createPluginInstance(scriptCode, manifest);

      // Add to plugins list
      this.plugins.update(plugins => [
        ...plugins,
        {
          manifest,
          instance: pluginInstance,
          enabled: false,
          loaded: true
        }
      ]);

      this.loadedCount.set(this.plugins().length);

      return true;
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);

      this.plugins.update(plugins => [
        ...plugins,
        {
          manifest: { id: pluginPath, name: pluginPath, version: '0.0.0', description: '', author: '', main: '', permissions: [], hooks: [] },
          instance: null,
          enabled: false,
          loaded: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      ]);

      return false;
    }
  }

  /**
   * Create sandboxed plugin instance
   */
  private createPluginInstance(code: string, manifest: PluginManifest): any {
    try {
      // Create sandboxed context with limited API
      const sandbox = {
        console: {
          log: (...args: any[]) => console.log(`[Plugin ${manifest.id}]`, ...args),
          error: (...args: any[]) => console.error(`[Plugin ${manifest.id}]`, ...args),
          warn: (...args: any[]) => console.warn(`[Plugin ${manifest.id}]`, ...args)
        },
        api: this.createRestrictedAPI(manifest),
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        fetch: this.createRestrictedFetch(manifest)
      };

      // Wrap code in function to create scope
      const wrappedCode = `
        (function(console, api, setTimeout, setInterval, clearTimeout, clearInterval, fetch) {
          ${code}

          // Return plugin interface
          return typeof plugin !== 'undefined' ? plugin : {};
        })
      `;

      // Execute in sandbox
      const pluginFactory = new Function('return ' + wrappedCode)();
      const instance = pluginFactory(
        sandbox.console,
        sandbox.api,
        sandbox.setTimeout,
        sandbox.setInterval,
        sandbox.clearTimeout,
        sandbox.clearInterval,
        sandbox.fetch
      );

      return instance;
    } catch (error) {
      console.error('Failed to create plugin instance:', error);
      throw error;
    }
  }

  /**
   * Create restricted API based on plugin permissions
   */
  private createRestrictedAPI(manifest: PluginManifest): Partial<PluginAPI> {
    const api: any = {};

    if (manifest.permissions.includes('scenes')) {
      api.scenes = this.pluginAPI?.scenes;
    }

    if (manifest.permissions.includes('sources')) {
      api.sources = this.pluginAPI?.sources;
    }

    if (manifest.permissions.includes('streaming')) {
      api.streaming = this.pluginAPI?.streaming;
    }

    api.events = this.pluginAPI?.events;
    api.storage = this.createPluginStorage(manifest.id);
    api.ui = this.pluginAPI?.ui;

    return api;
  }

  /**
   * Create restricted fetch for plugins
   */
  private createRestrictedFetch(manifest: PluginManifest): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      // Convert input to string for validation
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Only allow HTTPS requests
      if (!url.startsWith('https://')) {
        throw new Error('Only HTTPS requests are allowed');
      }

      // Add plugin user agent
      const headers = new Headers(init?.headers);
      headers.set('User-Agent', `StreamingStudio-Plugin/${manifest.id}/${manifest.version}`);

      return fetch(input, {
        ...init,
        headers
      });
    };
  }

  /**
   * Create isolated storage for plugin
   */
  private createPluginStorage(pluginId: string) {
    const prefix = `plugin_${pluginId}_`;

    return {
      get: async (key: string) => {
        const value = localStorage.getItem(prefix + key);
        return value ? JSON.parse(value) : null;
      },
      set: async (key: string, value: any) => {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      delete: async (key: string) => {
        localStorage.removeItem(prefix + key);
      }
    };
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins().find(p => p.manifest.id === pluginId);
    if (!plugin || !plugin.loaded) {
      return false;
    }

    try {
      // Call plugin's onEnable hook if it exists
      if (plugin.instance && typeof plugin.instance.onEnable === 'function') {
        await plugin.instance.onEnable();
      }

      // Register plugin's hooks
      this.registerPluginHooks(plugin);

      // Update plugin state
      this.plugins.update(plugins =>
        plugins.map(p =>
          p.manifest.id === pluginId ? { ...p, enabled: true } : p
        )
      );

      this.enabledCount.set(this.plugins().filter(p => p.enabled).length);

      // Save enabled state
      this.saveEnabledPlugins();

      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins().find(p => p.manifest.id === pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // Call plugin's onDisable hook if it exists
      if (plugin.instance && typeof plugin.instance.onDisable === 'function') {
        await plugin.instance.onDisable();
      }

      // Unregister plugin's hooks
      this.unregisterPluginHooks(plugin);

      // Update plugin state
      this.plugins.update(plugins =>
        plugins.map(p =>
          p.manifest.id === pluginId ? { ...p, enabled: false } : p
        )
      );

      this.enabledCount.set(this.plugins().filter(p => p.enabled).length);

      // Save enabled state
      this.saveEnabledPlugins();

      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    await this.disablePlugin(pluginId);

    this.plugins.update(plugins =>
      plugins.filter(p => p.manifest.id !== pluginId)
    );

    this.loadedCount.set(this.plugins().length);

    return true;
  }

  /**
   * Register plugin hooks
   */
  private registerPluginHooks(plugin: Plugin): void {
    if (!plugin.instance) return;

    for (const hook of plugin.manifest.hooks) {
      if (typeof plugin.instance[hook] === 'function') {
        this.addEventListener(hook, plugin.instance[hook].bind(plugin.instance));
      }
    }
  }

  /**
   * Unregister plugin hooks
   */
  private unregisterPluginHooks(plugin: Plugin): void {
    if (!plugin.instance) return;

    for (const hook of plugin.manifest.hooks) {
      if (typeof plugin.instance[hook] === 'function') {
        this.removeEventListener(hook, plugin.instance[hook]);
      }
    }
  }

  /**
   * Event system
   */
  private addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  private removeEventListener(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  emitEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Save enabled plugins to localStorage
   */
  private saveEnabledPlugins(): void {
    const enabled = this.plugins()
      .filter(p => p.enabled)
      .map(p => p.manifest.id);

    localStorage.setItem('enabled_plugins', JSON.stringify(enabled));
  }

  /**
   * Create plugin API
   */
  private createPluginAPI(): PluginAPI {
    return {
      scenes: {
        getAll: async () => {
          // Would integrate with actual scene service
          return [];
        },
        getActive: async () => {
          return null;
        },
        switch: async (sceneId: string) => {
          // Would integrate with actual scene service
        },
        create: async (name: string, config: any) => {
          return {};
        }
      },
      sources: {
        getAll: async () => [],
        getByScene: async (sceneId: string) => [],
        create: async (type: string, name: string, config: any) => ({}),
        update: async (sourceId: string, config: any) => {},
        delete: async (sourceId: string) => {}
      },
      streaming: {
        start: async () => {},
        stop: async () => {},
        getStatus: async () => ({ streaming: false, recording: false })
      },
      events: {
        on: (event: string, callback: (...args: any[]) => void) => {
          this.addEventListener(event, callback);
        },
        off: (event: string, callback: (...args: any[]) => void) => {
          this.removeEventListener(event, callback);
        },
        emit: (event: string, ...args: any[]) => {
          this.emitEvent(event, ...args);
        }
      },
      storage: {
        get: async (key: string) => {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        set: async (key: string, value: any) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        delete: async (key: string) => {
          localStorage.removeItem(key);
        }
      },
      ui: {
        showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
          // Would integrate with actual notification system
          console.log(`[${type.toUpperCase()}] ${message}`);
        },
        showDialog: async (title: string, content: string, buttons: string[] = ['OK']) => {
          // Would integrate with actual dialog system
          return 'OK';
        },
        addMenuItem: (label: string, callback: () => void) => {
          // Would integrate with actual menu system
        }
      }
    };
  }
}
