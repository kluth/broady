import { Injectable, signal } from '@angular/core';

/**
 * Donations Service
 * Integration with donation platforms (StreamElements, Streamlabs, Ko-fi, etc.)
 */

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  message?: string;
  timestamp: Date;
  platform: 'streamelements' | 'streamlabs' | 'kofi' | 'patreon' | 'stripe';
  processed: boolean;
}

export interface DonationGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  completed: boolean;
}

export interface DonationAlert {
  id: string;
  donation: Donation;
  shown: boolean;
  duration: number; // milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class DonationsService {
  readonly donations = signal<Donation[]>([]);
  readonly pendingAlerts = signal<DonationAlert[]>([]);
  readonly goals = signal<DonationGoal[]>([]);
  
  readonly statistics = signal({
    totalDonations: 0,
    totalAmount: 0,
    averageDonation: 0,
    topDonation: 0,
    topDonor: '',
    donationsToday: 0,
    amountToday: 0
  });

  readonly settings = signal({
    minAmount: 1,
    showAlerts: true,
    alertDuration: 5000,
    playSound: true,
    soundFile: '/assets/sounds/donation.mp3',
    currency: 'USD'
  });

  // Platform integrations
  readonly platforms = signal({
    streamelements: { enabled: false, token: '', connected: false },
    streamlabs: { enabled: false, token: '', connected: false },
    kofi: { enabled: false, token: '', connected: false },
    patreon: { enabled: false, clientId: '', connected: false },
    stripe: { enabled: false, apiKey: '', connected: false }
  });

  processDonation(donation: Omit<Donation, 'id' | 'processed'>): void {
    const newDonation: Donation = {
      ...donation,
      id: crypto.randomUUID(),
      processed: true
    };

    this.donations.update(d => [newDonation, ...d]);

    // Update statistics
    this.updateStatistics(newDonation);

    // Create alert
    if (this.settings().showAlerts) {
      this.createAlert(newDonation);
    }

    // Update goals
    this.updateGoals(newDonation.amount);

    console.log(`Donation processed: $${donation.amount} from ${donation.donorName}`);
  }

  private updateStatistics(donation: Donation): void {
    this.statistics.update(stats => {
      const total = stats.totalAmount + donation.amount;
      const count = stats.totalDonations + 1;
      const average = total / count;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = donation.timestamp >= today;

      return {
        totalDonations: count,
        totalAmount: total,
        averageDonation: average,
        topDonation: Math.max(stats.topDonation, donation.amount),
        topDonor: donation.amount > stats.topDonation ? donation.donorName : stats.topDonor,
        donationsToday: isToday ? stats.donationsToday + 1 : stats.donationsToday,
        amountToday: isToday ? stats.amountToday + donation.amount : stats.amountToday
      };
    });
  }

  private createAlert(donation: Donation): void {
    const alert: DonationAlert = {
      id: crypto.randomUUID(),
      donation,
      shown: false,
      duration: this.settings().alertDuration
    };

    this.pendingAlerts.update(a => [...a, alert]);

    // Play sound
    if (this.settings().playSound) {
      this.playAlertSound();
    }
  }

  private playAlertSound(): void {
    const audio = new Audio(this.settings().soundFile);
    audio.play().catch(err => console.error('Failed to play donation sound:', err));
  }

  dismissAlert(id: string): void {
    this.pendingAlerts.update(a =>
      a.map(alert => alert.id === id ? { ...alert, shown: true } : alert)
    );

    setTimeout(() => {
      this.pendingAlerts.update(a => a.filter(alert => alert.id !== id));
    }, 500);
  }

  // Donation Goals
  createGoal(title: string, target: number, currency: string = 'USD'): void {
    const goal: DonationGoal = {
      id: crypto.randomUUID(),
      title,
      target,
      current: 0,
      currency,
      startDate: new Date(),
      completed: false
    };

    this.goals.update(g => [...g, goal]);
  }

  private updateGoals(amount: number): void {
    this.goals.update(goals =>
      goals.map(goal => {
        if (goal.completed) return goal;

        const newCurrent = goal.current + amount;
        return {
          ...goal,
          current: newCurrent,
          completed: newCurrent >= goal.target
        };
      })
    );
  }

  deleteGoal(id: string): void {
    this.goals.update(g => g.filter(goal => goal.id !== id));
  }

  // Platform connections
  connectStreamElements(token: string): void {
    this.platforms.update(p => ({
      ...p,
      streamelements: { enabled: true, token, connected: true }
    }));
    console.log('StreamElements connected');
  }

  connectStreamlabs(token: string): void {
    this.platforms.update(p => ({
      ...p,
      streamlabs: { enabled: true, token, connected: true }
    }));
    console.log('Streamlabs connected');
  }

  connectKofi(token: string): void {
    this.platforms.update(p => ({
      ...p,
      kofi: { enabled: true, token, connected: true }
    }));
    console.log('Ko-fi connected');
  }

  // Test donation (for testing alerts)
  testDonation(): void {
    this.processDonation({
      amount: 5.00,
      currency: 'USD',
      donorName: 'Test Donor',
      message: 'This is a test donation! Great stream!',
      timestamp: new Date(),
      platform: 'streamelements'
    });
  }
}
