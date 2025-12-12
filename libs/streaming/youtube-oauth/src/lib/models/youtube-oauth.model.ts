/**
 * YouTube OAuth Models and Interfaces
 */

/**
 * YouTube OAuth Token Response
 */
export interface YouTubeOAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * YouTube OAuth Token with metadata
 */
export interface YouTubeTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  tokenType: string;
  idToken?: string;
}

/**
 * YouTube Channel Information
 */
export interface YouTubeChannel {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
    localized: {
      title: string;
      description: string;
    };
    country?: string;
  };
  contentDetails?: {
    relatedPlaylists: {
      likes: string;
      uploads: string;
    };
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

/**
 * YouTube Thumbnail
 */
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * YouTube Live Broadcast
 */
export interface YouTubeLiveBroadcast {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
    scheduledStartTime: string;
    actualStartTime?: string;
    actualEndTime?: string;
    isDefaultBroadcast: boolean;
    liveChatId?: string;
  };
  status: {
    lifeCycleStatus: YouTubeBroadcastStatus;
    privacyStatus: YouTubePrivacyStatus;
    recordingStatus: YouTubeRecordingStatus;
    madeForKids: boolean;
    selfDeclaredMadeForKids: boolean;
  };
  contentDetails: {
    boundStreamId?: string;
    monitorStream?: {
      enableMonitorStream: boolean;
      broadcastStreamDelayMs: number;
    };
    enableEmbed: boolean;
    enableDvr: boolean;
    enableContentEncryption: boolean;
    startWithSlate: boolean;
    recordFromStart: boolean;
    enableClosedCaptions: boolean;
    closedCaptionsType: string;
    enableLowLatency: boolean;
    latencyPreference: string;
    projection: string;
    enableAutoStart: boolean;
    enableAutoStop: boolean;
  };
}

/**
 * YouTube Live Stream
 */
export interface YouTubeLiveStream {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    isDefaultStream: boolean;
  };
  cdn: {
    ingestionType: string;
    ingestionInfo: {
      streamName: string;
      ingestionAddress: string;
      backupIngestionAddress?: string;
      rtmpsIngestionAddress?: string;
      rtmpsBackupIngestionAddress?: string;
    };
    resolution: string;
    frameRate: string;
  };
  status: {
    streamStatus: YouTubeStreamStatus;
    healthStatus?: {
      status: string;
      lastUpdateTimeSeconds: string;
    };
  };
}

/**
 * YouTube Broadcast Status
 */
export enum YouTubeBroadcastStatus {
  CREATED = 'created',
  READY = 'ready',
  TESTING = 'testing',
  LIVE = 'live',
  COMPLETE = 'complete',
  REVOKED = 'revoked',
  TEST_STARTING = 'testStarting',
  LIVE_STARTING = 'liveStarting',
}

/**
 * YouTube Privacy Status
 */
export enum YouTubePrivacyStatus {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

/**
 * YouTube Recording Status
 */
export enum YouTubeRecordingStatus {
  RECORDING = 'recording',
  RECORDED = 'recorded',
  NOT_RECORDING = 'notRecording',
}

/**
 * YouTube Stream Status
 */
export enum YouTubeStreamStatus {
  CREATED = 'created',
  READY = 'ready',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

/**
 * YouTube OAuth Configuration
 */
export interface YouTubeOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: YouTubeScope[];
}

/**
 * YouTube OAuth Scopes
 * See: https://developers.google.com/identity/protocols/oauth2/scopes#youtube
 */
export enum YouTubeScope {
  // YouTube Data API v3
  YOUTUBE = 'https://www.googleapis.com/auth/youtube',
  YOUTUBE_READONLY = 'https://www.googleapis.com/auth/youtube.readonly',
  YOUTUBE_UPLOAD = 'https://www.googleapis.com/auth/youtube.upload',
  YOUTUBE_FORCE_SSL = 'https://www.googleapis.com/auth/youtube.force-ssl',

  // YouTube Partner
  YOUTUBEPARTNER = 'https://www.googleapis.com/auth/youtubepartner',
  YOUTUBEPARTNER_CHANNEL_AUDIT = 'https://www.googleapis.com/auth/youtubepartner-channel-audit',

  // YouTube Analytics
  YT_ANALYTICS_READONLY = 'https://www.googleapis.com/auth/yt-analytics.readonly',
  YT_ANALYTICS_MONETARY_READONLY = 'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',

  // User Info
  USERINFO_EMAIL = 'https://www.googleapis.com/auth/userinfo.email',
  USERINFO_PROFILE = 'https://www.googleapis.com/auth/userinfo.profile',
}

/**
 * YouTube API Error Response
 */
export interface YouTubeAPIError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
      locationType?: string;
      location?: string;
    }>;
    status: string;
  };
}
