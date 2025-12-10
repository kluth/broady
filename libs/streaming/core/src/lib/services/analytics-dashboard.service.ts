import { Injectable, signal, computed } from '@angular/core';

export interface ViewerData {
  timestamp: Date;
  viewers: number;
  chatMessages: number;
  followers: number;
  subscribers: number;
}

export interface StreamSession {
  id: string;
  title: string;
  game?: string;
  startTime: Date;
  endTime?: Date;
  peakViewers: number;
  averageViewers: number;
  totalViews: number;
  chatMessages: number;
  newFollowers: number;
  newSubscribers: number;
  donations: number;
  duration: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface AnalyticsMetrics {
  totalStreams: number;
  totalStreamTime: number;
  totalViewers: number;
  averageViewers: number;
  peakViewers: number;
  totalFollowers: number;
  totalSubscribers: number;
  totalDonations: number;
  chatEngagement: number;
  viewerRetention: number;
  averageSessionLength: number;
}

export interface PeakTime {
  hour: number;
  dayOfWeek: number;
  averageViewers: number;
}

export interface ContentPerformance {
  game: string;
  streams: number;
  averageViewers: number;
  peakViewers: number;
  totalViews: number;
  engagement: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDashboardService {
  readonly viewerHistory = signal<ViewerData[]>([]);
  readonly streamSessions = signal<StreamSession[]>([]);
  readonly currentSession = signal<StreamSession | null>(null);
  
  readonly metrics = signal<AnalyticsMetrics>({
    totalStreams: 0,
    totalStreamTime: 0,
    totalViewers: 0,
    averageViewers: 0,
    peakViewers: 0,
    totalFollowers: 0,
    totalSubscribers: 0,
    totalDonations: 0,
    chatEngagement: 0,
    viewerRetention: 0,
    averageSessionLength: 0
  });

  readonly peakTimes = signal<PeakTime[]>([]);
  readonly contentPerformance = signal<ContentPerformance[]>([]);

  // Real-time current stream stats
  readonly currentViewers = signal(0);
  readonly currentChatRate = signal(0);
  
  // Computed analytics
  readonly growthRate = computed(() => {
    const sessions = this.streamSessions();
    if (sessions.length < 2) return 0;
    
    const recent = sessions.slice(0, 5);
    const older = sessions.slice(5, 10);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.averageViewers, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.averageViewers, 0) / (older.length || 1);
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  });

  readonly topPerformingContent = computed(() => {
    return this.contentPerformance()
      .sort((a, b) => b.averageViewers - a.averageViewers)
      .slice(0, 5);
  });

  readonly bestStreamingTimes = computed(() => {
    return this.peakTimes()
      .sort((a, b) => b.averageViewers - a.averageViewers)
      .slice(0, 3);
  });

  private monitoringInterval?: ReturnType<typeof setInterval>;

  startSession(title: string, game?: string): void {
    const session: StreamSession = {
      id: crypto.randomUUID(),
      title,
      game,
      startTime: new Date(),
      peakViewers: 0,
      averageViewers: 0,
      totalViews: 0,
      chatMessages: 0,
      newFollowers: 0,
      newSubscribers: 0,
      donations: 0,
      duration: 0,
      quality: 'excellent'
    };

    this.currentSession.set(session);
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateSessionMetrics();
      this.recordViewerData();
    }, 10000); // Every 10 seconds
  }

  private updateSessionMetrics(): void {
    const session = this.currentSession();
    if (!session) return;

    // Simulate viewer data
    const viewers = Math.floor(Math.random() * 200) + 50;
    const chatRate = Math.floor(Math.random() * 20) + 5;

    this.currentViewers.set(viewers);
    this.currentChatRate.set(chatRate);

    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    const history = this.viewerHistory();
    const avgViewers = history.length > 0
      ? history.reduce((sum, d) => sum + d.viewers, 0) / history.length
      : viewers;

    this.currentSession.update(s => s ? {
      ...s,
      duration,
      peakViewers: Math.max(s.peakViewers, viewers),
      averageViewers: Math.floor(avgViewers),
      totalViews: s.totalViews + viewers,
      chatMessages: s.chatMessages + chatRate
    } : null);
  }

  private recordViewerData(): void {
    const data: ViewerData = {
      timestamp: new Date(),
      viewers: this.currentViewers(),
      chatMessages: this.currentChatRate(),
      followers: this.metrics().totalFollowers,
      subscribers: this.metrics().totalSubscribers
    };

    this.viewerHistory.update(h => [...h, data].slice(-360)); // Keep last hour (6 per minute)
  }

  endSession(): void {
    const session = this.currentSession();
    if (!session) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const finalSession: StreamSession = {
      ...session,
      endTime: new Date(),
      quality: this.calculateQuality(session)
    };

    this.streamSessions.update(s => [finalSession, ...s]);
    this.currentSession.set(null);
    this.updateMetrics(finalSession);
    this.analyzePeakTimes(finalSession);
    this.updateContentPerformance(finalSession);
    this.viewerHistory.set([]);
  }

  private calculateQuality(session: StreamSession): StreamSession['quality'] {
    const score = session.averageViewers / Math.max(session.peakViewers, 1) * 100;
    if (score >= 75) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private updateMetrics(session: StreamSession): void {
    this.metrics.update(m => ({
      totalStreams: m.totalStreams + 1,
      totalStreamTime: m.totalStreamTime + session.duration,
      totalViewers: m.totalViewers + session.totalViews,
      averageViewers: Math.floor((m.totalViewers + session.totalViews) / (m.totalStreams + 1)),
      peakViewers: Math.max(m.peakViewers, session.peakViewers),
      totalFollowers: m.totalFollowers + session.newFollowers,
      totalSubscribers: m.totalSubscribers + session.newSubscribers,
      totalDonations: m.totalDonations + session.donations,
      chatEngagement: session.chatMessages > 0 ? (session.chatMessages / session.duration) * 60 : m.chatEngagement,
      viewerRetention: (session.averageViewers / Math.max(session.peakViewers, 1)) * 100,
      averageSessionLength: Math.floor((m.totalStreamTime + session.duration) / (m.totalStreams + 1))
    }));
  }

  private analyzePeakTimes(session: StreamSession): void {
    const hour = session.startTime.getHours();
    const day = session.startTime.getDay();

    const existing = this.peakTimes().find(p => p.hour === hour && p.dayOfWeek === day);

    if (existing) {
      this.peakTimes.update(times =>
        times.map(t => 
          t.hour === hour && t.dayOfWeek === day
            ? { ...t, averageViewers: (t.averageViewers + session.averageViewers) / 2 }
            : t
        )
      );
    } else {
      this.peakTimes.update(times => [...times, {
        hour,
        dayOfWeek: day,
        averageViewers: session.averageViewers
      }]);
    }
  }

  private updateContentPerformance(session: StreamSession): void {
    if (!session.game) return;

    const existing = this.contentPerformance().find(c => c.game === session.game);

    if (existing) {
      this.contentPerformance.update(content =>
        content.map(c =>
          c.game === session.game
            ? {
                ...c,
                streams: c.streams + 1,
                averageViewers: Math.floor((c.averageViewers * c.streams + session.averageViewers) / (c.streams + 1)),
                peakViewers: Math.max(c.peakViewers, session.peakViewers),
                totalViews: c.totalViews + session.totalViews,
                engagement: (c.engagement + session.chatMessages / session.duration) / 2
              }
            : c
        )
      );
    } else {
      this.contentPerformance.update(content => [...content, {
        game: session.game!,
        streams: 1,
        averageViewers: session.averageViewers,
        peakViewers: session.peakViewers,
        totalViews: session.totalViews,
        engagement: session.chatMessages / session.duration
      }]);
    }
  }

  recordFollower(): void {
    const session = this.currentSession();
    if (session) {
      this.currentSession.update(s => s ? { ...s, newFollowers: s.newFollowers + 1 } : null);
    }
    this.metrics.update(m => ({ ...m, totalFollowers: m.totalFollowers + 1 }));
  }

  recordSubscriber(): void {
    const session = this.currentSession();
    if (session) {
      this.currentSession.update(s => s ? { ...s, newSubscribers: s.newSubscribers + 1 } : null);
    }
    this.metrics.update(m => ({ ...m, totalSubscribers: m.totalSubscribers + 1 }));
  }

  recordDonation(amount: number): void {
    const session = this.currentSession();
    if (session) {
      this.currentSession.update(s => s ? { ...s, donations: s.donations + amount } : null);
    }
    this.metrics.update(m => ({ ...m, totalDonations: m.totalDonations + amount }));
  }

  exportAnalytics(): string {
    return JSON.stringify({
      metrics: this.metrics(),
      sessions: this.streamSessions(),
      peakTimes: this.peakTimes(),
      contentPerformance: this.contentPerformance(),
      growthRate: this.growthRate(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  getSessionById(id: string): StreamSession | undefined {
    return this.streamSessions().find(s => s.id === id);
  }

  getSessionsInDateRange(start: Date, end: Date): StreamSession[] {
    return this.streamSessions().filter(s => 
      s.startTime >= start && s.startTime <= end
    );
  }

  clearHistory(): void {
    this.streamSessions.set([]);
    this.viewerHistory.set([]);
    this.peakTimes.set([]);
    this.contentPerformance.set([]);
  }
}
