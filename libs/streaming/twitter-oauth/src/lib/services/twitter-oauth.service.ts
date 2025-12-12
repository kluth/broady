import {
  TwitterOAuthToken,
  TwitterTokenData,
  TwitterUser,
  TwitterOAuthConfig,
  TwitterScope,
  TwitterAPIError,
  TwitterMediaUpload,
  TwitterBroadcast,
  TwitterBroadcastState,
} from '../models/twitter-oauth.model';

/**
 * Twitter/X OAuth Service
 * Handles authentication and API interactions with Twitter API v2
 */
export class TwitterOAuthService {
  private config: TwitterOAuthConfig;
  private tokenData: TwitterTokenData | null = null;

  private readonly AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
  private readonly TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
  private readonly REVOKE_URL = 'https://api.twitter.com/2/oauth2/revoke';
  private readonly API_BASE_URL = 'https://api.twitter.com/2';

  constructor(config: TwitterOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL with PKCE
   */
  getAuthorizationUrl(codeChallenge: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<TwitterTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(
          `${this.config.clientId}:${this.config.clientSecret}`
        )}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error: TwitterAPIError = await response.json();
      throw new Error(
        `Twitter OAuth error: ${error.detail || error.title || 'Unknown error'}`
      );
    }

    const tokenResponse: TwitterOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitterTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(
          `${this.config.clientId}:${this.config.clientSecret}`
        )}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error: TwitterAPIError = await response.json();
      throw new Error(
        `Twitter token refresh error: ${error.detail || error.title || 'Unknown error'}`
      );
    }

    const tokenResponse: TwitterOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      token: accessToken,
      token_type_hint: 'access_token',
    });

    const response = await fetch(this.REVOKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(
          `${this.config.clientId}:${this.config.clientSecret}`
        )}`,
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
  async getUser(accessToken?: string): Promise<TwitterUser> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/users/me?user.fields=created_at,description,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type,withheld',
      token
    );
    const data = await response.json();

    if (data.errors) {
      throw new Error(`Twitter API error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  /**
   * Create a tweet
   */
  async createTweet(
    text: string,
    accessToken?: string
  ): Promise<{ id: string; text: string }> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest('/tweets', token, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    const data = await response.json();

    if (data.errors) {
      throw new Error(`Twitter API error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  /**
   * Upload media
   */
  async uploadMedia(
    mediaData: Blob,
    mediaType: string,
    accessToken?: string
  ): Promise<TwitterMediaUpload> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const formData = new FormData();
    formData.append('media', mediaData);
    formData.append('media_type', mediaType);

    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return await response.json();
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: TwitterTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): TwitterTokenData | null {
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
   * Generate PKCE code verifier
   */
  static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Make authenticated API request to Twitter
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
        ...options.headers,
      },
    });

    return response;
  }

  /**
   * Parse token response
   */
  private parseTokenResponse(response: TwitterOAuthToken): TwitterTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      scopes: response.scope.split(' '),
      tokenType: response.token_type,
    };
  }
}
