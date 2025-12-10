import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  SceneListComponent,
  StreamingControlsComponent,
  VideoPreviewComponent,
  AudioMixerComponent,
  SourcesManagerComponent,
  ChatIntegration,
  AlertsSystem,
  OverlaysManager,
  Multistream,
  StatsDashboardComponent,
  SettingsDialogComponent,
} from '@org/streaming-core';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    SceneListComponent,
    StreamingControlsComponent,
    VideoPreviewComponent,
    AudioMixerComponent,
    SourcesManagerComponent,
    ChatIntegration,
    AlertsSystem,
    OverlaysManager,
    Multistream,
    StatsDashboardComponent,
    SettingsDialogComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'OBS Studio - Built with Angular 20';
  protected activeTab = signal<'sources' | 'overlays' | 'multistream' | 'alerts' | 'chat' | 'stats'>('sources');
}
