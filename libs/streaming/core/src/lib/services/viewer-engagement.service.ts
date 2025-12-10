import { Injectable, signal } from '@angular/core';

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'ended';
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface Prediction {
  id: string;
  question: string;
  outcomes: PredictionOutcome[];
  duration: number;
  startTime: Date;
  endTime?: Date;
  winningOutcome?: string;
  status: 'active' | 'locked' | 'resolved';
  totalPoints: number;
}

export interface PredictionOutcome {
  id: string;
  text: string;
  points: number;
  percentage: number;
  participants: number;
}

export interface RewardSystem {
  enabled: boolean;
  pointsPerMinute: number;
  pointsPerMessage: number;
  bonusMultiplier: number;
}

export interface UserPoints {
  userId: string;
  username: string;
  points: number;
  rank: number;
}

@Injectable({
  providedIn: 'root'
})
export class ViewerEngagementService {
  readonly polls = signal<Poll[]>([]);
  readonly predictions = signal<Prediction[]>([]);
  readonly activePoll = signal<Poll | null>(null);
  readonly activePrediction = signal<Prediction | null>(null);
  
  readonly rewardSystem = signal<RewardSystem>({
    enabled: true,
    pointsPerMinute: 10,
    pointsPerMessage: 5,
    bonusMultiplier: 1.5
  });

  readonly leaderboard = signal<UserPoints[]>([]);

  createPoll(question: string, options: string[], duration: number): void {
    const poll: Poll = {
      id: crypto.randomUUID(),
      question,
      options: options.map(text => ({
        id: crypto.randomUUID(),
        text,
        votes: 0,
        percentage: 0
      })),
      duration,
      startTime: new Date(),
      status: 'active',
      totalVotes: 0
    };

    this.polls.update(p => [poll, ...p]);
    this.activePoll.set(poll);

    setTimeout(() => this.endPoll(poll.id), duration * 1000);
  }

  vote(pollId: string, optionId: string): void {
    this.polls.update(polls =>
      polls.map(poll => {
        if (poll.id !== pollId) return poll;

        const updatedOptions = poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );

        const total = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);
        const optionsWithPercentage = updatedOptions.map(opt => ({
          ...opt,
          percentage: total > 0 ? (opt.votes / total) * 100 : 0
        }));

        return {
          ...poll,
          options: optionsWithPercentage,
          totalVotes: total
        };
      })
    );
  }

  endPoll(pollId: string): void {
    this.polls.update(polls =>
      polls.map(poll => 
        poll.id === pollId ? { ...poll, status: 'ended' as const, endTime: new Date() } : poll
      )
    );

    if (this.activePoll()?.id === pollId) {
      this.activePoll.set(null);
    }
  }

  createPrediction(question: string, outcomes: string[], duration: number): void {
    const prediction: Prediction = {
      id: crypto.randomUUID(),
      question,
      outcomes: outcomes.map(text => ({
        id: crypto.randomUUID(),
        text,
        points: 0,
        percentage: 0,
        participants: 0
      })),
      duration,
      startTime: new Date(),
      status: 'active',
      totalPoints: 0
    };

    this.predictions.update(p => [prediction, ...p]);
    this.activePrediction.set(prediction);
  }

  predict(predictionId: string, outcomeId: string, points: number): void {
    this.predictions.update(predictions =>
      predictions.map(pred => {
        if (pred.id !== predictionId) return pred;

        const updatedOutcomes = pred.outcomes.map(out =>
          out.id === outcomeId
            ? { ...out, points: out.points + points, participants: out.participants + 1 }
            : out
        );

        const total = updatedOutcomes.reduce((sum, out) => sum + out.points, 0);
        const outcomesWithPercentage = updatedOutcomes.map(out => ({
          ...out,
          percentage: total > 0 ? (out.points / total) * 100 : 0
        }));

        return {
          ...pred,
          outcomes: outcomesWithPercentage,
          totalPoints: total
        };
      })
    );
  }

  resolvePrediction(predictionId: string, winningOutcomeId: string): void {
    this.predictions.update(predictions =>
      predictions.map(pred =>
        pred.id === predictionId
          ? { ...pred, status: 'resolved' as const, winningOutcome: winningOutcomeId, endTime: new Date() }
          : pred
      )
    );

    if (this.activePrediction()?.id === predictionId) {
      this.activePrediction.set(null);
    }
  }

  awardPoints(userId: string, username: string, points: number): void {
    this.leaderboard.update(board => {
      const existing = board.find(u => u.userId === userId);
      
      if (existing) {
        const updated = board.map(u =>
          u.userId === userId ? { ...u, points: u.points + points } : u
        );
        return this.updateRankings(updated);
      } else {
        const newUser: UserPoints = { userId, username, points, rank: 0 };
        return this.updateRankings([...board, newUser]);
      }
    });
  }

  private updateRankings(board: UserPoints[]): UserPoints[] {
    return board
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  }
}
