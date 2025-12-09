import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SceneListComponent } from '@org/source/streaming-core';
import { StreamingControlsComponent } from '@org/source/streaming-core';

@Component({
  standalone: true,
  imports: [RouterModule, SceneListComponent, StreamingControlsComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'OBS Studio - Built with Angular 20';
}
