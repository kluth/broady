import {
  LinkedInOAuthToken,
  LinkedInTokenData,
  LinkedInProfile,
  LinkedInOrganization,
  LinkedInOAuthConfig,
  LinkedInScope,
  LinkedInAPIError,
  LinkedInShare,
} from '../models/linkedin-oauth.model';

/**
 * LinkedIn OAuth Service
 * Handles authentication and API interactions with LinkedIn API
 */
export class LinkedInOAuthService {
  private config: LinkedInOAuthConfig;
  private tokenData: LinkedInTokenData | null = null;

  private readonly AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
  private readonly TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
  private readonly API_BASE_URL = 'https://api.linkedin.com/v2';

  constructor(config: LinkedInOAuthConfig) {
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
  async exchangeCodeForToken(code: string): Promise<LinkedInTokenData> {
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
      throw new Error(
        `LinkedIn OAuth error: ${error.error_description || error.error}`
      );
    }

    const tokenResponse: LinkedInOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<LinkedInTokenData> {
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
      throw new Error(
        `LinkedIn token refresh error: ${error.error_description || error.error}`
      );
    }

    const tokenResponse: LinkedInOAuthToken = await response.json();
    this.tokenData = this.parseTokenResponse(tokenResponse);
    return this.tokenData;
  }

  /**
   * Get authenticated user profile
   */
  async getProfile(accessToken?: string): Promise<LinkedInProfile> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/userinfo',
      token
    );

    return await response.json();
  }

  /**
   * Get user's organizations
   */
  async getOrganizations(accessToken?: string): Promise<LinkedInOrganization[]> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await this.makeApiRequest(
      '/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,vanityName,localizedName,localizedDescription,logoV2)))',
      token
    );
    const data = await response.json();

    return (
      data.elements?.map((el: { organization: LinkedInOrganization }) => el.organization) ||
      []
    );
  }

  /**
   * Create a share/post
   */
  async createShare(
    authorUrn: string,
    text: string,
    visibility: string = 'PUBLIC',
    accessToken?: string
  ): Promise<LinkedInShare> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const body = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    };

    const response = await this.makeApiRequest('/ugcPosts', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return await response.json();
  }

  /**
   * Upload video for live streaming
   */
  async initializeVideoUpload(
    authorUrn: string,
    accessToken?: string
  ): Promise<{ uploadUrl: string; asset: string }> {
    const token = accessToken || this.tokenData?.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    const body = {
      initializeUploadRequest: {
        owner: authorUrn,
        fileSizeBytes: 0,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    };

    const response = await this.makeApiRequest(
      '/videos?action=initializeUpload',
      token,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return {
      uploadUrl:
        data.value.uploadMechanism[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ].uploadUrl,
      asset: data.value.asset,
    };
  }

  /**
   * Set current token data
   */
  setTokenData(tokenData: LinkedInTokenData): void {
    this.tokenData = tokenData;
  }

  /**
   * Get current token data
   */
  getTokenData(): LinkedInTokenData | null {
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
   * Make authenticated API request to LinkedIn
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
        'X-Restli-Protocol-Version': '2.0.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: LinkedInAPIError = await response.json();
      throw new Error(`LinkedIn API error: ${error.message} (${error.serviceErrorCode})`);
    }

    return response;
  }

  /**
   * Parse token response
   */
  private parseTokenResponse(response: LinkedInOAuthToken): LinkedInTokenData {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

    let refreshExpiresAt: Date | undefined;
    if (response.refresh_token_expires_in) {
      refreshExpiresAt = new Date();
      refreshExpiresAt.setSeconds(
        refreshExpiresAt.getSeconds() + response.refresh_token_expires_in
      );
    }

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      refreshExpiresAt,
      scopes: response.scope.split(' '),
    };
  }
}
