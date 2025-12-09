/**
 * Studio Mode Models
 */

export interface StudioMode {
  enabled: boolean;
  previewSceneId: string;
  programSceneId: string;
  transition: StudioTransition;
  verticalLayout: boolean;
}

export interface StudioTransition {
  type: string;
  duration: number;
  settings: {
    [key: string]: any;
  };
}

export interface StudioModeState {
  inStudioMode: boolean;
  inTransition: boolean;
  transitionProgress: number; // 0-1
  previewScene: string;
  programScene: string;
}
