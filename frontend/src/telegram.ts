/**
 * Telegram Web App SDK integration
 */

import WebApp from '@twa-dev/sdk';

// Initialize Telegram Web App
export function initTelegram() {
  // Expand the app to full height
  if (WebApp && window.Telegram?.WebApp) {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.ready();
  }
}

// Get Telegram user data
export function getTelegramUser() {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

// Get Telegram init data for API authentication
export function getInitData(): string {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
}

// Get Telegram theme
export function getTelegramTheme() {
  if (window.Telegram?.WebApp) {
    return {
      backgroundColor: window.Telegram.WebApp.backgroundColor || '#ffffff',
      textColor: window.Telegram.WebApp.textColor || '#000000',
      headerColor: window.Telegram.WebApp.headerColor || '#ffffff',
      isDark: window.Telegram.WebApp.colorScheme === 'dark',
    };
  }
  return {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    headerColor: '#ffffff',
    isDark: false,
  };
}

// Setup back button handler
export function setupBackButton(onClick: () => void) {
  if (window.Telegram?.WebApp?.BackButton) {
    window.Telegram.WebApp.BackButton.show();
    window.Telegram.WebApp.BackButton.onClick(onClick);
  }
}

// Hide back button
export function hideBackButton() {
  if (window.Telegram?.WebApp?.BackButton) {
    window.Telegram.WebApp.BackButton.hide();
  }
}

// Setup main button
export function setupMainButton(text: string, onClick: () => void) {
  if (window.Telegram?.WebApp?.MainButton) {
    window.Telegram.WebApp.MainButton.setText(text);
    window.Telegram.WebApp.MainButton.onClick(onClick);
    window.Telegram.WebApp.MainButton.show();
  }
}

// Hide main button
export function hideMainButton() {
  if (window.Telegram?.WebApp?.MainButton) {
    window.Telegram.WebApp.MainButton.hide();
  }
}

// Show alert
export function showAlert(message: string) {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message);
  } else {
    alert(message);
  }
}

// Show confirm
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    } else {
      resolve(confirm(message));
    }
  });
}

// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        backgroundColor?: string;
        textColor?: string;
        headerColor?: string;
        colorScheme?: 'light' | 'dark';
        expand: () => void;
        ready: () => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        MainButton?: {
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}

