import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { VirtualCamera, VirtualCameraState, VideoFormat } from '../models/virtual-camera.model';

@Injectable({
  providedIn: 'root'
})
export class VirtualCameraService {
  private virtualCameraSubject = new BehaviorSubject<VirtualCamera>({
    enabled: false,
    name: 'OBS Virtual Camera',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    format: VideoFormat.NV12
  });

  private virtualCameraStateSubject = new BehaviorSubject<VirtualCameraState>({
    isActive: false,
    connectedApplications: [],
    frameCount: 0,
    droppedFrames: 0
  });

  public readonly virtualCamera$ = this.virtualCameraSubject.asObservable();
  public readonly virtualCameraState$ = this.virtualCameraStateSubject.asObservable();

  private frameInterval: any;

  constructor() {}

  /**
   * Start virtual camera
   */
  async startVirtualCamera(): Promise<void> {
    const camera = this.virtualCameraSubject.value;

    if (camera.enabled) {
      throw new Error('Virtual camera is already running');
    }

    this.virtualCameraSubject.next({
      ...camera,
      enabled: true
    });

    this.virtualCameraStateSubject.next({
      isActive: true,
      connectedApplications: [],
      frameCount: 0,
      droppedFrames: 0
    });

    this.startFrameCounter();

    console.log('Virtual camera started');
  }

  /**
   * Stop virtual camera
   */
  async stopVirtualCamera(): Promise<void> {
    const camera = this.virtualCameraSubject.value;

    if (!camera.enabled) {
      throw new Error('Virtual camera is not running');
    }

    this.virtualCameraSubject.next({
      ...camera,
      enabled: false
    });

    this.virtualCameraStateSubject.next({
      isActive: false,
      connectedApplications: [],
      frameCount: 0,
      droppedFrames: 0
    });

    this.stopFrameCounter();

    console.log('Virtual camera stopped');
  }

  /**
   * Configure virtual camera
   */
  configure(config: Partial<VirtualCamera>): void {
    const camera = this.virtualCameraSubject.value;

    if (camera.enabled) {
      throw new Error('Cannot configure while virtual camera is running');
    }

    this.virtualCameraSubject.next({
      ...camera,
      ...config
    });
  }

  /**
   * Get connected applications
   */
  getConnectedApplications(): string[] {
    return this.virtualCameraStateSubject.value.connectedApplications;
  }

  /**
   * Simulate an application connecting
   */
  simulateAppConnection(appName: string): void {
    const state = this.virtualCameraStateSubject.value;

    this.virtualCameraStateSubject.next({
      ...state,
      connectedApplications: [...state.connectedApplications, appName]
    });

    console.log(`${appName} connected to virtual camera`);
  }

  /**
   * Simulate an application disconnecting
   */
  simulateAppDisconnection(appName: string): void {
    const state = this.virtualCameraStateSubject.value;

    this.virtualCameraStateSubject.next({
      ...state,
      connectedApplications: state.connectedApplications.filter((app) => app !== appName)
    });

    console.log(`${appName} disconnected from virtual camera`);
  }

  /**
   * Start frame counter
   */
  private startFrameCounter(): void {
    const camera = this.virtualCameraSubject.value;
    const frameTime = 1000 / camera.fps;

    this.frameInterval = interval(frameTime).subscribe(() => {
      const state = this.virtualCameraStateSubject.value;

      this.virtualCameraStateSubject.next({
        ...state,
        frameCount: state.frameCount + 1,
        droppedFrames: state.droppedFrames + (Math.random() > 0.98 ? 1 : 0)
      });
    });
  }

  /**
   * Stop frame counter
   */
  private stopFrameCounter(): void {
    if (this.frameInterval) {
      this.frameInterval.unsubscribe();
      this.frameInterval = null;
    }
  }
}
