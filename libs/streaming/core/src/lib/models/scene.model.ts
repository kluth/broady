import { Source } from './source.model';

/**
 * Scene Management Models
 */

export interface Scene {
  id: string;
  name: string;
  sources: SceneItem[];
  enabled: boolean;
  locked: boolean;
}

export interface SceneItem {
  id: string;
  sourceId: string;
  source: Source;
  order: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
}

export interface SceneCollection {
  id: string;
  name: string;
  scenes: Scene[];
  activeSceneId: string;
}

export enum TransitionType {
  CUT = 'cut',
  FADE = 'fade',
  SWIPE = 'swipe',
  SLIDE = 'slide',
  STINGER = 'stinger',
  FADE_TO_COLOR = 'fade_to_color',
  WIPE = 'wipe',
  LUMA_WIPE = 'luma_wipe'
}

export interface Transition {
  type: TransitionType;
  duration: number; // milliseconds
  settings: {
    [key: string]: any;
  };
}

export interface SceneTransition extends Transition {
  fromSceneId: string;
  toSceneId: string;
}
