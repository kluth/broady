import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'streaming-cloud-sync',
  imports: [],
  templateUrl: './cloud-sync.html',
  styleUrl: './cloud-sync.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudSync {
  private readonly firebase = inject(FirebaseService);

  // UI State
  readonly showLoginDialog = signal(false);
  readonly showSyncDialog = signal(false);
  readonly loginEmail = signal('');
  readonly loginPassword = signal('');
  readonly isLoggingIn = signal(false);

  // Firebase state
  readonly currentUser = this.firebase.currentUser;
  readonly isAuthenticated = this.firebase.isAuthenticated;
  readonly isSyncing = this.firebase.isSyncing;
  readonly cloudScenes = this.firebase.cloudScenes;
  readonly userScenes = this.firebase.userScenes;
  readonly sharedScenes = this.firebase.sharedScenes;
  readonly analytics = this.firebase.analytics;

  // Computed
  readonly syncButtonText = computed(() => {
    if (this.isSyncing()) return 'Syncing...';
    if (!this.isAuthenticated()) return 'Sign In to Sync';
    return 'Sync to Cloud';
  });

  readonly statsLoaded = computed(() => this.analytics() !== null);

  // Methods
  openLoginDialog(): void {
    this.showLoginDialog.set(true);
  }

  closeLoginDialog(): void {
    this.showLoginDialog.set(false);
    this.loginEmail.set('');
    this.loginPassword.set('');
  }

  async signInWithEmail(): Promise<void> {
    this.isLoggingIn.set(true);

    try {
      await this.firebase.signInWithEmail(
        this.loginEmail(),
        this.loginPassword()
      );
      this.closeLoginDialog();
      await this.loadAnalytics();
    } catch (error) {
      alert('Sign in failed: ' + error);
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoggingIn.set(true);

    try {
      await this.firebase.signInWithGoogle();
      this.closeLoginDialog();
      await this.loadAnalytics();
    } catch (error) {
      alert('Google sign in failed: ' + error);
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (confirm('Sign out from cloud services?')) {
      await this.firebase.signOut();
    }
  }

  openSyncDialog(): void {
    if (!this.isAuthenticated()) {
      this.openLoginDialog();
      return;
    }
    this.showSyncDialog.set(true);
  }

  closeSyncDialog(): void {
    this.showSyncDialog.set(false);
  }

  async loadSceneFromCloud(sceneId: string): Promise<void> {
    try {
      const scene = await this.firebase.loadSceneFromCloud(sceneId);
      alert(`Loaded scene: ${scene.name}`);
      this.closeSyncDialog();
    } catch (error) {
      alert('Failed to load scene: ' + error);
    }
  }

  async shareScene(sceneId: string): Promise<void> {
    const emails = prompt('Enter email addresses to share with (comma-separated):');
    if (!emails) return;

    try {
      const emailList = emails.split(',').map(e => e.trim());
      await this.firebase.shareScene(sceneId, emailList);
      alert(`Scene shared with ${emailList.length} user(s)`);
    } catch (error) {
      alert('Failed to share scene: ' + error);
    }
  }

  async loadAnalytics(): Promise<void> {
    try {
      await this.firebase.fetchAnalytics();
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}
