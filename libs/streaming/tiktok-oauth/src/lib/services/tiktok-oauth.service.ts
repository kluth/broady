import {
  TikTokOAuthToken,
  TikTokTokenData,
  TikTokUser,
  TikTokLiveRoom,
  TikTokOAuthConfig,
  TikTokScope,
  TikTokAPIError,
} from '../models/tiktok-oauth.model';

/**
 * TikTok OAuth Service
 * Handles authentication and API interactions with TikTok API
 */
export class TikTokOAuthService {
  private config: TikTokOAuthConfig;
  private tokenData: TikTokTokenData | null = null;

  private readonly AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
  private readonly TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token';
  private readonly API_BASE_URL = 'https://open.tiktokapis.com';

  constructor(config: TikTokOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(','),
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TikTokTokenData> {
    const body = {
      client_key: this.config.clientKey,
      client_secret: this.config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    };

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok OAuth error: ${data.error.message}`);
    }

    if (!data.data) {
      throw new Error('Invalid token response from TikTok');
    }

    const tokenResponse: TikTokOAuthToken = data.data;
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokTokenData> {
    const body = {
      client_key: this.config.clientKey,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok token refresh error: ${data.error.message}`);
    }

    const tokenResponse: TikTokOAuthToken = data.data;
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const body = {
      client_key: this.config.clientKey,
      client_secret: this.config.clientSecret,
      token: accessToken,
    };

    const response = await fetch(`${this.API_BASE_URL}/v2/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Get authenticated user information
   */
  async getUser(accessToken?: string): Promise<TikTokUser> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
      token
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message}`);
    }

    return data.data.user;
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: TikTokTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): TikTokTokenData | null {
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
   * Make authenticated API request to TikTok
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
  private parseTokenResponse(response: TikTokOAuthToken): TikTokTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setSeconds(
      refreshExpiresAt.getSeconds() + response.refresh_expires_in
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      openId: response.open_id,
      expiresAt,
      refreshExpiresAt,
      scopes: response.scope.split(','),
      tokenType: response.token_type,
    };
  }
}
