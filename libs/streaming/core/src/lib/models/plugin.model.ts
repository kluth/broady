/**
 * Plugin System Models
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  type: PluginType;
  hooks: PluginHooks;
  settings: PluginSettings;
}

export enum PluginType {
  SOURCE = 'source',
  FILTER = 'filter',
  TRANSITION = 'transition',
  ENCODER = 'encoder',
  OUTPUT = 'output',
  SERVICE = 'service'
}

export interface PluginHooks {
  onLoad?: () => void;
  onUnload?: () => void;
  onSceneChange?: (sceneId: string) => void;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onSourceCreate?: (sourceId: string) => void;
  onSourceDestroy?: (sourceId: string) => void;
}

export interface PluginSettings {
  [key: string]: any;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  main: string;
  type: PluginType;
  dependencies?: string[];
  permissions?: PluginPermission[];
}

export enum PluginPermission {
  READ_SCENES = 'read_scenes',
  WRITE_SCENES = 'write_scenes',
  READ_SOURCES = 'read_sources',
  WRITE_SOURCES = 'write_sources',
  READ_SETTINGS = 'read_settings',
  WRITE_SETTINGS = 'write_settings',
  NETWORK_ACCESS = 'network_access',
  FILE_SYSTEM = 'file_system',
  AUDIO_CAPTURE = 'audio_capture',
  VIDEO_CAPTURE = 'video_capture'
}
