import { initDataRaw, retrieveRawInitData } from '@telegram-apps/sdk';

export const API_BASE = 'https://api.getgadgets.toolbox-io.ru/api/v1';

interface TelegramWebApp {
    initData?: string;
}

interface TelegramWindow {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
}

function getInitData(): string {
    try {
        // Try to get initData from SDK first (initDataRaw is the raw string)
        const sdkInitData = initDataRaw();
        if (sdkInitData) {
            return sdkInitData;
        }
    } catch (e) {
        // SDK might not be initialized yet
    }
    
    // Try retrieveRawInitData as fallback
    try {
        const rawInitData = retrieveRawInitData();
        if (rawInitData) {
            return rawInitData;
        }
    } catch (e) {
        // Not available
    }
    
    // Fallback to window.Telegram.WebApp.initData
    if (typeof window !== 'undefined') {
        const telegramWindow = window as unknown as TelegramWindow;
        if (telegramWindow.Telegram?.WebApp?.initData) {
            return telegramWindow.Telegram.WebApp.initData;
        }
        
        // Fallback: Extract from URL hash (tgWebAppData parameter)
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const tgWebAppData = params.get('tgWebAppData');
            if (tgWebAppData) {
                return decodeURIComponent(tgWebAppData);
            }
        }
        
        // Also try query string (some Telegram clients use this)
        const searchParams = new URLSearchParams(window.location.search);
        const queryInitData = searchParams.get('tgWebAppData');
        if (queryInitData) {
            return decodeURIComponent(queryInitData);
        }
    }
    
    return '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const initData = getInitData();
    
    if (!initData) {
        throw new Error('initData not available. Make sure the SDK is initialized.');
    }
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData, // Note: hyphen in header name (matches API expectation)
        ...(options.headers || {})
    };
    
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body: options.body,
    });
    
    if (!res.ok) {
        const text = await res.text();
        let error: { detail?: string };
        try {
            error = JSON.parse(text) as { detail?: string };
        } catch {
            error = { detail: text || `HTTP ${res.status}` };
        }
        throw new Error(error.detail || `HTTP ${res.status}`);
    }
    
    return res.json();
}

export interface User {
    coins: number;
    last_card_time: number;
}

export interface UserStats {
    total_cards: number;
    pc_count: number;
    total_price: number;
}

export interface Card {
    card_id: number;
    gadget_name: string;
    category: string;
    purchase_price: number;
    rarity: string;
    obtained_at: number;
    in_pc: number | null;
    components: number[];
    specs: Record<string, string>;
}

export interface Gadget {
    name: string;
    category: string;
    price: number;
    rarity: string;
}

export interface TypeCount {
    name: string;
    total: number;
    rarities: Record<string, number>;
}

export interface PC extends Card {
    component_details?: Card[];
}

export interface AvailableParts {
    'Graphics Card': Card[];
    'Processor': Card[];
    'Motherboard': Card[];
}

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
    photo_url?: string;
}

export const api = {
    init: (initData: string) => 
        request<{ user_id: number; user: User; telegram_user: TelegramUser }>('/auth/init', {
            method: 'POST',
            body: JSON.stringify({ initData }),
        }),

    getUser: () => 
        request<{ user: User; stats: UserStats }>('/user'),

    drawCard: () => 
        request<{ card: Card; gadget: Gadget; user: User }>('/cards/draw', {
            method: 'POST',
        }),

    getCards: () => 
        request<{ cards: Card[] }>('/cards'),

    getCardTypes: () => 
        request<{ types: Record<string, TypeCount> }>('/cards/types'),

    getCardsByTypeRarity: (type: string, rarity: string) => 
        request<{ cards: Card[] }>(`/cards/by-type-rarity?type=${encodeURIComponent(type)}&rarity=${encodeURIComponent(rarity)}`),

    getCard: (cardId: number) => 
        request<{ card: Card }>(`/cards/${cardId}`),

    sellCard: (cardId: number) => 
        request<{ sale_price: number; new_balance: number; card: Card }>('/cards/sell', {
            method: 'POST',
            body: JSON.stringify({ card_id: cardId }),
        }),

    getPCs: () => 
        request<{ pcs: PC[] }>('/pcs'),

    getPC: (pcId: number) => 
        request<{ pc: PC }>(`/pcs/${pcId}`),

    getAvailableParts: () => 
        request<{ parts: AvailableParts }>('/pcs/parts/available'),

    buildPC: (gpuId: number, cpuId: number, mbId: number) => 
        request<{ pc: PC }>('/pcs/build', {
            method: 'POST',
            body: JSON.stringify({ gpu_id: gpuId, cpu_id: cpuId, mb_id: mbId }),
        }),

    ejectComponent: (pcId: number, componentId: number) => 
        request<{ component: Card; pc_removed: boolean; remaining_components: number[] }>('/pcs/eject', {
            method: 'POST',
            body: JSON.stringify({ pc_id: pcId, component_id: componentId }),
        }),

    sellPC: (pcId: number) => 
        request<{ sale_price: number; new_balance: number; pc: PC }>('/pcs/sell', {
            method: 'POST',
            body: JSON.stringify({ pc_id: pcId }),
        }),
};
