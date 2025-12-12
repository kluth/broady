import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ViewerEngagementService, Poll, Prediction, UserPoints } from './viewer-engagement.service';

describe('ViewerEngagementService', () => {
  let service: ViewerEngagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewerEngagementService]
    });
    service = TestBed.inject(ViewerEngagementService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty polls', () => {
      expect(service.polls()).toEqual([]);
    });

    it('should initialize with empty predictions', () => {
      expect(service.predictions()).toEqual([]);
    });

    it('should initialize with no active poll', () => {
      expect(service.activePoll()).toBeNull();
    });

    it('should initialize with no active prediction', () => {
      expect(service.activePrediction()).toBeNull();
    });

    it('should initialize with default reward system settings', () => {
      const rewardSystem = service.rewardSystem();
      expect(rewardSystem.enabled).toBe(true);
      expect(rewardSystem.pointsPerMinute).toBe(10);
      expect(rewardSystem.pointsPerMessage).toBe(5);
      expect(rewardSystem.bonusMultiplier).toBe(1.5);
    });

    it('should initialize with empty leaderboard', () => {
      expect(service.leaderboard()).toEqual([]);
    });
  });

  describe('Poll Management', () => {
    it('should create a poll', () => {
      service.createPoll('Favorite game?', ['Game A', 'Game B', 'Game C'], 60);

      const polls = service.polls();
      expect(polls.length).toBe(1);
      expect(polls[0].question).toBe('Favorite game?');
      expect(polls[0].options.length).toBe(3);
      expect(polls[0].status).toBe('active');
      expect(polls[0].totalVotes).toBe(0);
    });

    it('should generate unique IDs for poll and options', () => {
      service.createPoll('Test', ['A', 'B'], 30);

      const poll = service.polls()[0];
      expect(poll.id).toBeDefined();
      expect(poll.options[0].id).toBeDefined();
      expect(poll.options[1].id).toBeDefined();
      expect(poll.options[0].id).not.toBe(poll.options[1].id);
    });

    it('should set poll as active', () => {
      service.createPoll('Test Poll', ['Yes', 'No'], 30);

      const activePoll = service.activePoll();
      expect(activePoll).not.toBeNull();
      expect(activePoll?.question).toBe('Test Poll');
    });

    it('should initialize options with zero votes and percentage', () => {
      service.createPoll('Test', ['A', 'B', 'C'], 30);

      const options = service.polls()[0].options;
      options.forEach(opt => {
        expect(opt.votes).toBe(0);
        expect(opt.percentage).toBe(0);
      });
    });

    it('should set start time and duration', () => {
      const beforeCreate = new Date();
      service.createPoll('Test', ['A', 'B'], 60);
      const afterCreate = new Date();

      const poll = service.polls()[0];
      expect(poll.startTime.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(poll.startTime.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(poll.duration).toBe(60);
    });

    it('should automatically end poll after duration', fakeAsync(() => {
      service.createPoll('Test', ['A', 'B'], 2); // 2 seconds

      let poll = service.polls()[0];
      expect(poll.status).toBe('active');

      tick(2000);

      poll = service.polls()[0];
      expect(poll.status).toBe('ended');
      expect(poll.endTime).toBeDefined();
    }));

    it('should clear active poll when it ends', fakeAsync(() => {
      service.createPoll('Test', ['A', 'B'], 1);

      expect(service.activePoll()).not.toBeNull();

      tick(1000);

      expect(service.activePoll()).toBeNull();
    }));
  });

  describe('Voting', () => {
    it('should register a vote', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];
      const optionId = poll.options[0].id;

      service.vote(poll.id, optionId);

      const updatedPoll = service.polls()[0];
      expect(updatedPoll.options[0].votes).toBe(1);
      expect(updatedPoll.totalVotes).toBe(1);
    });

    it('should calculate percentages correctly', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];
      const option1Id = poll.options[0].id;
      const option2Id = poll.options[1].id;

      service.vote(poll.id, option1Id);
      service.vote(poll.id, option1Id);
      service.vote(poll.id, option1Id);
      service.vote(poll.id, option2Id);

      const updatedPoll = service.polls()[0];
      expect(updatedPoll.options[0].percentage).toBe(75);
      expect(updatedPoll.options[1].percentage).toBe(25);
      expect(updatedPoll.totalVotes).toBe(4);
    });

    it('should handle multiple votes on same option', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];
      const optionId = poll.options[0].id;

      for (let i = 0; i < 10; i++) {
        service.vote(poll.id, optionId);
      }

      const updatedPoll = service.polls()[0];
      expect(updatedPoll.options[0].votes).toBe(10);
      expect(updatedPoll.totalVotes).toBe(10);
      expect(updatedPoll.options[0].percentage).toBe(100);
    });

    it('should not affect other polls when voting', () => {
      service.createPoll('Poll 1', ['A', 'B'], 30);
      service.createPoll('Poll 2', ['X', 'Y'], 30);

      const poll1 = service.polls()[0];
      const poll1OptionId = poll1.options[0].id;

      service.vote(poll1.id, poll1OptionId);

      const polls = service.polls();
      expect(polls[0].totalVotes).toBe(1);
      expect(polls[1].totalVotes).toBe(0);
    });

    it('should handle vote for non-existent poll gracefully', () => {
      expect(() => service.vote('non-existent', 'option-id')).not.toThrow();
    });

    it('should handle vote for non-existent option', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];

      service.vote(poll.id, 'non-existent-option');

      const updatedPoll = service.polls()[0];
      expect(updatedPoll.totalVotes).toBe(0);
    });
  });

  describe('End Poll', () => {
    it('should end a poll', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];

      service.endPoll(poll.id);

      const endedPoll = service.polls()[0];
      expect(endedPoll.status).toBe('ended');
      expect(endedPoll.endTime).toBeDefined();
    });

    it('should preserve vote data when ending poll', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];

      service.vote(poll.id, poll.options[0].id);
      service.vote(poll.id, poll.options[1].id);

      service.endPoll(poll.id);

      const endedPoll = service.polls()[0];
      expect(endedPoll.totalVotes).toBe(2);
    });

    it('should clear active poll when ending it', () => {
      service.createPoll('Test', ['A', 'B'], 30);
      const poll = service.polls()[0];

      expect(service.activePoll()).not.toBeNull();

      service.endPoll(poll.id);

      expect(service.activePoll()).toBeNull();
    });

    it('should not affect other polls when ending one', () => {
      service.createPoll('Poll 1', ['A', 'B'], 30);
      service.createPoll('Poll 2', ['X', 'Y'], 30);

      const poll1 = service.polls()[0];
      service.endPoll(poll1.id);

      const polls = service.polls();
      expect(polls[0].status).toBe('ended');
      expect(polls[1].status).toBe('active');
    });
  });

  describe('Predictions', () => {
    it('should create a prediction', () => {
      service.createPrediction('Will we win?', ['Yes', 'No'], 120);

      const predictions = service.predictions();
      expect(predictions.length).toBe(1);
      expect(predictions[0].question).toBe('Will we win?');
      expect(predictions[0].outcomes.length).toBe(2);
      expect(predictions[0].status).toBe('active');
    });

    it('should set prediction as active', () => {
      service.createPrediction('Test', ['A', 'B'], 60);

      const activePrediction = service.activePrediction();
      expect(activePrediction).not.toBeNull();
      expect(activePrediction?.question).toBe('Test');
    });

    it('should initialize outcomes with zero points and participants', () => {
      service.createPrediction('Test', ['Win', 'Lose'], 60);

      const outcomes = service.predictions()[0].outcomes;
      outcomes.forEach(outcome => {
        expect(outcome.points).toBe(0);
        expect(outcome.percentage).toBe(0);
        expect(outcome.participants).toBe(0);
      });
    });

    it('should make prediction', () => {
      service.createPrediction('Test', ['A', 'B'], 60);
      const prediction = service.predictions()[0];
      const outcomeId = prediction.outcomes[0].id;

      service.predict(prediction.id, outcomeId, 100);

      const updatedPrediction = service.predictions()[0];
      expect(updatedPrediction.outcomes[0].points).toBe(100);
      expect(updatedPrediction.outcomes[0].participants).toBe(1);
      expect(updatedPrediction.totalPoints).toBe(100);
    });

    it('should calculate outcome percentages', () => {
      service.createPrediction('Test', ['A', 'B'], 60);
      const prediction = service.predictions()[0];

      service.predict(prediction.id, prediction.outcomes[0].id, 300);
      service.predict(prediction.id, prediction.outcomes[1].id, 100);

      const updatedPrediction = service.predictions()[0];
      expect(updatedPrediction.outcomes[0].percentage).toBe(75);
      expect(updatedPrediction.outcomes[1].percentage).toBe(25);
      expect(updatedPrediction.totalPoints).toBe(400);
    });

    it('should track multiple participants', () => {
      service.createPrediction('Test', ['A', 'B'], 60);
      const prediction = service.predictions()[0];
      const outcomeId = prediction.outcomes[0].id;

      service.predict(prediction.id, outcomeId, 50);
      service.predict(prediction.id, outcomeId, 100);
      service.predict(prediction.id, outcomeId, 75);

      const updatedPrediction = service.predictions()[0];
      expect(updatedPrediction.outcomes[0].participants).toBe(3);
      expect(updatedPrediction.outcomes[0].points).toBe(225);
    });

    it('should resolve prediction', () => {
      service.createPrediction('Test', ['Win', 'Lose'], 60);
      const prediction = service.predictions()[0];
      const winningOutcomeId = prediction.outcomes[0].id;

      service.resolvePrediction(prediction.id, winningOutcomeId);

      const resolvedPrediction = service.predictions()[0];
      expect(resolvedPrediction.status).toBe('resolved');
      expect(resolvedPrediction.winningOutcome).toBe(winningOutcomeId);
      expect(resolvedPrediction.endTime).toBeDefined();
    });

    it('should clear active prediction when resolved', () => {
      service.createPrediction('Test', ['A', 'B'], 60);
      const prediction = service.predictions()[0];

      service.resolvePrediction(prediction.id, prediction.outcomes[0].id);

      expect(service.activePrediction()).toBeNull();
    });
  });

  describe('Points System', () => {
    it('should award points to new user', () => {
      service.awardPoints('user1', 'TestUser', 100);

      const leaderboard = service.leaderboard();
      expect(leaderboard.length).toBe(1);
      expect(leaderboard[0].userId).toBe('user1');
      expect(leaderboard[0].username).toBe('TestUser');
      expect(leaderboard[0].points).toBe(100);
    });

    it('should add points to existing user', () => {
      service.awardPoints('user1', 'TestUser', 100);
      service.awardPoints('user1', 'TestUser', 50);

      const leaderboard = service.leaderboard();
      expect(leaderboard.length).toBe(1);
      expect(leaderboard[0].points).toBe(150);
    });

    it('should handle multiple users', () => {
      service.awardPoints('user1', 'User1', 100);
      service.awardPoints('user2', 'User2', 200);
      service.awardPoints('user3', 'User3', 50);

      const leaderboard = service.leaderboard();
      expect(leaderboard.length).toBe(3);
    });

    it('should calculate rankings correctly', () => {
      service.awardPoints('user1', 'User1', 100);
      service.awardPoints('user2', 'User2', 300);
      service.awardPoints('user3', 'User3', 200);

      const leaderboard = service.leaderboard();
      expect(leaderboard[0].userId).toBe('user2');
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].userId).toBe('user3');
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].userId).toBe('user1');
      expect(leaderboard[2].rank).toBe(3);
    });

    it('should update rankings when points change', () => {
      service.awardPoints('user1', 'User1', 100);
      service.awardPoints('user2', 'User2', 200);

      let leaderboard = service.leaderboard();
      expect(leaderboard[0].userId).toBe('user2');

      service.awardPoints('user1', 'User1', 150);

      leaderboard = service.leaderboard();
      expect(leaderboard[0].userId).toBe('user1');
      expect(leaderboard[0].points).toBe(250);
      expect(leaderboard[1].userId).toBe('user2');
      expect(leaderboard[1].points).toBe(200);
    });

    it('should handle zero points', () => {
      service.awardPoints('user1', 'User1', 0);

      const leaderboard = service.leaderboard();
      expect(leaderboard[0].points).toBe(0);
    });

    it('should handle negative points (deductions)', () => {
      service.awardPoints('user1', 'User1', 100);
      service.awardPoints('user1', 'User1', -30);

      const leaderboard = service.leaderboard();
      expect(leaderboard[0].points).toBe(70);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update polls signal when creating poll', () => {
      let pollsCount = service.polls().length;
      expect(pollsCount).toBe(0);

      service.createPoll('Test', ['A', 'B'], 30);

      pollsCount = service.polls().length;
      expect(pollsCount).toBe(1);
    });

    it('should update activePoll signal', () => {
      expect(service.activePoll()).toBeNull();

      service.createPoll('Test', ['A', 'B'], 30);

      expect(service.activePoll()).not.toBeNull();
    });

    it('should update predictions signal when creating prediction', () => {
      expect(service.predictions().length).toBe(0);

      service.createPrediction('Test', ['A', 'B'], 60);

      expect(service.predictions().length).toBe(1);
    });

    it('should update leaderboard signal when awarding points', () => {
      expect(service.leaderboard().length).toBe(0);

      service.awardPoints('user1', 'User1', 100);

      expect(service.leaderboard().length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle creating poll with one option', () => {
      service.createPoll('Test', ['Only One'], 30);

      const poll = service.polls()[0];
      expect(poll.options.length).toBe(1);
    });

    it('should handle creating poll with many options', () => {
      const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);
      service.createPoll('Test', options, 30);

      const poll = service.polls()[0];
      expect(poll.options.length).toBe(20);
    });

    it('should handle very short poll duration', fakeAsync(() => {
      service.createPoll('Test', ['A', 'B'], 0.1); // 100ms

      expect(service.polls()[0].status).toBe('active');

      tick(100);

      expect(service.polls()[0].status).toBe('ended');
    }));

    it('should handle prediction with zero points', () => {
      service.createPrediction('Test', ['A', 'B'], 60);
      const prediction = service.predictions()[0];

      service.predict(prediction.id, prediction.outcomes[0].id, 0);

      const updatedPrediction = service.predictions()[0];
      expect(updatedPrediction.totalPoints).toBe(0);
    });

    it('should handle awarding large point amounts', () => {
      service.awardPoints('user1', 'User1', 1000000);

      const leaderboard = service.leaderboard();
      expect(leaderboard[0].points).toBe(1000000);
    });

    it('should handle multiple active polls', fakeAsync(() => {
      service.createPoll('Poll 1', ['A', 'B'], 30);
      tick(100);
      service.createPoll('Poll 2', ['X', 'Y'], 30);

      // Only the most recent poll should be active
      expect(service.activePoll()?.question).toBe('Poll 2');
      expect(service.polls().length).toBe(2);
    }));

    it('should preserve poll history', fakeAsync(() => {
      service.createPoll('Poll 1', ['A', 'B'], 1);
      tick(1000);

      service.createPoll('Poll 2', ['X', 'Y'], 1);
      tick(1000);

      const polls = service.polls();
      expect(polls.length).toBe(2);
      expect(polls.every(p => p.status === 'ended')).toBe(true);
    }));
  });
});
