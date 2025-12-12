/**
 * LinkedIn OAuth Models and Interfaces
 */

/**
 * LinkedIn OAuth Token Response
 */
export interface LinkedInOAuthToken {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

/**
 * LinkedIn OAuth Token with metadata
 */
export interface LinkedInTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
  scopes: string[];
}

/**
 * LinkedIn User Profile
 */
export interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale: {
    country: string;
    language: string;
  };
  email?: string;
  email_verified?: boolean;
}

/**
 * LinkedIn Organization
 */
export interface LinkedInOrganization {
  id: string;
  vanityName: string;
  localizedName: string;
  localizedDescription?: string;
  logoV2?: {
    original: string;
    cropped?: string;
  };
}

/**
 * LinkedIn Live Video Session
 */
export interface LinkedInLiveVideo {
  id: string;
  state: LinkedInLiveState;
  streamUrls: Array<{
    streamUrl: string;
    streamKey: string;
  }>;
  createdAt: number;
  lastModifiedAt: number;
}

/**
 * LinkedIn Live State
 */
export enum LinkedInLiveState {
  READY = 'READY',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

/**
 * LinkedIn Video Upload
 */
export interface LinkedInVideoUpload {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
    asset: string;
    mediaArtifact: string;
  };
}

/**
 * LinkedIn Share/Post
 */
export interface LinkedInShare {
  id: string;
  author: string;
  lifecycleState: string;
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: string;
      media?: Array<{
        status: string;
        description: {
          text: string;
        };
        media: string;
        title: {
          text: string;
        };
      }>;
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': string;
  };
}

/**
 * LinkedIn OAuth Configuration
 */
export interface LinkedInOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: LinkedInScope[];
}

/**
 * LinkedIn OAuth Scopes
 * See: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
 */
export enum LinkedInScope {
  // Profile
  OPENID = 'openid',
  PROFILE = 'profile',
  EMAIL = 'email',

  // Content
  W_MEMBER_SOCIAL = 'w_member_social',
  R_BASICPROFILE = 'r_basicprofile',
  R_ORGANIZATION_SOCIAL = 'r_organization_social',
  W_ORGANIZATION_SOCIAL = 'w_organization_social',
  RW_ORGANIZATION_ADMIN = 'rw_organization_admin',

  // Analytics
  R_ORGANIZATION_ANALYTICS = 'r_organization_analytics',
  R_ADS_REPORTING = 'r_ads_reporting',

  // Ads
  R_ADS = 'r_ads',
  RW_ADS = 'rw_ads',
}

/**
 * LinkedIn API Error Response
 */
export interface LinkedInAPIError {
  serviceErrorCode: number;
  message: string;
  status: number;
}
