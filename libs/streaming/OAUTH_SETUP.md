# 🔐 OAuth Setup Guide for Streaming Services

This guide explains how to set up OAuth authentication for all supported streaming platforms in Broady.

## Overview

Yes, **OAuth Apps are required** for each streaming platform you want to use with Broady. This allows users to:

- Authenticate securely with their streaming accounts
- Access platform APIs (stream keys, titles, chat, analytics)
- Manage streams programmatically
- Get real-time stream information

## 📦 Available OAuth Libraries

Broady includes dedicated OAuth libraries for each platform:

- **@org/twitch-oauth** - Twitch authentication and API
- **@org/youtube-oauth** - YouTube/Google authentication and API
- **@org/facebook-oauth** - Facebook Live authentication and API
- **@org/tiktok-oauth** - TikTok Live authentication and API
- **@org/twitter-oauth** - Twitter/X authentication and API
- **@org/linkedin-oauth** - LinkedIn Live authentication and API

---

## 🎮 Twitch OAuth Setup

### 1. Register Your Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click "Register Your Application"
3. Fill in the details:
   - **Name**: Your app name (e.g., "Broady Streaming Studio")
   - **OAuth Redirect URLs**: `http://localhost:4200/auth/twitch/callback`
   - **Category**: Broadcasting Suite
4. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

```bash
# .env.local
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here
TWITCH_REDIRECT_URI=http://localhost:4200/auth/twitch/callback
```

### 3. Usage Example

```typescript
import { TwitchOAuthService, TwitchScope } from '@org/twitch-oauth';

const twitchAuth = new TwitchOAuthService({
  clientId: process.env['TWITCH_CLIENT_ID']!,
  clientSecret: process.env['TWITCH_CLIENT_SECRET']!,
  redirectUri: process.env['TWITCH_REDIRECT_URI']!,
  scopes: [
    TwitchScope.CHANNEL_READ_STREAM_KEY,
    TwitchScope.CHANNEL_MANAGE_BROADCAST,
    TwitchScope.CHAT_READ,
    TwitchScope.CHAT_EDIT,
  ],
});

// Generate authorization URL
const authUrl = twitchAuth.getAuthorizationUrl('optional-state');
// Redirect user to authUrl...

// After callback, exchange code for token
const tokenData = await twitchAuth.exchangeCodeForToken(code);

// Get user info
const user = await twitchAuth.getUser();

// Get stream key
const streamKey = await twitchAuth.getStreamKey();

// Update stream title
await twitchAuth.updateStream(user.id, 'New Stream Title', 'gameId');
```

---

## 📺 YouTube OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 2. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen if prompted
4. Application type: **Web application**
5. Add authorized redirect URI: `http://localhost:4200/auth/youtube/callback`
6. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

```bash
# .env.local
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:4200/auth/youtube/callback
```

### 4. Usage Example

```typescript
import { YouTubeOAuthService, YouTubeScope, YouTubePrivacyStatus } from '@org/youtube-oauth';

const youtubeAuth = new YouTubeOAuthService({
  clientId: process.env['YOUTUBE_CLIENT_ID']!,
  clientSecret: process.env['YOUTUBE_CLIENT_SECRET']!,
  redirectUri: process.env['YOUTUBE_REDIRECT_URI']!,
  scopes: [
    YouTubeScope.YOUTUBE,
    YouTubeScope.YOUTUBE_UPLOAD,
  ],
});

// Generate authorization URL
const authUrl = youtubeAuth.getAuthorizationUrl('optional-state');

// Exchange code for token
const tokenData = await youtubeAuth.exchangeCodeForToken(code);

// Get channel info
const channel = await youtubeAuth.getChannel();

// Create live broadcast
const broadcast = await youtubeAuth.createLiveBroadcast(
  'My Stream Title',
  'Stream description',
  new Date(),
  YouTubePrivacyStatus.PUBLIC
);

// Create live stream
const stream = await youtubeAuth.createLiveStream('My Stream', '1080p', '60fps');

// Bind broadcast to stream
await youtubeAuth.bindBroadcast(broadcast.id, stream.id);

// Get stream URL and key
console.log('RTMP URL:', stream.cdn.ingestionInfo.ingestionAddress);
console.log('Stream Key:', stream.cdn.ingestionInfo.streamName);
```

---

## 📱 Facebook OAuth Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Select "Business" type
4. Fill in app details
5. Add "Facebook Login" product to your app

### 2. Configure OAuth Settings

1. Go to "Facebook Login" > "Settings"
2. Add redirect URI: `http://localhost:4200/auth/facebook/callback`
3. Copy your **App ID** and **App Secret** from Settings > Basic

### 3. Configure Environment Variables

```bash
# .env.local
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:4200/auth/facebook/callback
```

### 4. Usage Example

```typescript
import { FacebookOAuthService, FacebookScope } from '@org/facebook-oauth';

const facebookAuth = new FacebookOAuthService({
  appId: process.env['FACEBOOK_APP_ID']!,
  appSecret: process.env['FACEBOOK_APP_SECRET']!,
  redirectUri: process.env['FACEBOOK_REDIRECT_URI']!,
  scopes: [
    FacebookScope.PAGES_SHOW_LIST,
    FacebookScope.PAGES_MANAGE_POSTS,
    FacebookScope.PUBLISH_VIDEO,
  ],
});

// Generate authorization URL
const authUrl = facebookAuth.getAuthorizationUrl('optional-state');

// Exchange code for token
const tokenData = await facebookAuth.exchangeCodeForToken(code);

// Get user's pages
const pages = await facebookAuth.getPages();

// Create live video on page
const liveVideo = await facebookAuth.createLiveVideo(
  pages[0].id,
  'My Live Stream',
  'Stream description',
  pages[0].access_token
);

// Stream URL and key
console.log('RTMP URL:', liveVideo.stream_url);

// Go live
await facebookAuth.goLive(liveVideo.id, pages[0].access_token);
```

---

## 🎵 TikTok OAuth Setup

### 1. Register TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in and complete registration
3. Create a new app

### 2. Configure App Settings

1. Add "Login Kit" to your app
2. Set redirect URL: `http://localhost:4200/auth/tiktok/callback`
3. Copy your **Client Key** and **Client Secret**

### 3. Configure Environment Variables

```bash
# .env.local
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=http://localhost:4200/auth/tiktok/callback
```

### 4. Usage Example

```typescript
import { TikTokOAuthService, TikTokScope } from '@org/tiktok-oauth';

const tiktokAuth = new TikTokOAuthService({
  clientKey: process.env['TIKTOK_CLIENT_KEY']!,
  clientSecret: process.env['TIKTOK_CLIENT_SECRET']!,
  redirectUri: process.env['TIKTOK_REDIRECT_URI']!,
  scopes: [
    TikTokScope.USER_INFO_BASIC,
    TikTokScope.VIDEO_UPLOAD,
    TikTokScope.LIVE_ROOM_MANAGE,
  ],
});

// Generate authorization URL
const authUrl = tiktokAuth.getAuthorizationUrl('optional-state');

// Exchange code for token
const tokenData = await tiktokAuth.exchangeCodeForToken(code);

// Get user info
const user = await tiktokAuth.getUser();
```

---

## 🐦 Twitter/X OAuth Setup

### 1. Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0
4. Set up user authentication settings

### 2. Configure OAuth 2.0

1. Type: Web App
2. Callback URL: `http://localhost:4200/auth/twitter/callback`
3. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

```bash
# .env.local
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
TWITTER_REDIRECT_URI=http://localhost:4200/auth/twitter/callback
```

### 4. Usage Example (with PKCE)

```typescript
import { TwitterOAuthService, TwitterScope } from '@org/twitter-oauth';

const twitterAuth = new TwitterOAuthService({
  clientId: process.env['TWITTER_CLIENT_ID']!,
  clientSecret: process.env['TWITTER_CLIENT_SECRET']!,
  redirectUri: process.env['TWITTER_REDIRECT_URI']!,
  scopes: [
    TwitterScope.TWEET_READ,
    TwitterScope.TWEET_WRITE,
    TwitterScope.USERS_READ,
    TwitterScope.OFFLINE_ACCESS,
  ],
});

// Generate PKCE challenge
const codeVerifier = TwitterOAuthService.generateCodeVerifier();
const codeChallenge = await TwitterOAuthService.generateCodeChallenge(codeVerifier);

// Store codeVerifier securely for the callback!

// Generate authorization URL
const authUrl = twitterAuth.getAuthorizationUrl(codeChallenge, 'optional-state');

// Exchange code for token (use stored codeVerifier)
const tokenData = await twitterAuth.exchangeCodeForToken(code, codeVerifier);

// Get user info
const user = await twitterAuth.getUser();

// Create tweet
await twitterAuth.createTweet('Going live now! 🎥');
```

---

## 💼 LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Fill in required information
4. Verify your app

### 2. Configure OAuth Settings

1. Go to "Auth" tab
2. Add redirect URL: `http://localhost:4200/auth/linkedin/callback`
3. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

```bash
# .env.local
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:4200/auth/linkedin/callback
```

### 4. Usage Example

```typescript
import { LinkedInOAuthService, LinkedInScope } from '@org/linkedin-oauth';

const linkedinAuth = new LinkedInOAuthService({
  clientId: process.env['LINKEDIN_CLIENT_ID']!,
  clientSecret: process.env['LINKEDIN_CLIENT_SECRET']!,
  redirectUri: process.env['LINKEDIN_REDIRECT_URI']!,
  scopes: [
    LinkedInScope.OPENID,
    LinkedInScope.PROFILE,
    LinkedInScope.W_MEMBER_SOCIAL,
  ],
});

// Generate authorization URL
const authUrl = linkedinAuth.getAuthorizationUrl('optional-state');

// Exchange code for token
const tokenData = await linkedinAuth.exchangeCodeForToken(code);

// Get user profile
const profile = await linkedinAuth.getProfile();

// Create post
await linkedinAuth.createShare(
  `urn:li:person:${profile.sub}`,
  'Going live on LinkedIn! 🎥'
);
```

---

## 🔄 Token Management

### Storing Tokens Securely

**Never store tokens in plain text!** Use:

- Encrypted database storage
- Secure session storage
- Environment variables (for development only)

### Refreshing Tokens

Most platforms require periodic token refresh:

```typescript
// Check if token is expired
if (authService.isTokenExpired()) {
  const currentToken = authService.getTokenData();
  if (currentToken?.refreshToken) {
    const newToken = await authService.refreshAccessToken(currentToken.refreshToken);
    // Store newToken securely
  }
}
```

### Token Expiration Times

| Platform | Access Token | Refresh Token |
|----------|-------------|---------------|
| Twitch | Variable | Never expires |
| YouTube | 1 hour | Never expires |
| Facebook | 1-2 hours | 60 days |
| TikTok | 24 hours | 365 days |
| Twitter | 2 hours | Never expires |
| LinkedIn | 60 days | 365 days |

---

## 🔒 Security Best Practices

### 1. Use State Parameter

Always use the state parameter to prevent CSRF attacks:

```typescript
const state = crypto.randomUUID();
// Store state in session
const authUrl = authService.getAuthorizationUrl(state);

// In callback, verify state matches
if (callbackState !== storedState) {
  throw new Error('Invalid state parameter');
}
```

### 2. Use HTTPS in Production

```bash
# Production redirect URIs should use HTTPS
TWITCH_REDIRECT_URI=https://yourdomain.com/auth/twitch/callback
YOUTUBE_REDIRECT_URI=https://yourdomain.com/auth/youtube/callback
# ... etc
```

### 3. Validate Redirect URIs

Ensure redirect URIs in your app match those registered with each platform.

### 4. Secure Token Storage

```typescript
// Example using encrypted storage
import { encrypt, decrypt } from './encryption';

function storeToken(userId: string, token: TokenData) {
  const encrypted = encrypt(JSON.stringify(token));
  // Store encrypted token in database
  db.tokens.insert({ userId, token: encrypted });
}

function loadToken(userId: string): TokenData {
  const encrypted = db.tokens.findOne({ userId }).token;
  return JSON.parse(decrypt(encrypted));
}
```

---

## 🧪 Testing OAuth Locally

### 1. Use ngrok for Local Testing

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 4200

# Use the HTTPS URL as your redirect URI
# Example: https://abc123.ngrok.io/auth/twitch/callback
```

### 2. Update Platform Settings

Update each platform's developer console with your ngrok URL.

---

## 📚 Additional Resources

### Platform Documentation

- [Twitch API Docs](https://dev.twitch.tv/docs/api/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [TikTok for Developers](https://developers.tiktok.com/doc/overview)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API](https://learn.microsoft.com/en-us/linkedin/)

### Scopes Reference

Each platform has different permission scopes. Refer to:
- Models in each OAuth library for available scopes
- Platform documentation for scope descriptions
- Only request scopes you need

---

## 🐛 Troubleshooting

### Common Issues

**"Invalid redirect URI"**
- Ensure URI in code matches platform settings exactly
- Check for trailing slashes
- Verify HTTP vs HTTPS

**"Invalid client ID"**
- Double-check environment variables
- Ensure no extra spaces in .env file

**"Insufficient permissions"**
- Check requested scopes
- Ensure app has required permissions enabled

**Token refresh fails**
- Some platforms require offline_access scope
- Check if refresh token is stored correctly

**CORS errors**
- OAuth flow should use server-side redirects, not AJAX
- Token exchange must happen on backend

---

## 💡 Next Steps

1. ✅ Register apps on all platforms you want to support
2. ✅ Configure environment variables
3. ✅ Implement OAuth callback handlers in your app
4. ✅ Add token refresh logic
5. ✅ Test authentication flow for each platform
6. ✅ Integrate with streaming service

---

## 📞 Support

Need help? Check:
- Platform developer forums
- Platform API status pages
- Broady GitHub issues

Happy streaming! 🎥✨
