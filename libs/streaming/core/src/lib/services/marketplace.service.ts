import { Injectable, signal, computed } from '@angular/core';

/**
 * Marketplace Service
 * User-generated content marketplace for templates, overlays, alerts, etc.
 */

export type MarketplaceItemType =
  | 'template'
  | 'overlay'
  | 'alert'
  | 'sound-pack'
  | 'transition'
  | 'widget'
  | 'scene-collection'
  | 'plugin';

export type MarketplaceCategory =
  | 'gaming'
  | 'music'
  | 'talk-show'
  | 'educational'
  | 'creative'
  | 'sports'
  | 'irl'
  | 'anime'
  | 'retro'
  | 'minimal'
  | 'seasonal';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  type: MarketplaceItemType;
  category: MarketplaceCategory;
  price: number;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  thumbnailUrl: string;
  previewImages: string[];
  previewVideoUrl?: string;
  version: string;
  compatibility: string[]; // Compatible Broady versions
  fileSize: number; // bytes
  downloads: number;
  sales: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
  verified: boolean; // Verified by Broady team
  createdAt: Date;
  updatedAt: Date;
  lastSaleAt?: Date;
}

export interface MarketplaceCreator {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  totalSales: number;
  totalEarnings: number;
  itemCount: number;
  rating: number;
  followers: number;
  verified: boolean;
  joinedAt: Date;
}

export interface MarketplaceReview {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  helpful: number; // helpful votes
  verified: boolean; // verified purchase
  createdAt: Date;
  updatedAt?: Date;
}

export interface MarketplaceSale {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  commission: number; // Platform commission
  sellerEarnings: number;
  paymentProvider: string;
  transactionId: string;
  createdAt: Date;
}

export interface CreatorPayout {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'paypal' | 'stripe' | 'bank-transfer';
  salesIncluded: string[]; // Sale IDs
  createdAt: Date;
  completedAt?: Date;
}

export interface MarketplaceFilters {
  type?: MarketplaceItemType;
  category?: MarketplaceCategory;
  minPrice?: number;
  maxPrice?: number;
  freeOnly?: boolean;
  featured?: boolean;
  verified?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';
}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  // Platform commission rate (30% is standard for digital marketplaces)
  private readonly COMMISSION_RATE = 0.30;

  // Marketplace items
  readonly items = signal<MarketplaceItem[]>([
    // Example items
    {
      id: 'neon-dreams-template',
      name: 'Neon Dreams Gaming Template',
      description: 'Futuristic neon-themed complete streaming setup with animated overlays, alerts, and transitions',
      type: 'template',
      category: 'gaming',
      price: 24.99,
      creatorId: 'creator-1',
      creatorName: 'StreamDesignPro',
      thumbnailUrl: '/marketplace/neon-dreams-thumb.jpg',
      previewImages: [
        '/marketplace/neon-dreams-1.jpg',
        '/marketplace/neon-dreams-2.jpg',
        '/marketplace/neon-dreams-3.jpg'
      ],
      version: '1.0.0',
      compatibility: ['1.0.0', '1.1.0', '1.2.0'],
      fileSize: 45 * 1024 * 1024, // 45MB
      downloads: 1547,
      sales: 1234,
      rating: 4.8,
      reviewCount: 156,
      tags: ['neon', 'futuristic', 'gaming', 'cyberpunk', 'animated'],
      featured: true,
      verified: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: 'chill-lofi-pack',
      name: 'Chill Lofi Complete Pack',
      description: 'Relaxing lofi aesthetic with soft colors, cozy overlays, and ambient sound alerts',
      type: 'template',
      category: 'music',
      price: 19.99,
      creatorId: 'creator-2',
      creatorName: 'CozyStreamers',
      thumbnailUrl: '/marketplace/lofi-thumb.jpg',
      previewImages: ['/marketplace/lofi-1.jpg'],
      version: '2.1.0',
      compatibility: ['1.0.0', '1.1.0', '1.2.0'],
      fileSize: 32 * 1024 * 1024,
      downloads: 892,
      sales: 734,
      rating: 4.9,
      reviewCount: 89,
      tags: ['lofi', 'chill', 'music', 'aesthetic', 'cozy'],
      featured: true,
      verified: true,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-20')
    },
    {
      id: 'free-minimal-overlay',
      name: 'Minimal Clean Overlay Set',
      description: 'Free minimalist overlay collection - perfect for professional streams',
      type: 'overlay',
      category: 'minimal',
      price: 0,
      creatorId: 'creator-3',
      creatorName: 'MinimalDesigns',
      thumbnailUrl: '/marketplace/minimal-thumb.jpg',
      previewImages: ['/marketplace/minimal-1.jpg'],
      version: '1.0.0',
      compatibility: ['1.0.0', '1.1.0', '1.2.0'],
      fileSize: 5 * 1024 * 1024,
      downloads: 5632,
      sales: 0,
      rating: 4.7,
      reviewCount: 234,
      tags: ['minimal', 'clean', 'professional', 'free'],
      featured: false,
      verified: true,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    }
  ]);

  // Creators
  readonly creators = signal<MarketplaceCreator[]>([
    {
      id: 'creator-1',
      name: 'Stream Design Pro',
      username: 'streamdesignpro',
      bio: 'Professional stream designer with 5+ years experience',
      twitter: '@streamdesignpro',
      totalSales: 3456,
      totalEarnings: 45678.90,
      itemCount: 12,
      rating: 4.9,
      followers: 2341,
      verified: true,
      joinedAt: new Date('2023-06-01')
    }
  ]);

  // Reviews
  readonly reviews = signal<MarketplaceReview[]>([]);

  // Sales history
  readonly sales = signal<MarketplaceSale[]>([]);

  // Creator payouts
  readonly payouts = signal<CreatorPayout[]>([]);

  // User's purchased items
  readonly purchasedItems = signal<string[]>([]);

  // Active filters
  readonly filters = signal<MarketplaceFilters>({
    sortBy: 'popular'
  });

  // Computed values
  readonly filteredItems = computed(() => {
    let filtered = this.items();
    const f = this.filters();

    if (f.type) {
      filtered = filtered.filter(i => i.type === f.type);
    }

    if (f.category) {
      filtered = filtered.filter(i => i.category === f.category);
    }

    if (f.freeOnly) {
      filtered = filtered.filter(i => i.price === 0);
    }

    if (f.featured) {
      filtered = filtered.filter(i => i.featured);
    }

    if (f.verified) {
      filtered = filtered.filter(i => i.verified);
    }

    if (f.minPrice !== undefined) {
      filtered = filtered.filter(i => i.price >= f.minPrice!);
    }

    if (f.maxPrice !== undefined) {
      filtered = filtered.filter(i => i.price <= f.maxPrice!);
    }

    if (f.tags && f.tags.length > 0) {
      filtered = filtered.filter(i =>
        f.tags!.some(tag => i.tags.includes(tag))
      );
    }

    if (f.search) {
      const search = f.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search) ||
        i.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Sort
    switch (f.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  });

  readonly featuredItems = computed(() =>
    this.items().filter(i => i.featured).slice(0, 6)
  );

  readonly topCreators = computed(() =>
    [...this.creators()]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
  );

  /**
   * Search items
   */
  search(query: string): void {
    this.filters.update(f => ({ ...f, search: query }));
  }

  /**
   * Apply filters
   */
  applyFilters(filters: Partial<MarketplaceFilters>): void {
    this.filters.update(f => ({ ...f, ...filters }));
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.filters.set({ sortBy: 'popular' });
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): MarketplaceItem | undefined {
    return this.items().find(i => i.id === itemId);
  }

  /**
   * Get items by creator
   */
  getItemsByCreator(creatorId: string): MarketplaceItem[] {
    return this.items().filter(i => i.creatorId === creatorId);
  }

  /**
   * Get reviews for item
   */
  getItemReviews(itemId: string): MarketplaceReview[] {
    return this.reviews()
      .filter(r => r.itemId === itemId)
      .sort((a, b) => b.helpful - a.helpful); // Sort by helpfulness
  }

  /**
   * Purchase item
   */
  async purchaseItem(
    itemId: string,
    paymentProvider: string,
    transactionId: string
  ): Promise<boolean> {
    const item = this.getItem(itemId);
    if (!item) {
      console.error('Item not found');
      return false;
    }

    // Check if already purchased
    if (this.purchasedItems().includes(itemId)) {
      console.error('Already purchased');
      return false;
    }

    // Calculate commission
    const commission = item.price * this.COMMISSION_RATE;
    const sellerEarnings = item.price - commission;

    // Create sale record
    const sale: MarketplaceSale = {
      id: crypto.randomUUID(),
      itemId,
      buyerId: 'current-user',
      sellerId: item.creatorId,
      price: item.price,
      commission,
      sellerEarnings,
      paymentProvider,
      transactionId,
      createdAt: new Date()
    };

    this.sales.update(s => [...s, sale]);

    // Update item stats
    this.items.update(items =>
      items.map(i =>
        i.id === itemId
          ? {
              ...i,
              downloads: i.downloads + 1,
              sales: i.sales + 1,
              lastSaleAt: new Date()
            }
          : i
      )
    );

    // Update creator stats
    this.creators.update(creators =>
      creators.map(c =>
        c.id === item.creatorId
          ? {
              ...c,
              totalSales: c.totalSales + 1,
              totalEarnings: c.totalEarnings + sellerEarnings
            }
          : c
      )
    );

    // Add to purchased items
    this.purchasedItems.update(items => [...items, itemId]);

    return true;
  }

  /**
   * Download free item
   */
  downloadFreeItem(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    if (item.price > 0) {
      console.error('Item is not free');
      return false;
    }

    // Update downloads
    this.items.update(items =>
      items.map(i =>
        i.id === itemId
          ? { ...i, downloads: i.downloads + 1 }
          : i
      )
    );

    // Add to purchased items
    if (!this.purchasedItems().includes(itemId)) {
      this.purchasedItems.update(items => [...items, itemId]);
    }

    return true;
  }

  /**
   * Add review
   */
  addReview(
    itemId: string,
    rating: number,
    comment: string,
    title?: string
  ): MarketplaceReview {
    // Check if purchased
    const isPurchased = this.purchasedItems().includes(itemId);

    const review: MarketplaceReview = {
      id: crypto.randomUUID(),
      itemId,
      userId: 'current-user',
      userName: 'Current User',
      rating,
      title,
      comment,
      helpful: 0,
      verified: isPurchased,
      createdAt: new Date()
    };

    this.reviews.update(r => [...r, review]);

    // Update item rating
    this.updateItemRating(itemId);

    return review;
  }

  /**
   * Update item rating
   */
  private updateItemRating(itemId: string): void {
    const itemReviews = this.getItemReviews(itemId);
    if (itemReviews.length === 0) return;

    const avgRating = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;

    this.items.update(items =>
      items.map(i =>
        i.id === itemId
          ? {
              ...i,
              rating: Math.round(avgRating * 10) / 10,
              reviewCount: itemReviews.length
            }
          : i
      )
    );
  }

  /**
   * Mark review as helpful
   */
  markReviewHelpful(reviewId: string): void {
    this.reviews.update(reviews =>
      reviews.map(r =>
        r.id === reviewId
          ? { ...r, helpful: r.helpful + 1 }
          : r
      )
    );
  }

  /**
   * Submit item for sale (creator uploads)
   */
  async submitItem(item: Omit<MarketplaceItem, 'id' | 'downloads' | 'sales' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt'>): Promise<MarketplaceItem> {
    const newItem: MarketplaceItem = {
      ...item,
      id: crypto.randomUUID(),
      downloads: 0,
      sales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false, // Must be reviewed by team
      featured: false
    };

    this.items.update(items => [...items, newItem]);

    console.log('Item submitted for review:', newItem);
    return newItem;
  }

  /**
   * Update item (creator)
   */
  updateItem(itemId: string, updates: Partial<MarketplaceItem>): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    // In real app, check if current user is the creator
    // if (item.creatorId !== currentUserId) return false;

    this.items.update(items =>
      items.map(i =>
        i.id === itemId
          ? { ...i, ...updates, updatedAt: new Date() }
          : i
      )
    );

    return true;
  }

  /**
   * Delete item (creator)
   */
  deleteItem(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    // In real app, check permissions

    this.items.update(items => items.filter(i => i.id !== itemId));
    return true;
  }

  /**
   * Request payout (creator)
   */
  requestPayout(
    creatorId: string,
    method: 'paypal' | 'stripe' | 'bank-transfer'
  ): CreatorPayout {
    const creator = this.creators().find(c => c.id === creatorId);
    if (!creator) throw new Error('Creator not found');

    // Get unpaid sales
    const paidSaleIds = this.payouts()
      .flatMap(p => p.salesIncluded);

    const unpaidSales = this.sales()
      .filter(s =>
        s.sellerId === creatorId &&
        !paidSaleIds.includes(s.id)
      );

    if (unpaidSales.length === 0) {
      throw new Error('No unpaid sales');
    }

    const amount = unpaidSales.reduce((sum, s) => sum + s.sellerEarnings, 0);

    const payout: CreatorPayout = {
      id: crypto.randomUUID(),
      creatorId,
      amount,
      currency: 'USD',
      status: 'pending',
      method,
      salesIncluded: unpaidSales.map(s => s.id),
      createdAt: new Date()
    };

    this.payouts.update(p => [...p, payout]);

    // Simulate processing
    setTimeout(() => {
      this.processPayout(payout.id);
    }, 5000);

    return payout;
  }

  /**
   * Process payout
   */
  private processPayout(payoutId: string): void {
    this.payouts.update(payouts =>
      payouts.map(p =>
        p.id === payoutId
          ? {
              ...p,
              status: 'completed',
              completedAt: new Date()
            }
          : p
      )
    );
  }

  /**
   * Get creator earnings
   */
  getCreatorEarnings(creatorId: string): {
    total: number;
    pending: number;
    paid: number;
  } {
    const allSales = this.sales().filter(s => s.sellerId === creatorId);
    const total = allSales.reduce((sum, s) => sum + s.sellerEarnings, 0);

    const paidSaleIds = this.payouts()
      .filter(p => p.creatorId === creatorId && p.status === 'completed')
      .flatMap(p => p.salesIncluded);

    const paidAmount = allSales
      .filter(s => paidSaleIds.includes(s.id))
      .reduce((sum, s) => sum + s.sellerEarnings, 0);

    return {
      total,
      pending: total - paidAmount,
      paid: paidAmount
    };
  }

  /**
   * Get marketplace statistics
   */
  getStatistics() {
    const items = this.items();
    const sales = this.sales();

    return {
      totalItems: items.length,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.price, 0),
      totalCommission: sales.reduce((sum, s) => sum + s.commission, 0),
      averagePrice: items.reduce((sum, i) => sum + i.price, 0) / items.length,
      averageRating: items.reduce((sum, i) => sum + i.rating, 0) / items.length,
      totalDownloads: items.reduce((sum, i) => sum + i.downloads, 0)
    };
  }
}
