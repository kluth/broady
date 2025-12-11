import { Injectable, signal } from '@angular/core';

/**
 * Social Media Service
 * Auto-posting to Twitter, Facebook, Instagram, Discord when going live
 */

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'discord' | 'tiktok';
  content: string;
  imageUrl?: string;
  postedAt: Date;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  postUrl?: string;
}

export interface SocialPlatform {
  name: string;
  enabled: boolean;
  connected: boolean;
  token?: string;
  autoPost: boolean;
  postTemplate: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialMediaService {
  readonly platforms = signal<Record<string, SocialPlatform>>({
    twitter: {
      name: 'Twitter/X',
      enabled: false,
      connected: false,
      autoPost: true,
      postTemplate: '🔴 LIVE NOW! {title}\n\n{game}\n\n{url}\n\n#Streaming #Live'
    },
    facebook: {
      name: 'Facebook',
      enabled: false,
      connected: false,
      autoPost: true,
      postTemplate: '🎮 Going live! {title}\n\nWatch here: {url}'
    },
    instagram: {
      name: 'Instagram',
      enabled: false,
      connected: false,
      autoPost: false,
      postTemplate: '🔴 LIVE! Check link in bio'
    },
    discord: {
      name: 'Discord',
      enabled: false,
      connected: false,
      autoPost: true,
      postTemplate: '@everyone 🔴 LIVE NOW!\n\n**{title}**\n\n{url}'
    },
    tiktok: {
      name: 'TikTok',
      enabled: false,
      connected: false,
      autoPost: false,
      postTemplate: '🔴 LIVE NOW! {title}'
    }
  });

  readonly postHistory = signal<SocialPost[]>([]);
  readonly isPosting = signal(false);

  async postGoingLive(title: string, game?: string, streamUrl?: string): Promise<void> {
    this.isPosting.set(true);

    const platforms = this.platforms();
    const postPromises: Promise<void>[] = [];

    for (const [key, platform] of Object.entries(platforms)) {
      if (platform.enabled && platform.connected && platform.autoPost) {
        postPromises.push(this.postToPlatform(key as any, title, game, streamUrl));
      }
    }

    await Promise.allSettled(postPromises);
    this.isPosting.set(false);

    console.log('Posted to all enabled platforms');
  }

  private async postToPlatform(
    platform: 'twitter' | 'facebook' | 'instagram' | 'discord' | 'tiktok',
    title: string,
    game?: string,
    streamUrl?: string
  ): Promise<void> {
    const config = this.platforms()[platform];
    const content = this.formatPost(config.postTemplate, title, game, streamUrl);

    const post: SocialPost = {
      id: crypto.randomUUID(),
      platform,
      content,
      postedAt: new Date(),
      status: 'pending'
    };

    try {
      // Simulate API call
      await this.delay(1000);

      // In production, this would call actual social media APIs
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        post.status = 'success';
        post.postUrl = `https://${platform}.com/post/${post.id}`;
        console.log(`Posted to ${platform}: ${content}`);
      } else {
        throw new Error('API error');
      }
    } catch (error: any) {
      post.status = 'failed';
      post.error = error.message;
      console.error(`Failed to post to ${platform}:`, error);
    }

    this.postHistory.update(h => [post, ...h].slice(0, 50));
  }

  private formatPost(template: string, title: string, game?: string, url?: string): string {
    return template
      .replace('{title}', title)
      .replace('{game}', game || '')
      .replace('{url}', url || '');
  }

  connectPlatform(platform: string, token: string): void {
    this.platforms.update(p => ({
      ...p,
      [platform]: {
        ...p[platform],
        connected: true,
        enabled: true,
        token
      }
    }));
    console.log(`${platform} connected`);
  }

  disconnectPlatform(platform: string): void {
    this.platforms.update(p => ({
      ...p,
      [platform]: {
        ...p[platform],
        connected: false,
        enabled: false,
        token: undefined
      }
    }));
  }

  toggleAutoPost(platform: string): void {
    this.platforms.update(p => ({
      ...p,
      [platform]: {
        ...p[platform],
        autoPost: !p[platform].autoPost
      }
    }));
  }

  updateTemplate(platform: string, template: string): void {
    this.platforms.update(p => ({
      ...p,
      [platform]: {
        ...p[platform],
        postTemplate: template
      }
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual post
  async customPost(platform: string, content: string, imageUrl?: string): Promise<void> {
    const post: SocialPost = {
      id: crypto.randomUUID(),
      platform: platform as any,
      content,
      imageUrl,
      postedAt: new Date(),
      status: 'pending'
    };

    try {
      await this.delay(1000);
      post.status = 'success';
      post.postUrl = `https://${platform}.com/post/${post.id}`;
      console.log(`Custom post to ${platform}: ${content}`);
    } catch (error: any) {
      post.status = 'failed';
      post.error = error.message;
    }

    this.postHistory.update(h => [post, ...h].slice(0, 50));
  }
}
