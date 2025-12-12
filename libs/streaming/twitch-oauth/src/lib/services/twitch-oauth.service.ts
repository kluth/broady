import {
  TwitchOAuthToken,
  TwitchTokenData,
  TwitchUser,
  TwitchStream,
  TwitchStreamKey,
  TwitchOAuthConfig,
  TwitchScope,
  TwitchAPIError,
} from '../models/twitch-oauth.model';

/**
 * Twitch OAuth Service
 * Handles authentication and API interactions with Twitch
 */
export class TwitchOAuthService {
  private config: TwitchOAuthConfig;
  private tokenData: TwitchTokenData | null = null;

  private readonly AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';
  private readonly TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
  private readonly API_BASE_URL = 'https://api.twitch.tv/helix';
  private readonly VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';

  constructor(config: TwitchOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TwitchTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error: TwitchAPIError = await response.json();
      throw new Error(`Twitch OAuth error: ${error.message}`);
    }

    const tokenResponse: TwitchOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitchTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error: TwitchAPIError = await response.json();
      throw new Error(`Twitch token refresh error: ${error.message}`);
    }

    const tokenResponse: TwitchOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch(this.VALIDATE_URL, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    return response.ok;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      token: accessToken,
    });

    const response = await fetch(`https://id.twitch.tv/oauth2/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Get authenticated user information
   */
  async getUser(accessToken?: string): Promise<TwitchUser> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest('/users', token);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0] as TwitchUser;
    }

    throw new Error('Failed to get user information');
  }

  /**
   * Get user's stream key
   */
  async getStreamKey(accessToken?: string): Promise<string> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const user = await this.getUser(token);
    const response = await this.makeApiRequest(
      `/streams/key?broadcaster_id=${user.id}`,
      token
    );
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const streamKey: TwitchStreamKey = data.data[0];
      return streamKey.stream_key;
    }

    throw new Error('Failed to get stream key');
  }

  /**
   * Get stream information
   */
  async getStream(
    userId: string,
    accessToken?: string
  ): Promise<TwitchStream | null> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      `/streams?user_id=${userId}`,
      token
    );
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0] as TwitchStream;
    }

    return null;
  }

  /**
   * Update stream title and category
   */
  async updateStream(
    broadcasterId: string,
    title?: string,
    gameId?: string,
    accessToken?: string
  ): Promise<void> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const body: { title?: string; game_id?: string } = {};
    if (title) body.title = title;
    if (gameId) body.game_id = gameId;

    const response = await this.makeApiRequest(
      `/channels?broadcaster_id=${broadcasterId}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update stream');
    }
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: TwitchTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): TwitchTokenData | null {
    return this.tokenData;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenData) return true;
    return new Date() >= this.tokenData.expiresAt;
  }

  /**
   * Make authenticated API request to Twitch
   */
  private async makeApiRequest(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Client-ID': this.config.clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: TwitchAPIError = await response.json();
      throw new Error(`Twitch API error: ${error.message}`);
    }

    return response;
  }

  /**
   * Parse token response
   */
  private parseTokenResponse(response: TwitchOAuthToken): TwitchTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      scopes: response.scope,
      tokenType: response.token_type,
    };
  }
}
