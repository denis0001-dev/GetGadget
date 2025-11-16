/**
* Telegram Web App SDK integration
*/

import WebApp from '@twa-dev/sdk';

// Cross-platform postEvent helper based on Telegram Mini Apps methods docs
function postEvent(eventType: string, eventData?: unknown) {
    const dataStr = JSON.stringify(eventData ?? {});
    // Desktop/Mobile Telegram
    if (typeof window !== 'undefined' && typeof window.TelegramWebviewProxy?.postEvent === 'function') {
        try {
            window.TelegramWebviewProxy.postEvent(eventType, dataStr);
            return;
        } catch {
            // fall through to web iframe method
        }
    }
    // Web Telegram (iframe)
    try {
        const payload = JSON.stringify({ eventType, eventData });
        window.parent?.postMessage(payload, 'https://web.telegram.org');
    } catch {
        // noop
    }
}

function applySafeAreaToCss(insets: { top?: number; bottom?: number; left?: number; right?: number }) {
    const root = document.documentElement;
    if (typeof insets.top === 'number') root.style.setProperty('--tg-safe-area-top', `${insets.top}px`);
    if (typeof insets.bottom === 'number') root.style.setProperty('--tg-safe-area-bottom', `${insets.bottom}px`);
    if (typeof insets.left === 'number') root.style.setProperty('--tg-safe-area-left', `${insets.left}px`);
    if (typeof insets.right === 'number') root.style.setProperty('--tg-safe-area-right', `${insets.right}px`);
}

function attachSafeAreaListeners() {
    // Web (iframe) events
    window.addEventListener('message', (ev: MessageEvent) => {
        try {
            const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
            if (data && data.eventType === 'content_safe_area_changed') {
                const e = data.eventData || {};
                applySafeAreaToCss({ top: e.top, bottom: e.bottom, left: e.left, right: e.right });
            }
        } catch {
            // ignore
        }
    });

    // Mobile/Desktop Proxy callback (some builds dispatch JSON in second arg string)
    const proxy = window.TelegramWebviewProxy;
    if (proxy && typeof proxy.onEvent === 'function') {
        try {
            proxy.onEvent((name: string, dataStr: string) => {
                if (name === 'content_safe_area_changed') {
                    try {
                        const e = JSON.parse(dataStr);
                        applySafeAreaToCss({ top: e.top, bottom: e.bottom, left: e.left, right: e.right });
                    } catch {}
                }
            });
        } catch {}
    }
}

// Initialize Telegram Web App
export function initTelegram() {
    if (WebApp && window.Telegram?.WebApp) {
        const wa = window.Telegram.WebApp;
        attachSafeAreaListeners();

        // Request safe area insets explicitly
        try { postEvent('web_app_request_content_safe_area'); } catch {}

        // Request edge-to-edge fullscreen per docs
        try { postEvent('web_app_request_fullscreen'); } catch {}

        // Expand and theme
        wa.expand();
        try {
            if (wa.colorScheme === 'dark') {
                // @ts-ignore
                wa.setHeaderColor && wa.setHeaderColor('#000000');
                // @ts-ignore
                wa.setBackgroundColor && wa.setBackgroundColor('#000000');
                postEvent('web_app_set_header_color', { color_key: 'bg_color' });
            } else {
                // @ts-ignore
                wa.setHeaderColor && wa.setHeaderColor('#ffffff');
                // @ts-ignore
                wa.setBackgroundColor && wa.setBackgroundColor('#ffffff');
                postEvent('web_app_set_header_color', { color_key: 'bg_color' });
            }
        } catch {}

        wa.ready();

        // Retry requests shortly after ready
        setTimeout(() => {
            try { postEvent('web_app_request_content_safe_area'); } catch {}
            try { postEvent('web_app_request_fullscreen'); } catch {}
        }, 50);
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
                setHeaderColor?: (color: string) => void;
                setBackgroundColor?: (color: string) => void;
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
        TelegramWebviewProxy?: {
            postEvent: (eventType: string, data: string) => void;
            onEvent?: (cb: (name: string, data: string) => void) => void;
        };
    }
}

