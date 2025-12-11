import { Injectable, signal, computed } from '@angular/core';

/**
 * Dialog Service
 * Centralized service for showing dialogs, modals, and prompts
 *
 * Replaces all alert() calls with proper UI components
 */

export interface DialogConfig {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';
  buttons?: DialogButton[];
  input?: {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    type?: 'text' | 'number' | 'password' | 'email';
  };
  dismissable?: boolean;
  width?: string;
}

export interface DialogButton {
  label: string;
  value: string;
  primary?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface DialogInstance {
  id: string;
  config: DialogConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  readonly dialogs = signal<DialogInstance[]>([]);
  readonly activeDialog = computed(() => this.dialogs()[0] || null);

  private dialogCounter = 0;

  /**
   * Show info dialog
   */
  async info(title: string, message: string): Promise<void> {
    return this.show({
      title,
      message,
      type: 'info',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  /**
   * Show success dialog
   */
  async success(title: string, message: string): Promise<void> {
    return this.show({
      title,
      message,
      type: 'success',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  /**
   * Show warning dialog
   */
  async warning(title: string, message: string): Promise<void> {
    return this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  /**
   * Show error dialog
   */
  async error(title: string, message: string): Promise<void> {
    return this.show({
      title,
      message,
      type: 'error',
      buttons: [{ label: 'OK', value: 'ok', primary: true }]
    });
  }

  /**
   * Show confirm dialog
   */
  async confirm(title: string, message: string, confirmLabel = 'Confirm', cancelLabel = 'Cancel'): Promise<boolean> {
    const result = await this.show({
      title,
      message,
      type: 'confirm',
      buttons: [
        { label: cancelLabel, value: 'cancel', variant: 'secondary' },
        { label: confirmLabel, value: 'confirm', primary: true, variant: 'primary' }
      ]
    });

    return result === 'confirm';
  }

  /**
   * Show prompt dialog
   */
  async prompt(
    title: string,
    message: string,
    defaultValue = '',
    placeholder = '',
    inputType: 'text' | 'number' | 'password' | 'email' = 'text'
  ): Promise<string | null> {
    return this.show({
      title,
      message,
      type: 'prompt',
      input: {
        defaultValue,
        placeholder,
        type: inputType
      },
      buttons: [
        { label: 'Cancel', value: 'cancel', variant: 'secondary' },
        { label: 'OK', value: 'ok', primary: true }
      ]
    });
  }

  /**
   * Show custom dialog
   */
  async show(config: DialogConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `dialog-${++this.dialogCounter}`;

      const instance: DialogInstance = {
        id,
        config: {
          dismissable: true,
          ...config
        },
        resolve,
        reject
      };

      this.dialogs.update(dialogs => [...dialogs, instance]);
    });
  }

  /**
   * Close dialog with result
   */
  close(dialogId: string, result?: any): void {
    const dialog = this.dialogs().find(d => d.id === dialogId);
    if (!dialog) return;

    dialog.resolve(result);

    this.dialogs.update(dialogs => dialogs.filter(d => d.id !== dialogId));
  }

  /**
   * Dismiss dialog (cancel)
   */
  dismiss(dialogId: string): void {
    const dialog = this.dialogs().find(d => d.id === dialogId);
    if (!dialog) return;

    if (dialog.config.dismissable !== false) {
      dialog.resolve(null);
      this.dialogs.update(dialogs => dialogs.filter(d => d.id !== dialogId));
    }
  }

  /**
   * Close all dialogs
   */
  closeAll(): void {
    this.dialogs().forEach(dialog => dialog.resolve(null));
    this.dialogs.set([]);
  }
}

/**
 * Global helper functions (replaces window.alert, window.confirm, window.prompt)
 */
export function showAlert(message: string, title = 'Alert'): Promise<void> {
  const dialogService = new DialogService();
  return dialogService.info(title, message);
}

export function showConfirm(message: string, title = 'Confirm'): Promise<boolean> {
  const dialogService = new DialogService();
  return dialogService.confirm(title, message);
}

export function showPrompt(message: string, defaultValue = '', title = 'Input'): Promise<string | null> {
  const dialogService = new DialogService();
  return dialogService.prompt(title, message, defaultValue);
}
