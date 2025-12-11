import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'streaming-stats-dashboard',
  imports: [],
  templateUrl: './stats-dashboard.html',
  styleUrl: './stats-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDashboard {}
