/**
* API client for backend communication using fetch
*/

import { getInitData, showAlert } from '../telegram';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.getgadgets.toolbox-io.ru';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;
  
    // Build URL with query parameters
    let url = `${API_URL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        url += `?${searchParams.toString()}`;
    }
  
    // Get Telegram init data for authentication
    const initData = getInitData();
  
    // Prepare headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
  
    if (initData) {
        headers['X-Init-Data'] = initData;
    }
  
    // Prepare request options
    const fetchOptions: RequestInit = {
        method,
        headers,
    };
  
    if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
    }
  
    try {
        const response = await fetch(url, fetchOptions);
    
        // Handle errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            const status = response.status;
      
            if (status === 401) {
                showAlert('Ошибка авторизации. Пожалуйста, откройте приложение через Telegram.');
            } else if (status === 404) {
                showAlert(errorData?.detail || 'Ресурс не найден');
            } else if (status === 400) {
                showAlert(errorData?.detail || 'Неверный запрос');
            } else if (status >= 500) {
                showAlert('Ошибка сервера. Попробуйте позже.');
            } else {
                showAlert(errorData?.detail || 'Произошла ошибка');
            }
      
            throw new Error(errorData?.detail || `HTTP ${status}`);
        }
    
        // Parse response
        const data = await response.json();
        return data;
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
        } else if (!error.message.startsWith('HTTP')) {
            showAlert('Произошла ошибка при выполнении запроса');
        }
        throw error;
    }
}

// API functions
export const api = {
    // User endpoints
    getUser: (userId: number) => request(`/api/user/${userId}`),
    getUserCards: (userId: number, availableOnly = false) =>
        request(`/api/user/${userId}/cards`, { params: { available_only: availableOnly } }),
    getCard: (userId: number, cardId: number) =>
        request(`/api/user/${userId}/cards/${cardId}`),
    getNewCard: (userId: number) => request(`/api/user/${userId}/cards`, { method: 'POST' }),
  
    // PC endpoints
    getUserPCs: (userId: number) => request(`/api/user/${userId}/pcs`),
    buildPC: (userId: number, gpuId: number, cpuId: number, mbId: number) =>
        request(`/api/user/${userId}/build-pc`, {
            method: 'POST',
            body: {
                gpu_id: gpuId,
                cpu_id: cpuId,
                mb_id: mbId,
            },
        }),
    getAvailablePCParts: (userId: number) =>
        request(`/api/user/${userId}/pc-parts`),
  
    // Card actions
    sellCard: (userId: number, cardId: number) =>
        request(`/api/user/${userId}/cards/${cardId}/sell`, { method: 'POST' }),
  
    // PC actions
    sellPC: (userId: number, pcId: number) =>
        request(`/api/user/${userId}/pcs/${pcId}/sell`, { method: 'POST' }),
    ejectComponent: (userId: number, pcId: number, componentId: number) =>
        request(`/api/user/${userId}/pcs/${pcId}/eject`, {
            method: 'POST',
            params: { component_id: componentId },
        }),
  
    // Trading endpoints (user_id extracted from Telegram init data)
    createTradeOffer: (toUserId: number, offeredCards: number[], requestedCards: number[], coins: number) =>
        request('/api/trade/offer', {
            method: 'POST',
            body: {
                to_user_id: toUserId,
                offered_cards: offeredCards,
                requested_cards: requestedCards,
                coins: coins,
            },
        }),
    getTradeOffers: () => request('/api/trade/offers'),
    acceptTrade: (offerId: number) => request(`/api/trade/accept/${offerId}`, { method: 'POST' }),
    rejectTrade: (offerId: number) => request(`/api/trade/reject/${offerId}`, { method: 'POST' }),
    getTradeHistory: () => request('/api/trade/history'),
    getAvailableCardsForTrade: (userId: number) =>
        request(`/api/users/${userId}/cards/available`),
};
