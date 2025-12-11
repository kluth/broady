import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'streaming-settings-dialog',
  imports: [],
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialog {}
