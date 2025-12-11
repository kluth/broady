import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AudioService } from '../../services/audio.service';
import { AudioFilterType, MonitoringType } from '../../models/audio.model';

@Component({
  selector: 'streaming-audio-mixer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="audio-mixer">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>graphic_eq</mat-icon>
          Audio Mixer
        </mat-card-title>
        <button mat-icon-button (click)="openAudioSettings()" matTooltip="Audio Settings">
          <mat-icon>settings</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content class="mixer-content">
        <!-- Master Channel -->
        <div class="mixer-channel master">
          <div class="channel-header">
            <span class="channel-name">
              <mat-icon inline>volume_up</mat-icon>
              Master
            </span>
          </div>

          <div class="channel-meter">
            @for (level of masterMetering(); track $index) {
              <div class="meter-bar">
                <div class="meter-fill" [style.height.%]="level * 100"></div>
              </div>
            }
          </div>

          <div class="channel-fader">
            <input
              type="range"
              orient="vertical"
              min="0"
              max="100"
              [value]="masterVolume() * 100"
              (input)="onMasterVolumeChange($event)"
              class="fader-input"
            />
            <span class="fader-value">{{ (masterVolume() * 100) | number:'1.0-0' }}%</span>
          </div>

          <div class="channel-controls">
            <button
              mat-mini-fab
              [color]="masterMuted() ? 'warn' : 'primary'"
              (click)="toggleMasterMute()"
              matTooltip="Mute Master"
            >
              <mat-icon>{{ masterMuted() ? 'volume_off' : 'volume_up' }}</mat-icon>
            </button>
          </div>
        </div>

        <!-- Audio Tracks -->
        @for (track of audioTracks(); track track.id) {
          <div class="mixer-channel" [class.muted]="track.muted" [class.solo]="track.solo">
            <div class="channel-header">
              <span class="channel-name" [title]="track.name">{{ track.name }}</span>
              <button mat-icon-button [matMenuTriggerFor]="trackMenu" class="btn-channel-menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #trackMenu="matMenu">
                <button mat-menu-item (click)="openTrackMenu(track.id)">
                  <mat-icon>edit</mat-icon>
                  <span>Rename</span>
                </button>
                <button mat-menu-item (click)="duplicateTrack(track.id)">
                  <mat-icon>content_copy</mat-icon>
                  <span>Duplicate</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="deleteTrack(track.id)">
                  <mat-icon color="warn">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>

            <div class="channel-meter">
              @for (level of getTrackMetering(track.id); track $index) {
                <div class="meter-bar">
                  <div
                    class="meter-fill"
                    [style.height.%]="level * 100"
                    [class.peak]="level > 0.9"
                    [class.hot]="level > 0.7"
                  ></div>
                </div>
              }
            </div>

            <div class="channel-fader">
              <input
                type="range"
                orient="vertical"
                min="0"
                max="100"
                [value]="track.volume * 100"
                (input)="onTrackVolumeChange(track.id, $event)"
                [disabled]="track.muted"
                class="fader-input"
              />
              <span class="fader-value">{{ (track.volume * 100) | number:'1.0-0' }}%</span>
            </div>

            <div class="channel-pan">
              <input
                type="range"
                min="-100"
                max="100"
                [value]="track.pan * 100"
                (input)="onTrackPanChange(track.id, $event)"
                class="pan-input"
              />
              <span class="pan-value">
                {{ track.pan === 0 ? 'C' : (track.pan > 0 ? 'R' : 'L') + (Math.abs(track.pan * 100) | number:'1.0-0') }}
              </span>
            </div>

            <div class="channel-controls">
              <button
                mat-mini-fab
                [color]="track.solo ? 'warn' : ''"
                (click)="toggleSolo(track.id)"
                matTooltip="Solo"
                class="ctrl-btn"
              >
                S
              </button>
              <button
                mat-mini-fab
                [color]="track.muted ? 'warn' : ''"
                (click)="toggleMute(track.id)"
                matTooltip="Mute"
                class="ctrl-btn"
              >
                M
              </button>
              <button
                mat-mini-fab
                [color]="track.monitoring !== 'none' ? 'accent' : ''"
                (click)="cycleMonitoring(track.id)"
                [matTooltip]="getMonitoringLabel(track.monitoring)"
                class="ctrl-btn"
              >
                <mat-icon>{{ getMonitoringMatIcon(track.monitoring) }}</mat-icon>
              </button>
            </div>

            @if (track.filters.length > 0) {
              <mat-chip-set class="channel-filters">
                @for (filter of track.filters; track filter.id) {
                  <mat-chip
                    [highlighted]="filter.enabled"
                    [matTooltip]="filter.name"
                  >
                    <mat-icon>{{ getFilterMatIcon(filter.type) }}</mat-icon>
                  </mat-chip>
                }
              </mat-chip-set>
            }
          </div>
        }

        <!-- Add Track Button -->
        <div class="mixer-add-track">
          <button mat-raised-button color="primary" (click)="addTrack()" class="btn-add-track">
            <mat-icon>add</mat-icon>
            Add Track
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .audio-mixer {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      color: #fff;
    }

    .mixer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #111;
      border-bottom: 1px solid #333;
    }

    .mixer-header h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
    }

    .btn-settings {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      transition: color 0.2s;
    }

    .btn-settings:hover {
      color: #fff;
    }

    .mixer-content {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      overflow-x: auto;
      overflow-y: hidden;
      flex: 1;
    }

    .mixer-channel {
      display: flex;
      flex-direction: column;
      min-width: 80px;
      background: #252525;
      border-radius: 6px;
      padding: 0.5rem;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .mixer-channel.master {
      background: #2a2a2a;
      border: 2px solid #2a7fff;
    }

    .mixer-channel.muted {
      opacity: 0.5;
    }

    .mixer-channel.solo {
      border: 2px solid #ffa500;
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.25rem;
    }

    .channel-name {
      font-size: 0.75rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .btn-channel-menu {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      transition: color 0.2s;
    }

    .btn-channel-menu:hover {
      color: #fff;
    }

    .channel-meter {
      display: flex;
      gap: 2px;
      height: 120px;
      align-items: flex-end;
    }

    .meter-bar {
      flex: 1;
      background: #0a0a0a;
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }

    .meter-fill {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: linear-gradient(to top, #0f0 0%, #ff0 70%, #f00 90%);
      transition: height 0.1s ease-out;
    }

    .meter-fill.hot {
      background: linear-gradient(to top, #ff0 0%, #f00 100%);
    }

    .meter-fill.peak {
      background: #f00;
    }

    .channel-fader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0;
    }

    .fader-input {
      writing-mode: bt-lr;
      -webkit-appearance: slider-vertical;
      width: 24px;
      height: 100px;
      background: #0a0a0a;
      border-radius: 12px;
      outline: none;
    }

    .fader-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 8px;
      background: #2a7fff;
      border-radius: 2px;
      cursor: pointer;
    }

    .fader-value {
      font-size: 0.7rem;
      color: #888;
      font-family: 'Courier New', monospace;
    }

    .channel-pan {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .pan-input {
      width: 100%;
      height: 4px;
      background: #0a0a0a;
      border-radius: 2px;
      outline: none;
    }

    .pan-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      background: #2a7fff;
      border-radius: 50%;
      cursor: pointer;
    }

    .pan-value {
      font-size: 0.65rem;
      color: #888;
      font-family: 'Courier New', monospace;
    }

    .channel-controls {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    .btn-solo,
    .btn-mute,
    .btn-monitoring {
      flex: 1;
      padding: 0.35rem;
      background: #333;
      border: 1px solid #444;
      border-radius: 3px;
      color: #888;
      cursor: pointer;
      font-size: 0.7rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-solo:hover,
    .btn-mute:hover,
    .btn-monitoring:hover {
      background: #444;
      color: #fff;
    }

    .btn-solo.active {
      background: #ffa500;
      border-color: #ffa500;
      color: #000;
    }

    .btn-mute.active {
      background: #dc3545;
      border-color: #dc3545;
      color: #fff;
    }

    .btn-monitoring.active {
      background: #28a745;
      border-color: #28a745;
      color: #fff;
    }

    .channel-filters {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      padding-top: 0.25rem;
      border-top: 1px solid #333;
    }

    .filter-indicator {
      padding: 0.2rem 0.4rem;
      background: #333;
      border-radius: 3px;
      font-size: 0.7rem;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .filter-indicator.active {
      opacity: 1;
      background: #2a7fff;
    }

    .mixer-add-track {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 80px;
    }

    .btn-add-track {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #252525;
      border: 2px dashed #444;
      border-radius: 6px;
      color: #888;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .btn-add-track:hover {
      background: #2a2a2a;
      border-color: #2a7fff;
      color: #2a7fff;
    }

    .btn-add-track span:first-child {
      font-size: 1.5rem;
    }

    /* Scrollbar */
    .mixer-content::-webkit-scrollbar {
      height: 8px;
    }

    .mixer-content::-webkit-scrollbar-track {
      background: #0d0d0d;
    }

    .mixer-content::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 4px;
    }
  `]
})
export class AudioMixerComponent {
  Math = Math; // Expose Math to template

  // Signals for UI state
  private meteringIntervalId: number | null = null;
  private meteringDataSignal = signal<Map<string, number[]>>(new Map());

  // Computed signals from service
  readonly audioTracks = computed(() => {
    const mixer = this.audioService.mixer();
    return mixer?.tracks || [];
  });

  readonly masterVolume = computed(() => {
    const mixer = this.audioService.mixer();
    return mixer?.masterVolume || 1;
  });

  readonly masterMuted = computed(() => {
    const mixer = this.audioService.mixer();
    return mixer?.masterMuted || false;
  });

  readonly masterMetering = computed(() => {
    return this.meteringDataSignal().get('master') || [0, 0];
  });

  constructor(public audioService: AudioService) {
    // Initialize mixer if not exists
    if (!this.audioService.mixer()) {
      this.audioService.initializeMixer();
    }

    // Start metering updates
    this.startMeteringUpdates();

    // Cleanup
    effect((onCleanup) => {
      onCleanup(() => {
        this.stopMeteringUpdates();
      });
    });
  }

  onMasterVolumeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber / 100;
    this.audioService.setMasterVolume(value);
  }

  toggleMasterMute(): void {
    if (this.masterMuted()) {
      this.audioService.unmuteMaster();
    } else {
      this.audioService.muteMaster();
    }
  }

  onTrackVolumeChange(trackId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber / 100;
    this.audioService.setTrackVolume(trackId, value);
  }

  onTrackPanChange(trackId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber / 100;
    this.audioService.setTrackPan(trackId, value);
  }

  toggleMute(trackId: string): void {
    const track = this.audioTracks().find((t) => t.id === trackId);
    if (!track) return;

    if (track.muted) {
      this.audioService.unmuteTrack(trackId);
    } else {
      this.audioService.muteTrack(trackId);
    }
  }

  toggleSolo(trackId: string): void {
    this.audioService.soloTrack(trackId);
  }

  cycleMonitoring(trackId: string): void {
    const track = this.audioTracks().find((t) => t.id === trackId);
    if (!track) return;

    const next: Record<MonitoringType, MonitoringType> = {
      [MonitoringType.NONE]: MonitoringType.MONITOR_ONLY,
      [MonitoringType.MONITOR_ONLY]: MonitoringType.MONITOR_AND_OUTPUT,
      [MonitoringType.MONITOR_AND_OUTPUT]: MonitoringType.NONE
    };

    this.audioService.setTrackMonitoring(trackId, next[track.monitoring]);
  }

  getMonitoringLabel(type: MonitoringType): string {
    const labels: Record<MonitoringType, string> = {
      [MonitoringType.NONE]: 'No Monitoring',
      [MonitoringType.MONITOR_ONLY]: 'Monitor Only',
      [MonitoringType.MONITOR_AND_OUTPUT]: 'Monitor & Output'
    };
    return labels[type];
  }

  getMonitoringIcon(type: MonitoringType): string {
    const icons: Record<MonitoringType, string> = {
      [MonitoringType.NONE]: '◯',
      [MonitoringType.MONITOR_ONLY]: '◐',
      [MonitoringType.MONITOR_AND_OUTPUT]: '●'
    };
    return icons[type];
  }

  getMonitoringMatIcon(type: MonitoringType): string {
    const icons: Record<MonitoringType, string> = {
      [MonitoringType.NONE]: 'headset_off',
      [MonitoringType.MONITOR_ONLY]: 'headset',
      [MonitoringType.MONITOR_AND_OUTPUT]: 'headset_mic'
    };
    return icons[type];
  }

  getFilterIcon(type: AudioFilterType): string {
    const icons: Record<AudioFilterType, string> = {
      [AudioFilterType.NOISE_SUPPRESSION]: '🔇',
      [AudioFilterType.NOISE_GATE]: '🚪',
      [AudioFilterType.COMPRESSOR]: '⚡',
      [AudioFilterType.LIMITER]: '🚫',
      [AudioFilterType.EXPANDER]: '📈',
      [AudioFilterType.GAIN]: '📊',
      [AudioFilterType.EQ]: '🎚️',
      [AudioFilterType.REVERB]: '🌊',
      [AudioFilterType.DELAY]: '⏱️',
      [AudioFilterType.VST]: '🔌'
    };
    return icons[type] || '🎛️';
  }

  getFilterMatIcon(type: AudioFilterType): string {
    const icons: Record<AudioFilterType, string> = {
      [AudioFilterType.NOISE_SUPPRESSION]: 'noise_control_off',
      [AudioFilterType.NOISE_GATE]: 'door_back',
      [AudioFilterType.COMPRESSOR]: 'compress',
      [AudioFilterType.LIMITER]: 'block',
      [AudioFilterType.EXPANDER]: 'expand',
      [AudioFilterType.GAIN]: 'trending_up',
      [AudioFilterType.EQ]: 'equalizer',
      [AudioFilterType.REVERB]: 'waves',
      [AudioFilterType.DELAY]: 'schedule',
      [AudioFilterType.VST]: 'settings_input_component'
    };
    return icons[type] || 'tune';
  }

  duplicateTrack(trackId: string): void {
    console.log(`Duplicating track ${trackId}`);
    // Implementation would be in the service
  }

  deleteTrack(trackId: string): void {
    this.audioService.deleteAudioTrack(trackId);
  }

  getTrackMetering(trackId: string): number[] {
    return this.meteringDataSignal().get(trackId) || [0, 0];
  }

  addTrack(): void {
    const trackNumber = this.audioTracks().length + 1;
    this.audioService.createAudioTrack(`Track ${trackNumber}`, []);
  }

  async openTrackMenu(trackId: string): Promise<void> {
    // Lazy load dialog service
    const { DialogService } = await import('../ui-dialog/dialog.service');
    const dialog = new DialogService();

    const track = this.audioTracks().find(t => t.id === trackId);
    if (!track) return;

    const result = await dialog.show({
      title: `Track Options: ${track.name}`,
      message: 'What would you like to do with this track?',
      buttons: [
        { label: 'Rename', value: 'rename' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Delete', value: 'delete', variant: 'danger' },
        { label: 'Cancel', value: 'cancel', variant: 'secondary' }
      ]
    });

    switch (result) {
      case 'rename':
        const newName = await dialog.prompt('Rename Track', 'Enter new name:', track.name);
        if (newName) {
          console.log(`Renaming track ${trackId} to ${newName}`);
        }
        break;
      case 'duplicate':
        console.log(`Duplicating track ${trackId}`);
        break;
      case 'delete':
        const confirmed = await dialog.confirm('Delete Track', `Are you sure you want to delete "${track.name}"?`);
        if (confirmed) {
          this.audioService.deleteAudioTrack(trackId);
        }
        break;
    }
  }

  async openAudioSettings(): Promise<void> {
    // Lazy load dialog service
    const { DialogService } = await import('../ui-dialog/dialog.service');
    const dialog = new DialogService();

    await dialog.info(
      'Audio Settings',
      'Advanced audio settings:\n\n' +
      '• Sample rate configuration\n' +
      '• Buffer size settings\n' +
      '• Audio device selection\n' +
      '• VST plugin management\n' +
      '• Audio processing chain'
    );
  }

  private startMeteringUpdates(): void {
    this.meteringIntervalId = window.setInterval(() => {
      const newMetering = new Map<string, number[]>();

      // Master metering
      newMetering.set('master', [
        Math.random() * this.masterVolume(),
        Math.random() * this.masterVolume()
      ]);

      // Track metering
      this.audioTracks().forEach((track) => {
        if (!track.muted) {
          newMetering.set(track.id, [
            Math.random() * track.volume,
            Math.random() * track.volume
          ]);
        } else {
          newMetering.set(track.id, [0, 0]);
        }
      });

      this.meteringDataSignal.set(newMetering);
    }, 50); // 20 FPS metering updates
  }

  private stopMeteringUpdates(): void {
    if (this.meteringIntervalId) {
      clearInterval(this.meteringIntervalId);
      this.meteringIntervalId = null;
    }
  }
}
