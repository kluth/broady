import { Injectable, signal } from '@angular/core';

/**
 * Social Media API Service
 * Integration with Twitter, Instagram, Facebook, and TikTok APIs
 *
 * SETUP INSTRUCTIONS:
 * 1. Create developer accounts for each platform
 * 2. Set up OAuth applications
 * 3. Configure environment variables or localStorage keys
 *
 * Required Credentials:
 * - Twitter: API Key, API Secret, Access Token, Access Secret
 * - Instagram: Access Token (via Facebook Graph API)
 * - Facebook: Access Token, Page ID
 * - TikTok: Client Key, Client Secret, Access Token
 */

export interface SocialPost {
  platform: 'twitter' | 'instagram' | 'facebook' | 'tiktok';
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  hashtags?: string[];
}

export interface SocialAccount {
  platform: string;
  username: string;
  displayName: string;
  followers: number;
  connected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialMediaAPIService {
  readonly connectedAccounts = signal<SocialAccount[]>([]);
  readonly twitterConnected = signal(false);
  readonly instagramConnected = signal(false);
  readonly facebookConnected = signal(false);
  readonly tiktokConnected = signal(false);

  /**
   * Twitter API Integration
   */
  async connectTwitter(apiKey: string, apiSecret: string, accessToken: string, accessSecret: string): Promise<boolean> {
    try {
      // Twitter OAuth 1.0a requires server-side implementation
      // This is a client-side placeholder that would call your backend API

      const response = await fetch('/api/social/twitter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret, accessToken, accessSecret })
      });

      if (response.ok) {
        const data = await response.json();
        this.twitterConnected.set(true);
        this.addConnectedAccount({
          platform: 'Twitter',
          username: data.username || '',
          displayName: data.name || '',
          followers: data.followers_count || 0,
          connected: true
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Twitter connection failed:', error);
      return false;
    }
  }

  async postToTwitter(text: string, mediaIds?: string[]): Promise<boolean> {
    if (!this.twitterConnected()) {
      throw new Error('Twitter not connected');
    }

    try {
      // Twitter API v2
      const response = await fetch('/api/social/twitter/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          media: mediaIds ? { media_ids: mediaIds } : undefined
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to post to Twitter:', error);
      return false;
    }
  }

  async tweetStreamStart(title: string): Promise<boolean> {
    const text = `🔴 LIVE NOW: ${title}\n\n#LiveStreaming #Twitch #Gaming`;
    return this.postToTwitter(text);
  }

  /**
   * Instagram API Integration (via Facebook Graph API)
   */
  async connectInstagram(accessToken: string): Promise<boolean> {
    try {
      // Verify token with Instagram Graph API
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        this.instagramConnected.set(true);
        this.addConnectedAccount({
          platform: 'Instagram',
          username: data.username || '',
          displayName: data.username || '',
          followers: data.followers_count || 0,
          connected: true
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Instagram connection failed:', error);
      return false;
    }
  }

  async postToInstagram(imageUrl: string, caption: string): Promise<boolean> {
    if (!this.instagramConnected()) {
      throw new Error('Instagram not connected');
    }

    try {
      const accessToken = localStorage.getItem('instagram_access_token');

      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.instagram.com/me/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken
          })
        }
      );

      if (!containerResponse.ok) return false;

      const containerData = await containerResponse.json();

      // Step 2: Publish media container
      const publishResponse = await fetch(
        `https://graph.instagram.com/me/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: accessToken
          })
        }
      );

      return publishResponse.ok;
    } catch (error) {
      console.error('Failed to post to Instagram:', error);
      return false;
    }
  }

  /**
   * Facebook API Integration
   */
  async connectFacebook(accessToken: string, pageId: string): Promise<boolean> {
    try {
      // Verify token and get page info
      const response = await fetch(
        `https://graph.facebook.com/${pageId}?fields=name,fan_count&access_token=${accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        this.facebookConnected.set(true);
        this.addConnectedAccount({
          platform: 'Facebook',
          username: pageId,
          displayName: data.name || '',
          followers: data.fan_count || 0,
          connected: true
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Facebook connection failed:', error);
      return false;
    }
  }

  async postToFacebook(message: string, link?: string): Promise<boolean> {
    if (!this.facebookConnected()) {
      throw new Error('Facebook not connected');
    }

    try {
      const accessToken = localStorage.getItem('facebook_access_token');
      const pageId = localStorage.getItem('facebook_page_id');

      const response = await fetch(
        `https://graph.facebook.com/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            link,
            access_token: accessToken
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to post to Facebook:', error);
      return false;
    }
  }

  async goLiveOnFacebook(title: string, description: string, streamUrl: string): Promise<boolean> {
    if (!this.facebookConnected()) {
      throw new Error('Facebook not connected');
    }

    try {
      const accessToken = localStorage.getItem('facebook_access_token');
      const pageId = localStorage.getItem('facebook_page_id');

      // Create live video
      const response = await fetch(
        `https://graph.facebook.com/${pageId}/live_videos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            status: 'LIVE_NOW',
            access_token: accessToken
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to go live on Facebook:', error);
      return false;
    }
  }

  /**
   * TikTok API Integration
   */
  async connectTikTok(clientKey: string, clientSecret: string): Promise<boolean> {
    try {
      // TikTok OAuth 2.0 flow
      // This would typically involve redirecting to TikTok's auth page

      const redirectUri = `${window.location.origin}/auth/tiktok/callback`;
      const authUrl = `https://www.tiktok.com/auth/authorize/` +
        `?client_key=${clientKey}` +
        `&scope=user.info.basic,video.list,video.upload` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

      // In a real implementation, would open auth window
      console.log('TikTok auth URL:', authUrl);

      return false; // Requires OAuth flow completion
    } catch (error) {
      console.error('TikTok connection failed:', error);
      return false;
    }
  }

  async uploadToTikTok(videoFile: File, title: string, hashtags: string[]): Promise<boolean> {
    if (!this.tiktokConnected()) {
      throw new Error('TikTok not connected');
    }

    try {
      const accessToken = localStorage.getItem('tiktok_access_token');

      // TikTok video upload is a multi-step process
      // 1. Initialize upload
      // 2. Upload video chunks
      // 3. Publish video

      return false; // Placeholder - requires full implementation
    } catch (error) {
      console.error('Failed to upload to TikTok:', error);
      return false;
    }
  }

  /**
   * Multi-platform posting
   */
  async postToAll(post: SocialPost): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    const promises = [];

    if (this.twitterConnected() && post.text) {
      promises.push(
        this.postToTwitter(post.text).then(success => {
          results.twitter = success;
        })
      );
    }

    if (this.facebookConnected() && post.text) {
      promises.push(
        this.postToFacebook(post.text, post.link).then(success => {
          results.facebook = success;
        })
      );
    }

    if (this.instagramConnected() && post.imageUrl && post.text) {
      promises.push(
        this.postToInstagram(post.imageUrl, post.text).then(success => {
          results.instagram = success;
        })
      );
    }

    await Promise.all(promises);

    return results;
  }

  /**
   * Helper methods
   */
  private addConnectedAccount(account: SocialAccount): void {
    this.connectedAccounts.update(accounts => {
      const existing = accounts.findIndex(a => a.platform === account.platform);
      if (existing >= 0) {
        accounts[existing] = account;
        return [...accounts];
      }
      return [...accounts, account];
    });
  }

  disconnectAll(): void {
    this.twitterConnected.set(false);
    this.instagramConnected.set(false);
    this.facebookConnected.set(false);
    this.tiktokConnected.set(false);
    this.connectedAccounts.set([]);

    // Clear stored tokens
    localStorage.removeItem('twitter_access_token');
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('facebook_access_token');
    localStorage.removeItem('facebook_page_id');
    localStorage.removeItem('tiktok_access_token');
  }
}
