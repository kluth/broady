/**
 * Facebook (Meta) OAuth Models and Interfaces
 */

/**
 * Facebook OAuth Token Response
 */
export interface FacebookOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Facebook OAuth Token with metadata
 */
export interface FacebookTokenData {
  accessToken: string;
  expiresAt: Date;
  tokenType: string;
  scopes: string[];
}

/**
 * Facebook User Information
 */
export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}

/**
 * Facebook Page Information
 */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  category_list: Array<{
    id: string;
    name: string;
  }>;
  tasks: string[];
}

/**
 * Facebook Live Video
 */
export interface FacebookLiveVideo {
  id: string;
  broadcast_start_time: string;
  creation_time: string;
  dash_ingest_url: string;
  dash_preview_url: string;
  description: string;
  embed_html: string;
  is_manual_mode: boolean;
  is_reference_only: boolean;
  live_views: number;
  permalink_url: string;
  planned_start_time: string;
  seconds_left: number;
  secure_stream_url: string;
  status: FacebookLiveStatus;
  stream_url: string;
  title: string;
  video: {
    id: string;
  };
}

/**
 * Facebook Live Status
 */
export enum FacebookLiveStatus {
  UNPUBLISHED = 'UNPUBLISHED',
  LIVE_NOW = 'LIVE_NOW',
  SCHEDULED_UNPUBLISHED = 'SCHEDULED_UNPUBLISHED',
  SCHEDULED_LIVE = 'SCHEDULED_LIVE',
  SCHEDULED_CANCELED = 'SCHEDULED_CANCELED',
  PROCESSING = 'PROCESSING',
  VOD = 'VOD',
}

/**
 * Facebook OAuth Configuration
 */
export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: FacebookScope[];
}

/**
 * Facebook OAuth Scopes
 * See: https://developers.facebook.com/docs/permissions/reference
 */
export enum FacebookScope {
  // Public
  PUBLIC_PROFILE = 'public_profile',
  EMAIL = 'email',

  // Pages
  PAGES_SHOW_LIST = 'pages_show_list',
  PAGES_READ_ENGAGEMENT = 'pages_read_engagement',
  PAGES_MANAGE_METADATA = 'pages_manage_metadata',
  PAGES_MANAGE_POSTS = 'pages_manage_posts',
  PAGES_MANAGE_ENGAGEMENT = 'pages_manage_engagement',

  // Live Video
  PUBLISH_VIDEO = 'publish_video',
  PAGES_MANAGE_INSTANT_ARTICLES = 'pages_manage_instant_articles',

  // User
  USER_VIDEOS = 'user_videos',
  USER_POSTS = 'user_posts',
}

/**
 * Facebook API Error Response
 */
export interface FacebookAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}
