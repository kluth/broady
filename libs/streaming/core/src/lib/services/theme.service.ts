import { Injectable, signal, effect } from '@angular/core';

/**
 * Theme Service
 * Customizable UI themes and appearance
 */

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  borderRadius: string;
  shadows: boolean;
  animations: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<Theme>(this.getDefaultTheme());
  readonly availableThemes = signal<Theme[]>([
    this.getDefaultTheme(),
    this.getDarkTheme(),
    this.getLightTheme(),
    this.getCyberpunkTheme(),
    this.getNeonTheme()
  ]);

  constructor() {
    // Apply theme on change
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
    });

    // Load saved theme
    this.loadSavedTheme();
  }

  private getDefaultTheme(): Theme {
    return {
      id: 'default',
      name: 'Broady Default',
      colors: {
        primary: '#8b5cf6',
        secondary: '#ec4899',
        accent: '#3b82f6',
        background: '#0f0f0f',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6'
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Roboto, sans-serif',
        mono: 'Fira Code, monospace'
      },
      borderRadius: '8px',
      shadows: true,
      animations: true
    };
  }

  private getDarkTheme(): Theme {
    return {
      id: 'dark',
      name: 'Dark Mode',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#000000',
        surface: '#111111',
        text: '#f5f5f5',
        textSecondary: '#9ca3af',
        error: '#dc2626',
        warning: '#ea580c',
        success: '#059669',
        info: '#0284c7'
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Roboto, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      borderRadius: '6px',
      shadows: true,
      animations: true
    };
  }

  private getLightTheme(): Theme {
    return {
      id: 'light',
      name: 'Light Mode',
      colors: {
        primary: '#7c3aed',
        secondary: '#db2777',
        accent: '#2563eb',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#0f0f0f',
        textSecondary: '#6b7280',
        error: '#dc2626',
        warning: '#ea580c',
        success: '#059669',
        info: '#0284c7'
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Roboto, sans-serif',
        mono: 'Fira Code, monospace'
      },
      borderRadius: '8px',
      shadows: true,
      animations: true
    };
  }

  private getCyberpunkTheme(): Theme {
    return {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      colors: {
        primary: '#ff00ff',
        secondary: '#00ffff',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a0033',
        text: '#00ff00',
        textSecondary: '#00cc88',
        error: '#ff0055',
        warning: '#ff9900',
        success: '#00ff88',
        info: '#00ccff'
      },
      fonts: {
        primary: 'Share Tech Mono, monospace',
        secondary: 'Orbitron, sans-serif',
        mono: 'Source Code Pro, monospace'
      },
      borderRadius: '2px',
      shadows: true,
      animations: true
    };
  }

  private getNeonTheme(): Theme {
    return {
      id: 'neon',
      name: 'Neon Lights',
      colors: {
        primary: '#ff006e',
        secondary: '#fb5607',
        accent: '#ffbe0b',
        background: '#1a1a2e',
        surface: '#16213e',
        text: '#eaeaea',
        textSecondary: '#aaaaaa',
        error: '#e71d36',
        warning: '#ff9f1c',
        success: '#06ffa5',
        info: '#00d9ff'
      },
      fonts: {
        primary: 'Poppins, sans-serif',
        secondary: 'Raleway, sans-serif',
        mono: 'Inconsolata, monospace'
      },
      borderRadius: '12px',
      shadows: true,
      animations: true
    };
  }

  setTheme(themeId: string): void {
    const theme = this.availableThemes().find(t => t.id === themeId);
    if (theme) {
      this.currentTheme.set(theme);
      this.saveTheme(theme);
    }
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply font variables
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Apply other properties
    root.style.setProperty('--border-radius', theme.borderRadius);
    root.style.setProperty('--shadows', theme.shadows ? '1' : '0');
    root.style.setProperty('--animations', theme.animations ? '1' : '0');

    console.log(`Applied theme: ${theme.name}`);
  }

  private saveTheme(theme: Theme): void {
    localStorage.setItem('broady-theme', JSON.stringify(theme));
  }

  private loadSavedTheme(): void {
    const saved = localStorage.getItem('broady-theme');
    if (saved) {
      try {
        const theme = JSON.parse(saved);
        this.currentTheme.set(theme);
      } catch (error) {
        console.error('Failed to load saved theme:', error);
      }
    }
  }

  createCustomTheme(name: string, baseTheme?: Theme): Theme {
    const base = baseTheme || this.currentTheme();
    const customTheme: Theme = {
      ...base,
      id: crypto.randomUUID(),
      name
    };

    this.availableThemes.update(themes => [...themes, customTheme]);
    return customTheme;
  }

  deleteTheme(themeId: string): void {
    if (['default', 'dark', 'light', 'cyberpunk', 'neon'].includes(themeId)) {
      console.warn('Cannot delete built-in themes');
      return;
    }

    this.availableThemes.update(themes => themes.filter(t => t.id !== themeId));
  }

  updateThemeColors(themeId: string, colors: Partial<Theme['colors']>): void {
    this.availableThemes.update(themes =>
      themes.map(t =>
        t.id === themeId
          ? { ...t, colors: { ...t.colors, ...colors } }
          : t
      )
    );

    if (this.currentTheme().id === themeId) {
      this.currentTheme.update(t => ({
        ...t,
        colors: { ...t.colors, ...colors }
      }));
    }
  }

  exportTheme(themeId: string): string {
    const theme = this.availableThemes().find(t => t.id === themeId);
    return theme ? JSON.stringify(theme, null, 2) : '';
  }

  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      theme.id = crypto.randomUUID(); // Generate new ID
      this.availableThemes.update(themes => [...themes, theme]);
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }
}
