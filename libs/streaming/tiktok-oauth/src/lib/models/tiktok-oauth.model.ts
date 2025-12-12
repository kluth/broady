/**
 * TikTok OAuth Models and Interfaces
 */

/**
 * TikTok OAuth Token Response
 */
export interface TikTokOAuthToken {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/**
 * TikTok OAuth Token with metadata
 */
export interface TikTokTokenData {
  accessToken: string;
  refreshToken: string;
  openId: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  scopes: string[];
  tokenType: string;
}

/**
 * TikTok User Information
 */
export interface TikTokUser {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

/**
 * TikTok Live Room Information
 */
export interface TikTokLiveRoom {
  room_id: string;
  title: string;
  cover_url: string;
  stream_url: string;
  stream_url_hls: string;
  push_url: string;
  push_url_rtmp: string;
  status: TikTokLiveStatus;
  start_time: number;
  end_time?: number;
  viewer_count: number;
  total_viewer_count: number;
  like_count: number;
  comment_count: number;
}

/**
 * TikTok Live Status
 */
export enum TikTokLiveStatus {
  IDLE = 0,
  LIVE = 2,
  PAUSED = 3,
  ENDED = 4,
}

/**
 * TikTok Video Information
 */
export interface TikTokVideo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

/**
 * TikTok OAuth Configuration
 */
export interface TikTokOAuthConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  scopes: TikTokScope[];
}

/**
 * TikTok OAuth Scopes
 * See: https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens
 */
export enum TikTokScope {
  // User
  USER_INFO_BASIC = 'user.info.basic',
  USER_INFO_PROFILE = 'user.info.profile',
  USER_INFO_STATS = 'user.info.stats',

  // Video
  VIDEO_LIST = 'video.list',
  VIDEO_UPLOAD = 'video.upload',
  VIDEO_PUBLISH = 'video.publish',

  // Live
  LIVE_ROOM_INFO = 'live.room.info',
  LIVE_ROOM_MANAGE = 'live.room.manage',

  // Share
  SHARE_SOUND_CREATE = 'share.sound.create',
}

/**
 * TikTok API Error Response
 */
export interface TikTokAPIError {
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}
