import {
  YouTubeOAuthToken,
  YouTubeTokenData,
  YouTubeChannel,
  YouTubeLiveBroadcast,
  YouTubeLiveStream,
  YouTubeOAuthConfig,
  YouTubeScope,
  YouTubeAPIError,
  YouTubeBroadcastStatus,
  YouTubePrivacyStatus,
} from '../models/youtube-oauth.model';

/**
 * YouTube OAuth Service
 * Handles authentication and API interactions with YouTube Data API v3
 */
export class YouTubeOAuthService {
  private config: YouTubeOAuthConfig;
  private tokenData: YouTubeTokenData | null = null;

  private readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private readonly REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

  constructor(config: YouTubeOAuthConfig) {
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
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<YouTubeTokenData> {
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
      const error = await response.json();
      throw new Error(`YouTube OAuth error: ${error.error_description || error.error}`);
    }

    const tokenResponse: YouTubeOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<YouTubeTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube token refresh error: ${error.error_description || error.error}`);
    }

    const tokenResponse: YouTubeOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      token: accessToken,
    });

    const response = await fetch(this.REVOKE_URL, {
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
   * Get authenticated user's channel
   */
  async getChannel(accessToken?: string): Promise<YouTubeChannel> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/channels?part=snippet,contentDetails,statistics&mine=true',
      token
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0] as YouTubeChannel;
    }

    throw new Error('Failed to get channel information');
  }

  /**
   * Create a live broadcast
   */
  async createLiveBroadcast(
    title: string,
    description: string,
    scheduledStartTime: Date,
    privacyStatus: YouTubePrivacyStatus = YouTubePrivacyStatus.PUBLIC,
    accessToken?: string
  ): Promise<YouTubeLiveBroadcast> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const body = {
      snippet: {
        title,
        description,
        scheduledStartTime: scheduledStartTime.toISOString(),
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
      contentDetails: {
        enableAutoStart: true,
        enableAutoStop: true,
        enableDvr: true,
        enableContentEncryption: false,
        enableEmbed: true,
        recordFromStart: true,
        startWithSlate: false,
        enableClosedCaptions: true,
        closedCaptionsType: 'closedCaptionsDisabled',
        enableLowLatency: true,
        latencyPreference: 'ultraLow',
        projection: 'rectangular',
      },
    };

    const response = await this.makeApiRequest(
      '/liveBroadcasts?part=snippet,status,contentDetails',
      token,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return await response.json();
  }

  /**
   * Create a live stream
   */
  async createLiveStream(
    title: string,
    resolution: string = '1080p',
    frameRate: string = '60fps',
    accessToken?: string
  ): Promise<YouTubeLiveStream> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const body = {
      snippet: {
        title,
      },
      cdn: {
        frameRate,
        ingestionType: 'rtmp',
        resolution,
      },
    };

    const response = await this.makeApiRequest(
      '/liveStreams?part=snippet,cdn,status',
      token,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return await response.json();
  }

  /**
   * Bind broadcast to stream
   */
  async bindBroadcast(
    broadcastId: string,
    streamId: string,
    accessToken?: string
  ): Promise<YouTubeLiveBroadcast> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      `/liveBroadcasts/bind?id=${broadcastId}&streamId=${streamId}&part=snippet,status,contentDetails`,
      token,
      {
        method: 'POST',
      }
    );

    return await response.json();
  }

  /**
   * Transition broadcast to live
   */
  async transitionBroadcast(
    broadcastId: string,
    status: YouTubeBroadcastStatus,
    accessToken?: string
  ): Promise<YouTubeLiveBroadcast> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      `/liveBroadcasts/transition?broadcastStatus=${status}&id=${broadcastId}&part=snippet,status,contentDetails`,
      token,
      {
        method: 'POST',
      }
    );

    return await response.json();
  }

  /**
   * Get live stream by ID
   */
  async getLiveStream(
    streamId: string,
    accessToken?: string
  ): Promise<YouTubeLiveStream> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      `/liveStreams?part=snippet,cdn,status&id=${streamId}`,
      token
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0];
    }

    throw new Error('Live stream not found');
  }

  /**
   * Get live broadcast by ID
   */
  async getLiveBroadcast(
    broadcastId: string,
    accessToken?: string
  ): Promise<YouTubeLiveBroadcast> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      `/liveBroadcasts?part=snippet,status,contentDetails&id=${broadcastId}`,
      token
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0];
    }

    throw new Error('Live broadcast not found');
  }

  /**
   * Delete live broadcast
   */
  async deleteLiveBroadcast(
    broadcastId: string,
    accessToken?: string
  ): Promise<void> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    await this.makeApiRequest(`/liveBroadcasts?id=${broadcastId}`, token, {
      method: 'DELETE',
    });
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: YouTubeTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): YouTubeTokenData | null {
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
   * Make authenticated API request to YouTube
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
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: YouTubeAPIError = await response.json();
      throw new Error(
        `YouTube API error: ${error.error.message} (${error.error.code})`
      );
    }

    return response;
  }

  /**
   * Parse token response
   */
  private parseTokenResponse(response: YouTubeOAuthToken): YouTubeTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      scopes: response.scope.split(' '),
      tokenType: response.token_type,
      idToken: response.id_token,
    };
  }
}
