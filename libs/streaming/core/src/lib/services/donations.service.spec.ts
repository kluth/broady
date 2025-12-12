import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DonationsService, Donation, DonationGoal } from './donations.service';

describe('DonationsService', () => {
  let service: DonationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DonationsService]
    });
    service = TestBed.inject(DonationsService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty donations', () => {
      expect(service.donations()).toEqual([]);
    });

    it('should initialize with empty pending alerts', () => {
      expect(service.pendingAlerts()).toEqual([]);
    });

    it('should initialize with empty goals', () => {
      expect(service.goals()).toEqual([]);
    });

    it('should initialize with default statistics', () => {
      const stats = service.statistics();
      expect(stats.totalDonations).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.averageDonation).toBe(0);
      expect(stats.topDonation).toBe(0);
      expect(stats.topDonor).toBe('');
      expect(stats.donationsToday).toBe(0);
      expect(stats.amountToday).toBe(0);
    });

    it('should initialize with default settings', () => {
      const settings = service.settings();
      expect(settings.minAmount).toBe(1);
      expect(settings.showAlerts).toBe(true);
      expect(settings.alertDuration).toBe(5000);
      expect(settings.playSound).toBe(true);
      expect(settings.soundFile).toBe('/assets/sounds/donation.mp3');
      expect(settings.currency).toBe('USD');
    });

    it('should initialize with all platforms disconnected', () => {
      const platforms = service.platforms();
      expect(platforms.streamelements.connected).toBe(false);
      expect(platforms.streamlabs.connected).toBe(false);
      expect(platforms.kofi.connected).toBe(false);
      expect(platforms.patreon.connected).toBe(false);
      expect(platforms.stripe.connected).toBe(false);
    });
  });

  describe('Process Donation', () => {
    it('should process a donation', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'John Doe',
        message: 'Great stream!',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const donations = service.donations();
      expect(donations.length).toBe(1);
      expect(donations[0].amount).toBe(10.00);
      expect(donations[0].donorName).toBe('John Doe');
      expect(donations[0].processed).toBe(true);
    });

    it('should generate unique ID for donation', () => {
      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamlabs'
      });

      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor 2',
        timestamp: new Date(),
        platform: 'streamlabs'
      });

      const donations = service.donations();
      expect(donations[0].id).toBeDefined();
      expect(donations[1].id).toBeDefined();
      expect(donations[0].id).not.toBe(donations[1].id);
    });

    it('should add donations to beginning of list', () => {
      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'First',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Second',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const donations = service.donations();
      expect(donations[0].donorName).toBe('Second');
      expect(donations[1].donorName).toBe('First');
    });

    it('should update statistics when processing donation', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.totalDonations).toBe(1);
      expect(stats.totalAmount).toBe(10.00);
      expect(stats.averageDonation).toBe(10.00);
    });

    it('should create alert when showAlerts is true', () => {
      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const alerts = service.pendingAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].donation.amount).toBe(5.00);
      expect(alerts[0].shown).toBe(false);
    });

    it('should not create alert when showAlerts is false', () => {
      (service.settings as any).update((s: any) => ({ ...s, showAlerts: false }));

      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const alerts = service.pendingAlerts();
      expect(alerts.length).toBe(0);
    });

    it('should handle donation without message', () => {
      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const donation = service.donations()[0];
      expect(donation.message).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should calculate total donations correctly', () => {
      for (let i = 0; i < 5; i++) {
        service.processDonation({
          amount: 10.00,
          currency: 'USD',
          donorName: `Donor ${i}`,
          timestamp: new Date(),
          platform: 'streamelements'
        });
      }

      const stats = service.statistics();
      expect(stats.totalDonations).toBe(5);
    });

    it('should calculate total amount correctly', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 25.50,
        currency: 'USD',
        donorName: 'Donor 2',
        timestamp: new Date(),
        platform: 'streamlabs'
      });

      const stats = service.statistics();
      expect(stats.totalAmount).toBe(35.50);
    });

    it('should calculate average donation correctly', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 20.00,
        currency: 'USD',
        donorName: 'Donor 2',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 30.00,
        currency: 'USD',
        donorName: 'Donor 3',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.averageDonation).toBe(20.00);
    });

    it('should track top donation', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 50.00,
        currency: 'USD',
        donorName: 'Big Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor 3',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.topDonation).toBe(50.00);
      expect(stats.topDonor).toBe('Big Donor');
    });

    it('should track donations today', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Today Donor',
        timestamp: today,
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 15.00,
        currency: 'USD',
        donorName: 'Yesterday Donor',
        timestamp: yesterday,
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.donationsToday).toBe(1);
      expect(stats.amountToday).toBe(10.00);
    });
  });

  describe('Donation Alerts', () => {
    it('should create alert with correct duration', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const alert = service.pendingAlerts()[0];
      expect(alert.duration).toBe(5000); // Default alert duration
    });

    it('should mark alert as shown when dismissed', () => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const alertId = service.pendingAlerts()[0].id;
      service.dismissAlert(alertId);

      const alert = service.pendingAlerts()[0];
      expect(alert.shown).toBe(true);
    });

    it('should remove alert after delay when dismissed', fakeAsync(() => {
      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const alertId = service.pendingAlerts()[0].id;
      expect(service.pendingAlerts().length).toBe(1);

      service.dismissAlert(alertId);
      tick(500);

      expect(service.pendingAlerts().length).toBe(0);
    }));

    it('should handle multiple pending alerts', () => {
      for (let i = 0; i < 3; i++) {
        service.processDonation({
          amount: 5.00,
          currency: 'USD',
          donorName: `Donor ${i}`,
          timestamp: new Date(),
          platform: 'streamelements'
        });
      }

      expect(service.pendingAlerts().length).toBe(3);
    });

    it('should not affect other alerts when dismissing one', fakeAsync(() => {
      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor 2',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const firstAlertId = service.pendingAlerts()[0].id;

      service.dismissAlert(firstAlertId);
      tick(500);

      expect(service.pendingAlerts().length).toBe(1);
      expect(service.pendingAlerts()[0].donation.donorName).toBe('Donor 1');
    }));
  });

  describe('Donation Goals', () => {
    it('should create a donation goal', () => {
      service.createGoal('New PC', 1000, 'USD');

      const goals = service.goals();
      expect(goals.length).toBe(1);
      expect(goals[0].title).toBe('New PC');
      expect(goals[0].target).toBe(1000);
      expect(goals[0].currency).toBe('USD');
      expect(goals[0].current).toBe(0);
      expect(goals[0].completed).toBe(false);
    });

    it('should update goals when processing donations', () => {
      service.createGoal('Test Goal', 100);

      service.processDonation({
        amount: 50.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const goal = service.goals()[0];
      expect(goal.current).toBe(50.00);
      expect(goal.completed).toBe(false);
    });

    it('should mark goal as completed when target reached', () => {
      service.createGoal('Test Goal', 100);

      service.processDonation({
        amount: 120.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const goal = service.goals()[0];
      expect(goal.current).toBe(120.00);
      expect(goal.completed).toBe(true);
    });

    it('should not update completed goals', () => {
      service.createGoal('Test Goal', 100);

      service.processDonation({
        amount: 100.00,
        currency: 'USD',
        donorName: 'Donor 1',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const goalBefore = service.goals()[0];
      expect(goalBefore.completed).toBe(true);
      expect(goalBefore.current).toBe(100.00);

      service.processDonation({
        amount: 50.00,
        currency: 'USD',
        donorName: 'Donor 2',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const goalAfter = service.goals()[0];
      expect(goalAfter.current).toBe(100.00); // Unchanged
    });

    it('should update multiple goals simultaneously', () => {
      service.createGoal('Goal 1', 100);
      service.createGoal('Goal 2', 200);

      service.processDonation({
        amount: 50.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const goals = service.goals();
      expect(goals[0].current).toBe(50.00);
      expect(goals[1].current).toBe(50.00);
    });

    it('should delete a goal', () => {
      service.createGoal('Goal 1', 100);
      service.createGoal('Goal 2', 200);

      const goalId = service.goals()[0].id;
      service.deleteGoal(goalId);

      const goals = service.goals();
      expect(goals.length).toBe(1);
      expect(goals[0].title).toBe('Goal 2');
    });

    it('should use default currency when not specified', () => {
      service.createGoal('Test Goal', 500);

      const goal = service.goals()[0];
      expect(goal.currency).toBe('USD');
    });
  });

  describe('Platform Connections', () => {
    it('should connect to StreamElements', () => {
      service.connectStreamElements('test-token-123');

      const platform = service.platforms().streamelements;
      expect(platform.enabled).toBe(true);
      expect(platform.token).toBe('test-token-123');
      expect(platform.connected).toBe(true);
    });

    it('should connect to Streamlabs', () => {
      service.connectStreamlabs('streamlabs-token');

      const platform = service.platforms().streamlabs;
      expect(platform.enabled).toBe(true);
      expect(platform.token).toBe('streamlabs-token');
      expect(platform.connected).toBe(true);
    });

    it('should connect to Ko-fi', () => {
      service.connectKofi('kofi-token');

      const platform = service.platforms().kofi;
      expect(platform.enabled).toBe(true);
      expect(platform.token).toBe('kofi-token');
      expect(platform.connected).toBe(true);
    });

    it('should connect multiple platforms simultaneously', () => {
      service.connectStreamElements('se-token');
      service.connectStreamlabs('sl-token');
      service.connectKofi('kofi-token');

      const platforms = service.platforms();
      expect(platforms.streamelements.connected).toBe(true);
      expect(platforms.streamlabs.connected).toBe(true);
      expect(platforms.kofi.connected).toBe(true);
    });
  });

  describe('Test Donation', () => {
    it('should process test donation', () => {
      service.testDonation();

      const donations = service.donations();
      expect(donations.length).toBe(1);
      expect(donations[0].amount).toBe(5.00);
      expect(donations[0].donorName).toBe('Test Donor');
      expect(donations[0].message).toContain('test donation');
    });

    it('should create alert for test donation', () => {
      service.testDonation();

      const alerts = service.pendingAlerts();
      expect(alerts.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount donation', () => {
      service.processDonation({
        amount: 0,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.totalAmount).toBe(0);
    });

    it('should handle very large donation', () => {
      service.processDonation({
        amount: 1000000.00,
        currency: 'USD',
        donorName: 'Whale Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.topDonation).toBe(1000000.00);
    });

    it('should handle donations with decimal precision', () => {
      service.processDonation({
        amount: 4.99,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const stats = service.statistics();
      expect(stats.totalAmount).toBe(4.99);
    });

    it('should handle dismissing non-existent alert', () => {
      expect(() => service.dismissAlert('non-existent-id')).not.toThrow();
    });

    it('should handle deleting non-existent goal', () => {
      expect(() => service.deleteGoal('non-existent-id')).not.toThrow();
    });

    it('should handle rapid consecutive donations', () => {
      for (let i = 0; i < 100; i++) {
        service.processDonation({
          amount: 1.00,
          currency: 'USD',
          donorName: `Donor ${i}`,
          timestamp: new Date(),
          platform: 'streamelements'
        });
      }

      const stats = service.statistics();
      expect(stats.totalDonations).toBe(100);
      expect(stats.totalAmount).toBe(100.00);
    });

    it('should maintain donation order', () => {
      const timestamps = [new Date(), new Date(), new Date()];

      service.processDonation({
        amount: 5.00,
        currency: 'USD',
        donorName: 'First',
        timestamp: timestamps[0],
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Second',
        timestamp: timestamps[1],
        platform: 'streamelements'
      });

      service.processDonation({
        amount: 15.00,
        currency: 'USD',
        donorName: 'Third',
        timestamp: timestamps[2],
        platform: 'streamelements'
      });

      const donations = service.donations();
      expect(donations[0].donorName).toBe('Third');
      expect(donations[1].donorName).toBe('Second');
      expect(donations[2].donorName).toBe('First');
    });
  });

  describe('Signal Reactivity', () => {
    it('should update donations signal', () => {
      expect(service.donations().length).toBe(0);

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      expect(service.donations().length).toBe(1);
    });

    it('should update statistics signal', () => {
      const initialStats = service.statistics();
      expect(initialStats.totalDonations).toBe(0);

      service.processDonation({
        amount: 10.00,
        currency: 'USD',
        donorName: 'Donor',
        timestamp: new Date(),
        platform: 'streamelements'
      });

      const updatedStats = service.statistics();
      expect(updatedStats.totalDonations).toBe(1);
    });

    it('should update goals signal', () => {
      expect(service.goals().length).toBe(0);

      service.createGoal('Test', 100);

      expect(service.goals().length).toBe(1);
    });

    it('should update platforms signal', () => {
      const before = service.platforms().streamelements.connected;
      expect(before).toBe(false);

      service.connectStreamElements('token');

      const after = service.platforms().streamelements.connected;
      expect(after).toBe(true);
    });
  });
});
