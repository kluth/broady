import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SceneListComponent } from '@org/streaming-core';
import { StreamingControlsComponent } from '@org/streaming-core';
  StreamingControlsComponent,
  VideoPreviewComponent,
  AudioMixerComponent,
} from '@org/streaming-core';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    SceneListComponent,
    StreamingControlsComponent,
    VideoPreviewComponent,
    AudioMixerComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'OBS Studio - Built with Angular 20';
}
