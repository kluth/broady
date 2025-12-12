/**
 * Twitter/X OAuth Models and Interfaces
 */

/**
 * Twitter OAuth 2.0 Token Response
 */
export interface TwitterOAuthToken {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

/**
 * Twitter OAuth Token with metadata
 */
export interface TwitterTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  tokenType: string;
}

/**
 * Twitter User Information
 */
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  created_at: string;
  description: string;
  location?: string;
  pinned_tweet_id?: string;
  profile_image_url: string;
  protected: boolean;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  url?: string;
  verified: boolean;
  verified_type?: string;
  withheld?: {
    country_codes: string[];
    scope: string;
  };
}

/**
 * Twitter Space (Live Audio)
 */
export interface TwitterSpace {
  id: string;
  state: TwitterSpaceState;
  created_at: string;
  ended_at?: string;
  host_ids: string[];
  is_ticketed: boolean;
  lang?: string;
  participant_count: number;
  scheduled_start?: string;
  speaker_ids: string[];
  started_at?: string;
  title: string;
  updated_at: string;
}

/**
 * Twitter Space State
 */
export enum TwitterSpaceState {
  LIVE = 'live',
  SCHEDULED = 'scheduled',
  ENDED = 'ended',
}

/**
 * Twitter Media Upload Response
 */
export interface TwitterMediaUpload {
  media_id: number;
  media_id_string: string;
  media_key: string;
  size: number;
  expires_after_secs: number;
  processing_info?: {
    state: string;
    check_after_secs?: number;
    progress_percent?: number;
    error?: {
      code: number;
      name: string;
      message: string;
    };
  };
}

/**
 * Twitter Broadcast Information
 */
export interface TwitterBroadcast {
  broadcast_id: string;
  state: TwitterBroadcastState;
  title: string;
  source_type: string;
  start_time?: string;
  end_time?: string;
  stream_url: string;
  stream_key: string;
  rtmp_url: string;
  width: number;
  height: number;
  language: string;
}

/**
 * Twitter Broadcast State
 */
export enum TwitterBroadcastState {
  NOT_STARTED = 'NOT_STARTED',
  RUNNING = 'RUNNING',
  ENDED = 'ENDED',
}

/**
 * Twitter OAuth Configuration
 */
export interface TwitterOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: TwitterScope[];
}

/**
 * Twitter OAuth 2.0 Scopes
 * See: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export enum TwitterScope {
  // Tweet
  TWEET_READ = 'tweet.read',
  TWEET_WRITE = 'tweet.write',
  TWEET_MODERATE_WRITE = 'tweet.moderate.write',

  // User
  USERS_READ = 'users.read',
  FOLLOWS_READ = 'follows.read',
  FOLLOWS_WRITE = 'follows.write',
  OFFLINE_ACCESS = 'offline.access',

  // Space
  SPACE_READ = 'space.read',

  // Mute
  MUTE_READ = 'mute.read',
  MUTE_WRITE = 'mute.write',

  // Like
  LIKE_READ = 'like.read',
  LIKE_WRITE = 'like.write',

  // List
  LIST_READ = 'list.read',
  LIST_WRITE = 'list.write',

  // Block
  BLOCK_READ = 'block.read',
  BLOCK_WRITE = 'block.write',

  // Bookmark
  BOOKMARK_READ = 'bookmark.read',
  BOOKMARK_WRITE = 'bookmark.write',
}

/**
 * Twitter API Error Response
 */
export interface TwitterAPIError {
  errors: Array<{
    message: string;
    code: number;
  }>;
  title?: string;
  detail?: string;
  type?: string;
}
