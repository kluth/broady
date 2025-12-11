import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Plugin, PluginType, PluginManifest } from '../models/plugin.model';

@Injectable({
  providedIn: 'root',
})
export class PluginService {
  private pluginsSubject = new BehaviorSubject<Plugin[]>([]);
  public readonly plugins$ = this.pluginsSubject.asObservable();

  constructor() {
    this.loadPlugins();
  }

  /**
   * Load plugins from storage/disk
   */
  private loadPlugins(): void {
    // In a real implementation, this would load plugins from a plugins directory
    console.log('Loading plugins...');
  }

  /**
   * Install a plugin
   */
  async installPlugin(manifest: PluginManifest): Promise<Plugin> {
    const plugin: Plugin = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      description: manifest.description,
      enabled: true,
      type: manifest.type,
      hooks: {},
      settings: {},
    };

    const plugins = [...this.pluginsSubject.value, plugin];
    this.pluginsSubject.next(plugins);

    console.log(`Plugin installed: ${plugin.name}`);
    return plugin;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugins = this.pluginsSubject.value.filter((p) => p.id !== pluginId);
    this.pluginsSubject.next(plugins);

    console.log(`Plugin uninstalled: ${pluginId}`);
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginId: string): void {
    const plugins = this.pluginsSubject.value.map((plugin) => {
      if (plugin.id === pluginId) {
        return { ...plugin, enabled: true };
      }
      return plugin;
    });

    this.pluginsSubject.next(plugins);

    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin?.hooks.onLoad) {
      plugin.hooks.onLoad();
    }
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginId: string): void {
    const plugin = this.pluginsSubject.value.find((p) => p.id === pluginId);

    if (plugin?.hooks.onUnload) {
      plugin.hooks.onUnload();
    }

    const plugins = this.pluginsSubject.value.map((p) => {
      if (p.id === pluginId) {
        return { ...p, enabled: false };
      }
      return p;
    });

    this.pluginsSubject.next(plugins);
  }

  /**
   * Update plugin settings
   */
  updatePluginSettings(pluginId: string, settings: any): void {
    const plugins = this.pluginsSubject.value.map((plugin) => {
      if (plugin.id === pluginId) {
        return {
          ...plugin,
          settings: { ...plugin.settings, ...settings },
        };
      }
      return plugin;
    });

    this.pluginsSubject.next(plugins);
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginType): Observable<Plugin[]> {
    return new Observable((observer) => {
      const subscription = this.plugins$.subscribe((plugins) => {
        observer.next(plugins.filter((p) => p.type === type));
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Trigger plugin hook
   */
  triggerHook(hookName: keyof Plugin['hooks'], ...args: unknown[]): void {
    const plugins = this.pluginsSubject.value.filter((p) => p.enabled);

    for (const plugin of plugins) {
      const hook = plugin.hooks[hookName];
      if (hook && typeof hook === 'function') {
        try {
          (hook as (...args: unknown[]) => void)(...args);
        } catch (error) {
          console.error(
            `Error in plugin ${plugin.name} hook ${hookName}:`,
            error
          );
        }
      }
    }
  }
}
