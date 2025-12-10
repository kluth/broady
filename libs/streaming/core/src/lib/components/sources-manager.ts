import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'streaming-sources-manager',
  imports: [],
  templateUrl: './sources-manager.html',
  styleUrl: './sources-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcesManager {}
