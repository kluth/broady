import {
  FacebookOAuthToken,
  FacebookTokenData,
  FacebookUser,
  FacebookPage,
  FacebookLiveVideo,
  FacebookOAuthConfig,
  FacebookScope,
  FacebookAPIError,
  FacebookLiveStatus,
} from '../models/facebook-oauth.model';

/**
 * Facebook OAuth Service
 * Handles authentication and API interactions with Facebook Graph API
 */
export class FacebookOAuthService {
  private config: FacebookOAuthConfig;
  private tokenData: FacebookTokenData | null = null;

  private readonly AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
  private readonly TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
  private readonly API_BASE_URL = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      response_type: 'code',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<FacebookTokenData> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code,
    });

    const response = await fetch(`${this.TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
      const error: FacebookAPIError = await response.json();
      throw new Error(`Facebook OAuth error: ${error.error.message}`);
    }

    const tokenResponse: FacebookOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Get long-lived access token (60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookTokenData> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${this.TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
      const error: FacebookAPIError = await response.json();
      throw new Error(`Facebook token exchange error: ${error.error.message}`);
    }

    const tokenResponse: FacebookOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Get authenticated user information
   */
  async getUser(accessToken?: string): Promise<FacebookUser> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/me?fields=id,name,email,picture',
      token
    );

    return await response.json();
  }

  /**
   * Get user's pages
   */
  async getPages(accessToken?: string): Promise<FacebookPage[]> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/me/accounts?fields=id,name,access_token,category,category_list,tasks',
      token
    );
    const data = await response.json();

    return data.data || [];
  }

  /**
   * Create live video
   */
  async createLiveVideo(
    pageId: string,
    title: string,
    description: string,
    pageAccessToken: string
  ): Promise<FacebookLiveVideo> {
    const response = await this.makeApiRequest(
      `/${pageId}/live_videos`,
      pageAccessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          status: FacebookLiveStatus.UNPUBLISHED,
        }),
      }
    );

    return await response.json();
  }

  /**
   * Go live
   */
  async goLive(
    liveVideoId: string,
    pageAccessToken: string
  ): Promise<FacebookLiveVideo> {
    const response = await this.makeApiRequest(
      `/${liveVideoId}`,
      pageAccessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          status: FacebookLiveStatus.LIVE_NOW,
        }),
      }
    );

    return await response.json();
  }

  /**
   * End live video
   */
  async endLiveVideo(
    liveVideoId: string,
    pageAccessToken: string
  ): Promise<FacebookLiveVideo> {
    const response = await this.makeApiRequest(
      `/${liveVideoId}`,
      pageAccessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          end_live_video: true,
        }),
      }
    );

    return await response.json();
  }

  /**
   * Get live video
   */
  async getLiveVideo(
    liveVideoId: string,
    pageAccessToken: string
  ): Promise<FacebookLiveVideo> {
    const response = await this.makeApiRequest(
      `/${liveVideoId}?fields=id,broadcast_start_time,creation_time,description,embed_html,is_manual_mode,is_reference_only,live_views,permalink_url,status,stream_url,secure_stream_url,title,video`,
      pageAccessToken
    );

    return await response.json();
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: FacebookTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): FacebookTokenData | null {
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
   * Make authenticated API request to Facebook
   */
  private async makeApiRequest(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const separator = endpoint.includes('?') ? '&' : '?';

    const response = await fetch(`${url}${separator}access_token=${accessToken}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: FacebookAPIError = await response.json();
      throw new Error(`Facebook API error: ${error.error.message}`);
    }

    return response;
  }

  /**
   * Parse token response
   */
  private parseTokenResponse(response: FacebookOAuthToken): FacebookTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    return {
      accessToken: response.access_token,
      expiresAt,
      tokenType: response.token_type,
      scopes: this.config.scopes,
    };
  }
}
