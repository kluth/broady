import { Injectable, signal } from '@angular/core';

export interface NDISource {
  id: string;
  name: string;
  ipAddress: string;
  connected: boolean;
}

export interface NDIOutput {
  id: string;
  name: string;
  enabled: boolean;
  resolution: string;
  fps: number;
}

@Injectable({
  providedIn: 'root'
})
export class NDIService {
  readonly isEnabled = signal(false);
  readonly sources = signal<NDISource[]>([]);
  readonly outputs = signal<NDIOutput[]>([]);

  async scanForSources(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.sources.set([
      { id: '1', name: 'Camera 1 (NDI)', ipAddress: '192.168.1.100', connected: false }
    ]);
  }

  connectSource(sourceId: string): void {
    this.sources.update(sources =>
      sources.map(s => s.id === sourceId ? { ...s, connected: true } : s)
    );
  }
}
