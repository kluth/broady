import { Injectable, signal, computed } from '@angular/core';

/**
 * Chat Mini-Games Service
 * Interactive games viewers can play in chat for points!
 */

export interface MiniGame {
  id: string;
  name: string;
  description: string;
  type: GameType;
  icon: string;
  active: boolean;
  participants: Participant[];
  startedAt?: Date;
  endsAt?: Date;
  duration: number; // seconds
  reward: number; // points for winner
  config: GameConfig;
  results?: GameResults;
}

export type GameType =
  | 'trivia'
  | 'prediction'
  | 'dice'
  | 'roulette'
  | 'rps' // rock paper scissors
  | 'guess-number'
  | 'word-scramble'
  | 'math-quiz'
  | 'emoji-match'
  | 'quick-draw';

export interface Participant {
  viewerId: string;
  viewerName: string;
  answer: any;
  joinedAt: Date;
  isWinner?: boolean;
  pointsWon?: number;
}

export interface GameConfig {
  question?: string;
  options?: string[];
  correctAnswer?: any;
  minValue?: number;
  maxValue?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  multipleWinners?: boolean;
}

export interface GameResults {
  winners: Participant[];
  correctAnswer: any;
  totalParticipants: number;
  completedAt: Date;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatMinigamesService {
  readonly games = signal<MiniGame[]>([]);
  readonly gameHistory = signal<MiniGame[]>([]);

  readonly activeGame = computed(() =>
    this.games().find(g => g.active)
  );

  readonly statistics = computed(() => ({
    totalGames: this.games().length + this.gameHistory().length,
    activeGames: this.games().filter(g => g.active).length,
    totalParticipants: this.games()
      .reduce((sum, g) => sum + g.participants.length, 0),
    totalPointsAwarded: this.gameHistory()
      .reduce((sum, g) => sum + (g.reward * (g.results?.winners.length || 0)), 0)
  }));

  // Trivia questions database
  private triviaQuestions: TriviaQuestion[] = [
    {
      question: 'What year was Twitch founded?',
      options: ['2009', '2011', '2013', '2015'],
      correctAnswer: 1,
      category: 'streaming',
      difficulty: 'medium'
    },
    {
      question: 'Which game has the most concurrent players on Steam?',
      options: ['CS2', 'Dota 2', 'PUBG', 'Lost Ark'],
      correctAnswer: 0,
      category: 'gaming',
      difficulty: 'easy'
    },
    {
      question: 'What is the max level in League of Legends?',
      options: ['18', '20', '25', '30'],
      correctAnswer: 0,
      category: 'gaming',
      difficulty: 'hard'
    },
    {
      question: 'How many players are in a Valorant team?',
      options: ['4', '5', '6', '10'],
      correctAnswer: 1,
      category: 'gaming',
      difficulty: 'easy'
    },
    {
      question: 'What does "PogChamp" mean?',
      options: ['Excitement', 'Sadness', 'Anger', 'Confusion'],
      correctAnswer: 0,
      category: 'twitch',
      difficulty: 'easy'
    },
    {
      question: 'Which console was released first?',
      options: ['PlayStation', 'Xbox', 'Nintendo 64', 'Sega Dreamcast'],
      correctAnswer: 2,
      category: 'gaming',
      difficulty: 'hard'
    }
  ];

  private wordScrambles = [
    { word: 'STREAMER', scrambled: 'RMSTEEAR' },
    { word: 'DONATION', scrambled: 'NITODAON' },
    { word: 'FOLLOWER', scrambled: 'WLOFELOR' },
    { word: 'CHAMPION', scrambled: 'PMAONICH' },
    { word: 'KEYBOARD', scrambled: 'DBOKYARE' },
    { word: 'VICTORY', scrambled: 'YCORVIT' }
  ];

  /**
   * Start trivia game
   */
  startTrivia(customQuestion?: TriviaQuestion): MiniGame {
    const question = customQuestion || this.getRandomTrivia();

    return this.createGame({
      name: 'Trivia Time!',
      description: 'Answer correctly to win points!',
      type: 'trivia',
      icon: '❓',
      duration: 30,
      reward: 500,
      config: {
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty as any
      }
    });
  }

  /**
   * Start prediction game
   */
  startPrediction(question: string, options: string[]): MiniGame {
    return this.createGame({
      name: 'Make Your Prediction!',
      description: question,
      type: 'prediction',
      icon: '🔮',
      duration: 60,
      reward: 1000,
      config: {
        question,
        options,
        multipleWinners: true
      }
    });
  }

  /**
   * Start dice roll
   */
  startDiceRoll(sides: number = 6): MiniGame {
    return this.createGame({
      name: `Roll the D${sides}!`,
      description: 'Highest roll wins!',
      type: 'dice',
      icon: '🎲',
      duration: 20,
      reward: 300,
      config: {
        minValue: 1,
        maxValue: sides
      }
    });
  }

  /**
   * Start roulette
   */
  startRoulette(): MiniGame {
    return this.createGame({
      name: 'Roulette!',
      description: 'Pick a number 0-36!',
      type: 'roulette',
      icon: '🎰',
      duration: 30,
      reward: 5000,
      config: {
        minValue: 0,
        maxValue: 36
      }
    });
  }

  /**
   * Start Rock Paper Scissors
   */
  startRPS(): MiniGame {
    return this.createGame({
      name: 'Rock Paper Scissors!',
      description: 'Beat the streamer!',
      type: 'rps',
      icon: '✊',
      duration: 15,
      reward: 400,
      config: {
        options: ['rock', 'paper', 'scissors']
      }
    });
  }

  /**
   * Start number guessing
   */
  startNumberGuess(min: number = 1, max: number = 100): MiniGame {
    const correctAnswer = Math.floor(Math.random() * (max - min + 1)) + min;

    return this.createGame({
      name: 'Guess the Number!',
      description: `Guess between ${min} and ${max}!`,
      type: 'guess-number',
      icon: '🔢',
      duration: 30,
      reward: 800,
      config: {
        minValue: min,
        maxValue: max,
        correctAnswer
      }
    });
  }

  /**
   * Start word scramble
   */
  startWordScramble(): MiniGame {
    const scramble = this.wordScrambles[
      Math.floor(Math.random() * this.wordScrambles.length)
    ];

    return this.createGame({
      name: 'Word Scramble!',
      description: `Unscramble: ${scramble.scrambled}`,
      type: 'word-scramble',
      icon: '🔤',
      duration: 45,
      reward: 600,
      config: {
        question: scramble.scrambled,
        correctAnswer: scramble.word
      }
    });
  }

  /**
   * Start math quiz
   */
  startMathQuiz(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): MiniGame {
    const { question, answer } = this.generateMathProblem(difficulty);

    return this.createGame({
      name: 'Quick Math!',
      description: question,
      type: 'math-quiz',
      icon: '🧮',
      duration: 20,
      reward: difficulty === 'easy' ? 200 : difficulty === 'medium' ? 400 : 800,
      config: {
        question,
        correctAnswer: answer,
        difficulty
      }
    });
  }

  /**
   * Start emoji match
   */
  startEmojiMatch(): MiniGame {
    const emojis = ['😀', '😎', '🔥', '💯', '👑', '⚡', '🎮', '🏆'];
    const sequence = Array.from({ length: 4 }, () =>
      emojis[Math.floor(Math.random() * emojis.length)]
    ).join('');

    return this.createGame({
      name: 'Emoji Memory!',
      description: `Remember: ${sequence}`,
      type: 'emoji-match',
      icon: '😀',
      duration: 15,
      reward: 700,
      config: {
        question: sequence,
        correctAnswer: sequence
      }
    });
  }

  /**
   * Create game
   */
  private createGame(config: Partial<MiniGame>): MiniGame {
    // End any active games
    this.endActiveGames();

    const game: MiniGame = {
      id: crypto.randomUUID(),
      name: config.name || 'New Game',
      description: config.description || '',
      type: config.type || 'trivia',
      icon: config.icon || '🎮',
      active: true,
      participants: [],
      startedAt: new Date(),
      duration: config.duration || 30,
      reward: config.reward || 100,
      config: config.config || {}
    };

    game.endsAt = new Date(Date.now() + game.duration * 1000);

    this.games.update(g => [...g, game]);

    // Auto-end game after duration
    setTimeout(() => {
      this.endGame(game.id);
    }, game.duration * 1000);

    return game;
  }

  /**
   * Join game
   */
  joinGame(gameId: string, viewerId: string, viewerName: string, answer: any): boolean {
    const game = this.games().find(g => g.id === gameId);
    if (!game || !game.active) {
      console.error('Game not available');
      return false;
    }

    // Check if already joined
    if (game.participants.some(p => p.viewerId === viewerId)) {
      console.error('Already joined');
      return false;
    }

    // Add participant
    this.games.update(games =>
      games.map(g =>
        g.id === gameId
          ? {
              ...g,
              participants: [
                ...g.participants,
                {
                  viewerId,
                  viewerName,
                  answer,
                  joinedAt: new Date()
                }
              ]
            }
          : g
      )
    );

    return true;
  }

  /**
   * End game and determine winners
   */
  endGame(gameId: string): GameResults | null {
    const game = this.games().find(g => g.id === gameId);
    if (!game) return null;

    const winners = this.determineWinners(game);

    const results: GameResults = {
      winners,
      correctAnswer: game.config.correctAnswer,
      totalParticipants: game.participants.length,
      completedAt: new Date()
    };

    // Update game with results
    this.games.update(games =>
      games.map(g =>
        g.id === gameId
          ? {
              ...g,
              active: false,
              results,
              participants: g.participants.map(p => ({
                ...p,
                isWinner: winners.some(w => w.viewerId === p.viewerId),
                pointsWon: winners.some(w => w.viewerId === p.viewerId) ? g.reward : 0
              }))
            }
          : g
      )
    );

    // Move to history
    const completedGame = this.games().find(g => g.id === gameId);
    if (completedGame) {
      this.gameHistory.update(h => [...h, completedGame]);
      this.games.update(g => g.filter(game => game.id !== gameId));
    }

    return results;
  }

  /**
   * Determine winners based on game type
   */
  private determineWinners(game: MiniGame): Participant[] {
    if (game.participants.length === 0) return [];

    switch (game.type) {
      case 'trivia':
      case 'math-quiz':
      case 'word-scramble':
      case 'emoji-match':
      case 'guess-number':
        return game.participants.filter(
          p => p.answer === game.config.correctAnswer
        );

      case 'prediction':
        // In real implementation, would be set manually
        return game.config.correctAnswer !== undefined
          ? game.participants.filter(p => p.answer === game.config.correctAnswer)
          : [];

      case 'dice':
        const maxRoll = Math.max(...game.participants.map(p => p.answer));
        return game.participants.filter(p => p.answer === maxRoll);

      case 'roulette':
        const winningNumber = Math.floor(
          Math.random() * ((game.config.maxValue || 36) + 1)
        );
        return game.participants.filter(p => p.answer === winningNumber);

      case 'rps':
        const streamerChoice = ['rock', 'paper', 'scissors'][
          Math.floor(Math.random() * 3)
        ];
        return game.participants.filter(p =>
          this.rpsWins(p.answer, streamerChoice)
        );

      default:
        return [];
    }
  }

  /**
   * Check RPS winner
   */
  private rpsWins(player: string, opponent: string): boolean {
    if (player === opponent) return false;
    if (player === 'rock' && opponent === 'scissors') return true;
    if (player === 'paper' && opponent === 'rock') return true;
    if (player === 'scissors' && opponent === 'paper') return true;
    return false;
  }

  /**
   * Generate math problem
   */
  private generateMathProblem(difficulty: string): { question: string; answer: number } {
    let a, b, operation, answer;

    switch (difficulty) {
      case 'easy':
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        operation = Math.random() > 0.5 ? '+' : '-';
        answer = operation === '+' ? a + b : a - b;
        return { question: `${a} ${operation} ${b}`, answer };

      case 'medium':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        if (operation === '+') answer = a + b;
        else if (operation === '-') answer = a - b;
        else answer = a * b;
        return { question: `${a} ${operation} ${b}`, answer };

      case 'hard':
        a = Math.floor(Math.random() * 100) + 10;
        b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 20) + 1;
        answer = a * b + c;
        return { question: `${a} × ${b} + ${c}`, answer };

      default:
        return { question: '1 + 1', answer: 2 };
    }
  }

  /**
   * Get random trivia
   */
  private getRandomTrivia(): TriviaQuestion {
    return this.triviaQuestions[
      Math.floor(Math.random() * this.triviaQuestions.length)
    ];
  }

  /**
   * End all active games
   */
  private endActiveGames(): void {
    const active = this.games().filter(g => g.active);
    active.forEach(g => this.endGame(g.id));
  }

  /**
   * Cancel game
   */
  cancelGame(gameId: string): void {
    this.games.update(g => g.filter(game => game.id !== gameId));
  }

  /**
   * Get game statistics
   */
  getGameStats(gameType: GameType): {
    played: number;
    avgParticipants: number;
    totalPointsAwarded: number;
  } {
    const games = this.gameHistory().filter(g => g.type === gameType);

    return {
      played: games.length,
      avgParticipants: games.length > 0
        ? games.reduce((sum, g) => sum + g.participants.length, 0) / games.length
        : 0,
      totalPointsAwarded: games.reduce(
        (sum, g) => sum + (g.reward * (g.results?.winners.length || 0)),
        0
      )
    };
  }

  /**
   * Get viewer game history
   */
  getViewerGameHistory(viewerId: string): Array<{
    game: MiniGame;
    won: boolean;
    pointsWon: number;
  }> {
    return this.gameHistory()
      .filter(g => g.participants.some(p => p.viewerId === viewerId))
      .map(g => {
        const participant = g.participants.find(p => p.viewerId === viewerId)!;
        return {
          game: g,
          won: participant.isWinner || false,
          pointsWon: participant.pointsWon || 0
        };
      });
  }
}
