/**
 * Twitch OAuth Models and Interfaces
 */

/**
 * Twitch OAuth Token Response
 */
export interface TwitchOAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string[];
  token_type: string;
}

/**
 * Twitch OAuth Token with metadata
 */
export interface TwitchTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  tokenType: string;
}

/**
 * Twitch User Information
 */
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

/**
 * Twitch Stream Information
 */
export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: 'live' | '';
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

/**
 * Twitch Stream Key
 */
export interface TwitchStreamKey {
  stream_key: string;
}

/**
 * Twitch OAuth Configuration
 */
export interface TwitchOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: TwitchScope[];
}

/**
 * Twitch OAuth Scopes
 * See: https://dev.twitch.tv/docs/authentication/scopes
 */
export enum TwitchScope {
  // Analytics
  ANALYTICS_READ_EXTENSIONS = 'analytics:read:extensions',
  ANALYTICS_READ_GAMES = 'analytics:read:games',

  // Bits
  BITS_READ = 'bits:read',

  // Channel
  CHANNEL_READ_SUBSCRIPTIONS = 'channel:read:subscriptions',
  CHANNEL_READ_STREAM_KEY = 'channel:read:stream_key',
  CHANNEL_EDIT_COMMERCIAL = 'channel:edit:commercial',
  CHANNEL_READ_HYPE_TRAIN = 'channel:read:hype_train',
  CHANNEL_MANAGE_BROADCAST = 'channel:manage:broadcast',
  CHANNEL_READ_REDEMPTIONS = 'channel:read:redemptions',
  CHANNEL_MANAGE_REDEMPTIONS = 'channel:manage:redemptions',

  // Clips
  CLIPS_EDIT = 'clips:edit',

  // Moderation
  MODERATION_READ = 'moderation:read',
  MODERATOR_MANAGE_BANNED_USERS = 'moderator:manage:banned_users',
  MODERATOR_READ_BLOCKED_TERMS = 'moderator:read:blocked_terms',
  MODERATOR_MANAGE_BLOCKED_TERMS = 'moderator:manage:blocked_terms',
  MODERATOR_MANAGE_CHAT_MESSAGES = 'moderator:manage:chat_messages',

  // User
  USER_EDIT = 'user:edit',
  USER_READ_EMAIL = 'user:read:email',
  USER_READ_BROADCAST = 'user:read:broadcast',

  // Chat
  CHAT_READ = 'chat:read',
  CHAT_EDIT = 'chat:edit',

  // Whispers
  WHISPERS_READ = 'whispers:read',
  WHISPERS_EDIT = 'whispers:edit',
}

/**
 * Twitch API Error Response
 */
export interface TwitchAPIError {
  error: string;
  status: number;
  message: string;
}
