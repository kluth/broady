import { Injectable, signal } from '@angular/core';

export interface ScheduledStream {
  id: string;
  title: string;
  game?: string;
  description?: string;
  startTime: Date;
  duration: number;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
  };
  autoStart: boolean;
  notifications: {
    sendReminders: boolean;
    reminderTimes: number[];
    platforms: ('twitter' | 'discord' | 'email')[];
  };
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}

@Injectable({
  providedIn: 'root'
})
export class StreamSchedulerService {
  readonly scheduledStreams = signal<ScheduledStream[]>([]);
  readonly upcomingStream = signal<ScheduledStream | null>(null);

  scheduleStream(stream: Omit<ScheduledStream, 'id' | 'status'>): void {
    const newStream: ScheduledStream = {
      ...stream,
      id: crypto.randomUUID(),
      status: 'scheduled'
    };
    this.scheduledStreams.update(s => [...s, newStream]);
  }

  cancelStream(id: string): void {
    this.scheduledStreams.update(s =>
      s.map(stream => stream.id === id ? { ...stream, status: 'cancelled' as const } : stream)
    );
  }

  deleteScheduledStream(id: string): void {
    this.scheduledStreams.update(s => s.filter(stream => stream.id !== id));
  }
}
