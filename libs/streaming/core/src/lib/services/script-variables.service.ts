import { Injectable, signal, computed } from '@angular/core';

/**
 * Script Variables Service
 * Provides dynamic variables for scripting engine
 * Includes game stats, external APIs, stream data, and more!
 */

export interface ScriptVariable {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: VariableCategory;
  description: string;
  live: boolean; // Updates in real-time
  source?: string;
}

export type VariableCategory =
  | 'game'
  | 'stream'
  | 'chat'
  | 'betting'
  | 'viewer'
  | 'external'
  | 'time'
  | 'system'
  | 'math'
  | 'custom';

export interface ExternalAPIData {
  weather?: WeatherData;
  crypto?: CryptoData;
  stocks?: StockData;
  news?: NewsData;
  meme?: MemeData;
  joke?: JokeData;
  quote?: QuoteData;
  fact?: FactData;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  lastUpdated: Date;
}

export interface CryptoData {
  bitcoin: number;
  ethereum: number;
  dogecoin: number;
  prices: Record<string, number>;
  lastUpdated: Date;
}

export interface StockData {
  spy: number;
  aapl: number;
  tsla: number;
  prices: Record<string, number>;
  lastUpdated: Date;
}

export interface NewsData {
  headline: string;
  source: string;
  url: string;
}

export interface MemeData {
  url: string;
  title: string;
}

export interface JokeData {
  setup: string;
  punchline: string;
}

export interface QuoteData {
  text: string;
  author: string;
}

export interface FactData {
  text: string;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptVariablesService {
  private variables = signal<Map<string, ScriptVariable>>(new Map());
  private externalData = signal<ExternalAPIData>({});

  readonly allVariables = computed(() => Array.from(this.variables().values()));

  readonly variablesByCategory = computed(() => {
    const vars = this.allVariables();
    const byCategory: Record<string, ScriptVariable[]> = {};

    vars.forEach(v => {
      if (!byCategory[v.category]) {
        byCategory[v.category] = [];
      }
      byCategory[v.category].push(v);
    });

    return byCategory;
  });

  constructor() {
    this.initializeDefaultVariables();
    this.startLiveUpdates();
  }

  /**
   * Initialize all default variables
   */
  private initializeDefaultVariables(): void {
    // Game Variables
    this.setVariable('game.name', 'None', 'string', 'game', 'Current game being played', true);
    this.setVariable('game.kills', 0, 'number', 'game', 'Kill count', true);
    this.setVariable('game.deaths', 0, 'number', 'game', 'Death count', true);
    this.setVariable('game.assists', 0, 'number', 'game', 'Assist count', true);
    this.setVariable('game.kd', 0, 'number', 'game', 'K/D ratio', true);
    this.setVariable('game.kda', 0, 'number', 'game', 'KDA ratio', true);
    this.setVariable('game.score', 0, 'number', 'game', 'Current score', true);
    this.setVariable('game.level', 1, 'number', 'game', 'Player level', true);
    this.setVariable('game.gold', 0, 'number', 'game', 'In-game currency', true);
    this.setVariable('game.cs', 0, 'number', 'game', 'Creep score / farm', true);
    this.setVariable('game.damage', 0, 'number', 'game', 'Damage dealt', true);
    this.setVariable('game.placement', 0, 'number', 'game', 'Current placement (BR)', true);
    this.setVariable('game.alive', true, 'boolean', 'game', 'Is player alive', true);
    this.setVariable('game.inMatch', false, 'boolean', 'game', 'Currently in match', true);
    this.setVariable('game.matchResult', 'pending', 'string', 'game', 'Match result (win/loss)', true);
    this.setVariable('game.champion', 'None', 'string', 'game', 'Selected champion/character', true);
    this.setVariable('game.team', 'None', 'string', 'game', 'Team name', true);
    this.setVariable('game.map', 'None', 'string', 'game', 'Current map', true);
    this.setVariable('game.gameMode', 'None', 'string', 'game', 'Game mode', true);
    this.setVariable('game.sessionTime', 0, 'number', 'game', 'Current session time (seconds)', true);
    this.setVariable('game.totalPlaytime', 0, 'number', 'game', 'Total playtime today (seconds)', true);

    // Stream Variables
    this.setVariable('stream.viewers', 0, 'number', 'stream', 'Current viewer count', true);
    this.setVariable('stream.followers', 0, 'number', 'stream', 'Total followers', true);
    this.setVariable('stream.subscribers', 0, 'number', 'stream', 'Total subscribers', true);
    this.setVariable('stream.uptime', 0, 'number', 'stream', 'Stream uptime (seconds)', true);
    this.setVariable('stream.fps', 60, 'number', 'stream', 'Current FPS', true);
    this.setVariable('stream.bitrate', 6000, 'number', 'stream', 'Current bitrate', true);
    this.setVariable('stream.droppedFrames', 0, 'number', 'stream', 'Dropped frames', true);
    this.setVariable('stream.title', 'Live Stream', 'string', 'stream', 'Stream title', true);
    this.setVariable('stream.category', 'Just Chatting', 'string', 'stream', 'Stream category', true);
    this.setVariable('stream.isLive', false, 'boolean', 'stream', 'Is stream live', true);
    this.setVariable('stream.isRecording', false, 'boolean', 'stream', 'Is recording', true);
    this.setVariable('stream.health', 100, 'number', 'stream', 'Stream health score', true);
    this.setVariable('stream.cpuUsage', 0, 'number', 'stream', 'CPU usage %', true);
    this.setVariable('stream.memoryUsage', 0, 'number', 'stream', 'Memory usage %', true);
    this.setVariable('stream.quality', 'excellent', 'string', 'stream', 'Stream quality rating', true);

    // Chat Variables
    this.setVariable('chat.lastMessage', '', 'string', 'chat', 'Last chat message', true);
    this.setVariable('chat.lastUser', '', 'string', 'chat', 'Last message sender', true);
    this.setVariable('chat.messageCount', 0, 'number', 'chat', 'Total messages', true);
    this.setVariable('chat.messagesPerMinute', 0, 'number', 'chat', 'Chat velocity', true);
    this.setVariable('chat.activeUsers', 0, 'number', 'chat', 'Active chatters', true);
    this.setVariable('chat.emoteCount', 0, 'number', 'chat', 'Emotes used', true);
    this.setVariable('chat.topEmote', '', 'string', 'chat', 'Most used emote', true);
    this.setVariable('chat.mood', 'positive', 'string', 'chat', 'Chat sentiment', true);

    // Betting Variables
    this.setVariable('betting.activeBets', 0, 'number', 'betting', 'Active bets count', true);
    this.setVariable('betting.totalPoints', 0, 'number', 'betting', 'Total points in play', true);
    this.setVariable('betting.topBettor', '', 'string', 'betting', 'Leaderboard #1', true);
    this.setVariable('betting.totalBettors', 0, 'number', 'betting', 'Total participants', true);
    this.setVariable('betting.lastWinner', '', 'string', 'betting', 'Last bet winner', true);
    this.setVariable('betting.lastPayout', 0, 'number', 'betting', 'Last payout amount', true);

    // Viewer Variables
    this.setVariable('viewer.name', '', 'string', 'viewer', 'Viewer username', false);
    this.setVariable('viewer.isSubscriber', false, 'boolean', 'viewer', 'Is subscriber', false);
    this.setVariable('viewer.isModerator', false, 'boolean', 'viewer', 'Is moderator', false);
    this.setVariable('viewer.isVIP', false, 'boolean', 'viewer', 'Is VIP', false);
    this.setVariable('viewer.points', 0, 'number', 'viewer', 'Betting points', false);
    this.setVariable('viewer.watchTime', 0, 'number', 'viewer', 'Total watch time', false);
    this.setVariable('viewer.messageCount', 0, 'number', 'viewer', 'Messages sent', false);

    // Time Variables
    this.setVariable('time.hour', new Date().getHours(), 'number', 'time', 'Current hour (24h)', true);
    this.setVariable('time.minute', new Date().getMinutes(), 'number', 'time', 'Current minute', true);
    this.setVariable('time.day', new Date().getDate(), 'number', 'time', 'Day of month', true);
    this.setVariable('time.month', new Date().getMonth() + 1, 'number', 'time', 'Month (1-12)', true);
    this.setVariable('time.year', new Date().getFullYear(), 'number', 'time', 'Current year', true);
    this.setVariable('time.dayOfWeek', new Date().getDay(), 'number', 'time', 'Day of week (0-6)', true);
    this.setVariable('time.dayName', this.getDayName(), 'string', 'time', 'Day name', true);
    this.setVariable('time.monthName', this.getMonthName(), 'string', 'time', 'Month name', true);
    this.setVariable('time.timestamp', Date.now(), 'number', 'time', 'Unix timestamp', true);
    this.setVariable('time.formatted', new Date().toLocaleString(), 'string', 'time', 'Formatted date/time', true);

    // System Variables
    this.setVariable('system.os', 'Windows', 'string', 'system', 'Operating system', false);
    this.setVariable('system.platform', 'desktop', 'string', 'system', 'Platform type', false);
    this.setVariable('system.memory', 16, 'number', 'system', 'RAM (GB)', false);
    this.setVariable('system.cpu', 'AMD Ryzen 9', 'string', 'system', 'CPU model', false);
    this.setVariable('system.gpu', 'NVIDIA RTX', 'string', 'system', 'GPU model', false);

    // Math/Random Variables
    this.setVariable('math.random', Math.random(), 'number', 'math', 'Random 0-1', true);
    this.setVariable('math.randomInt', Math.floor(Math.random() * 100), 'number', 'math', 'Random 0-100', true);
    this.setVariable('math.pi', Math.PI, 'number', 'math', 'Pi constant', false);
    this.setVariable('math.e', Math.E, 'number', 'math', 'Euler\'s number', false);

    // External API Variables (will be populated by API calls)
    this.setVariable('weather.temp', 0, 'number', 'external', 'Temperature (°F)', true, 'weather');
    this.setVariable('weather.condition', 'Unknown', 'string', 'external', 'Weather condition', true, 'weather');
    this.setVariable('weather.location', 'Unknown', 'string', 'external', 'Location', true, 'weather');
    this.setVariable('weather.humidity', 0, 'number', 'external', 'Humidity %', true, 'weather');

    this.setVariable('crypto.bitcoin', 0, 'number', 'external', 'Bitcoin price USD', true, 'crypto');
    this.setVariable('crypto.ethereum', 0, 'number', 'external', 'Ethereum price USD', true, 'crypto');
    this.setVariable('crypto.dogecoin', 0, 'number', 'external', 'Dogecoin price USD', true, 'crypto');

    this.setVariable('stocks.spy', 0, 'number', 'external', 'S&P 500 price', true, 'stocks');
    this.setVariable('stocks.aapl', 0, 'number', 'external', 'Apple stock price', true, 'stocks');
    this.setVariable('stocks.tsla', 0, 'number', 'external', 'Tesla stock price', true, 'stocks');

    this.setVariable('fun.joke', '', 'string', 'external', 'Random joke', false, 'jokes');
    this.setVariable('fun.quote', '', 'string', 'external', 'Inspirational quote', false, 'quotes');
    this.setVariable('fun.fact', '', 'string', 'external', 'Random fact', false, 'facts');
    this.setVariable('fun.meme', '', 'string', 'external', 'Meme URL', false, 'memes');
  }

  /**
   * Set a variable value
   */
  setVariable(
    name: string,
    value: any,
    type: ScriptVariable['type'],
    category: VariableCategory,
    description: string,
    live = false,
    source?: string
  ): void {
    this.variables.update(vars => {
      const newVars = new Map(vars);
      newVars.set(name, {
        name,
        value,
        type,
        category,
        description,
        live,
        source
      });
      return newVars;
    });
  }

  /**
   * Get variable value
   */
  getVariable(name: string): any {
    return this.variables().get(name)?.value;
  }

  /**
   * Update variable value
   */
  updateVariable(name: string, value: any): void {
    this.variables.update(vars => {
      const newVars = new Map(vars);
      const variable = newVars.get(name);
      if (variable) {
        newVars.set(name, { ...variable, value });
      }
      return newVars;
    });
  }

  /**
   * Get all variables as context object
   */
  getContext(): Record<string, any> {
    const context: Record<string, any> = {};

    this.variables().forEach((variable, name) => {
      // Support nested access (e.g., game.kills -> context.game.kills)
      const parts = name.split('.');
      let current = context;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = variable.value;
    });

    return context;
  }

  /**
   * Update game stats
   */
  updateGameStats(stats: Record<string, any>): void {
    Object.entries(stats).forEach(([key, value]) => {
      this.updateVariable(`game.${key}`, value);
    });
  }

  /**
   * Update stream stats
   */
  updateStreamStats(stats: Record<string, any>): void {
    Object.entries(stats).forEach(([key, value]) => {
      this.updateVariable(`stream.${key}`, value);
    });
  }

  /**
   * Update chat stats
   */
  updateChatStats(stats: Record<string, any>): void {
    Object.entries(stats).forEach(([key, value]) => {
      this.updateVariable(`chat.${key}`, value);
    });
  }

  /**
   * Update betting stats
   */
  updateBettingStats(stats: Record<string, any>): void {
    Object.entries(stats).forEach(([key, value]) => {
      this.updateVariable(`betting.${key}`, value);
    });
  }

  /**
   * Fetch external API data
   */
  async fetchExternalData(): Promise<void> {
    await Promise.all([
      this.fetchWeather(),
      this.fetchCrypto(),
      this.fetchStocks(),
      this.fetchJoke(),
      this.fetchQuote(),
      this.fetchFact()
    ]);
  }

  /**
   * Fetch weather data
   */
  private async fetchWeather(): Promise<void> {
    try {
      // Get API key and location from environment or localStorage
      const apiKey = localStorage.getItem('openweather_api_key') || '';
      const location = localStorage.getItem('weather_location') || 'New York';

      if (!apiKey) {
        console.warn('OpenWeatherMap API key not configured');
        return;
      }

      // Call OpenWeatherMap API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Map weather condition to emoji
      const conditionIcons: Record<string, string> = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️'
      };

      const weather: WeatherData = {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        icon: conditionIcons[data.weather[0].main] || '🌤️',
        lastUpdated: new Date()
      };

      this.externalData.update(d => ({ ...d, weather }));

      this.updateVariable('weather.temp', weather.temperature);
      this.updateVariable('weather.condition', weather.condition);
      this.updateVariable('weather.location', weather.location);
      this.updateVariable('weather.humidity', weather.humidity);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Set error state - no mock fallback
      this.updateVariable('weather.error', 'Failed to fetch weather data');
    }
  }

  /**
   * Fetch cryptocurrency prices
   */
  private async fetchCrypto(): Promise<void> {
    try {
      // Call CoinGecko API (no API key required for basic usage)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      const crypto: CryptoData = {
        bitcoin: data.bitcoin?.usd || 0,
        ethereum: data.ethereum?.usd || 0,
        dogecoin: data.dogecoin?.usd || 0,
        prices: {
          btc: data.bitcoin?.usd || 0,
          eth: data.ethereum?.usd || 0,
          doge: data.dogecoin?.usd || 0
        },
        lastUpdated: new Date()
      };

      this.externalData.update(d => ({ ...d, crypto }));

      this.updateVariable('crypto.bitcoin', Math.round(crypto.bitcoin));
      this.updateVariable('crypto.ethereum', Math.round(crypto.ethereum));
      this.updateVariable('crypto.dogecoin', crypto.dogecoin.toFixed(4));
    } catch (error) {
      console.error('Failed to fetch crypto:', error);
      // Set error state - no mock fallback
      this.updateVariable('crypto.error', 'Failed to fetch cryptocurrency data');
    }
  }

  /**
   * Fetch stock prices
   */
  private async fetchStocks(): Promise<void> {
    try {
      const apiKey = localStorage.getItem('alphavantage_api_key') || '';

      if (!apiKey) {
        console.warn('Alpha Vantage API key not configured');
        throw new Error('API key not configured');
      }

      // Fetch multiple stocks
      const symbols = ['SPY', 'AAPL', 'TSLA'];
      const prices: Record<string, number> = {};

      for (const symbol of symbols) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );

          if (!response.ok) continue;

          const data = await response.json();
          const quote = data['Global Quote'];

          if (quote && quote['05. price']) {
            prices[symbol.toLowerCase()] = parseFloat(quote['05. price']);
          }

          // Alpha Vantage has rate limits, add a small delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
        }
      }

      const stocks: StockData = {
        spy: prices['spy'] || 0,
        aapl: prices['aapl'] || 0,
        tsla: prices['tsla'] || 0,
        prices,
        lastUpdated: new Date()
      };

      this.externalData.update(d => ({ ...d, stocks }));

      this.updateVariable('stocks.spy', stocks.spy.toFixed(2));
      this.updateVariable('stocks.aapl', stocks.aapl.toFixed(2));
      this.updateVariable('stocks.tsla', stocks.tsla.toFixed(2));
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
      // Set error state - no mock fallback
      this.updateVariable('stocks.error', 'Failed to fetch stock data. Please configure Alpha Vantage API key.');
    }
  }

  /**
   * Fetch random joke
   */
  private async fetchJoke(): Promise<void> {
    try {
      const jokes = [
        'Why did the streamer go broke? Too many dropped frames!',
        'What do you call a streamer with no viewers? A rehearsal!',
        'Why don\'t streamers ever get lost? They always follow the chat!',
        'How do streamers stay cool? They have lots of fans!',
        'What\'s a streamer\'s favorite exercise? Stream ups!'
      ];

      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      this.updateVariable('fun.joke', joke);
    } catch (error) {
      console.error('Failed to fetch joke:', error);
    }
  }

  /**
   * Fetch inspirational quote
   */
  private async fetchQuote(): Promise<void> {
    try {
      const quotes = [
        'The only way to do great work is to love what you do. - Steve Jobs',
        'Success is not final, failure is not fatal. - Winston Churchill',
        'Believe you can and you\'re halfway there. - Theodore Roosevelt',
        'The future belongs to those who believe in their dreams. - Eleanor Roosevelt',
        'It always seems impossible until it\'s done. - Nelson Mandela'
      ];

      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      this.updateVariable('fun.quote', quote);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  }

  /**
   * Fetch random fact
   */
  private async fetchFact(): Promise<void> {
    try {
      const facts = [
        'The first livestream was in 1993, showing a coffee pot at Cambridge University.',
        'The word "stream" comes from the Old English word "strēam" meaning river.',
        'More than 500 hours of video are uploaded to streaming platforms every minute.',
        'The average person watches over 100 minutes of online video per day.',
        'The world\'s longest livestream lasted over 624 hours (26 days)!'
      ];

      const fact = facts[Math.floor(Math.random() * facts.length)];
      this.updateVariable('fun.fact', fact);
    } catch (error) {
      console.error('Failed to fetch fact:', error);
    }
  }

  /**
   * Start live updates for dynamic variables
   */
  private startLiveUpdates(): void {
    // Update time variables every second
    setInterval(() => {
      this.updateVariable('time.hour', new Date().getHours());
      this.updateVariable('time.minute', new Date().getMinutes());
      this.updateVariable('time.timestamp', Date.now());
      this.updateVariable('time.formatted', new Date().toLocaleString());
      this.updateVariable('time.dayName', this.getDayName());
      this.updateVariable('time.monthName', this.getMonthName());
    }, 1000);

    // Update random variables every 5 seconds
    setInterval(() => {
      this.updateVariable('math.random', Math.random());
      this.updateVariable('math.randomInt', Math.floor(Math.random() * 100));
    }, 5000);

    // Update external APIs every 5 minutes
    setInterval(() => {
      this.fetchExternalData();
    }, 5 * 60 * 1000);

    // Initial fetch
    this.fetchExternalData();
  }

  private getDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  private getMonthName(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  }

  /**
   * Get variable documentation
   */
  getDocumentation(): string {
    const categories = this.variablesByCategory();
    let doc = '# Broady Scripting Variables\n\nAll available variables for use in scripts:\n\n';

    Object.entries(categories).forEach(([category, vars]) => {
      doc += `\n## ${category.toUpperCase()} Variables\n\n`;

      vars.forEach(v => {
        const liveIndicator = v.live ? ' 🔴 LIVE' : '';
        doc += `- **${v.name}**${liveIndicator}: ${v.description}\n`;
        doc += `  - Type: ${v.type}\n`;
        doc += `  - Example: \`{{${v.name}}}\`\n\n`;
      });
    });

    return doc;
  }
}
