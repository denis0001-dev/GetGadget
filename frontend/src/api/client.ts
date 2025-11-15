/**
 * API client for backend communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getInitData, getTelegramUser, showAlert } from '../telegram';

const API_URL = import.meta.env.VITE_API_URL || 'http://95.165.0.162:8400';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include Telegram init data
apiClient.interceptors.request.use(
  (config) => {
    const initData = getInitData();
    if (initData) {
      config.headers['X-Init-Data'] = initData;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 401) {
        showAlert('Ошибка авторизации. Пожалуйста, откройте приложение через Telegram.');
      } else if (status === 404) {
        showAlert(data?.detail || 'Ресурс не найден');
      } else if (status === 400) {
        showAlert(data?.detail || 'Неверный запрос');
      } else if (status >= 500) {
        showAlert('Ошибка сервера. Попробуйте позже.');
      } else {
        showAlert(data?.detail || 'Произошла ошибка');
      }
    } else if (error.request) {
      showAlert('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    } else {
      showAlert('Произошла ошибка при выполнении запроса');
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // User endpoints
  getUser: (userId: number) => apiClient.get(`/api/user/${userId}`),
  getUserCards: (userId: number, availableOnly = false) =>
    apiClient.get(`/api/user/${userId}/cards`, { params: { available_only: availableOnly } }),
  getCard: (userId: number, cardId: number) =>
    apiClient.get(`/api/user/${userId}/cards/${cardId}`),
  getNewCard: (userId: number) => apiClient.post(`/api/user/${userId}/cards`),
  
  // PC endpoints
  getUserPCs: (userId: number) => apiClient.get(`/api/user/${userId}/pcs`),
  buildPC: (userId: number, gpuId: number, cpuId: number, mbId: number) =>
    apiClient.post(`/api/user/${userId}/build-pc`, {
      gpu_id: gpuId,
      cpu_id: cpuId,
      mb_id: mbId,
    }),
  getAvailablePCParts: (userId: number) =>
    apiClient.get(`/api/user/${userId}/pc-parts`),
  
  // Card actions
  sellCard: (userId: number, cardId: number) =>
    apiClient.post(`/api/user/${userId}/cards/${cardId}/sell`),
  
  // PC actions
  sellPC: (userId: number, pcId: number) =>
    apiClient.post(`/api/user/${userId}/pcs/${pcId}/sell`),
  ejectComponent: (userId: number, pcId: number, componentId: number) =>
    apiClient.post(`/api/user/${userId}/pcs/${pcId}/eject?component_id=${componentId}`),
  
  // Trading endpoints (user_id extracted from Telegram init data)
  createTradeOffer: (toUserId: number, offeredCards: number[], requestedCards: number[], coins: number) =>
    apiClient.post('/api/trade/offer', {
      to_user_id: toUserId,
      offered_cards: offeredCards,
      requested_cards: requestedCards,
      coins: coins,
    }),
  getTradeOffers: () => apiClient.get('/api/trade/offers'),
  acceptTrade: (offerId: number) => apiClient.post(`/api/trade/accept/${offerId}`),
  rejectTrade: (offerId: number) => apiClient.post(`/api/trade/reject/${offerId}`),
  getTradeHistory: () => apiClient.get('/api/trade/history'),
  getAvailableCardsForTrade: (userId: number) =>
    apiClient.get(`/api/users/${userId}/cards/available`),
};

export default apiClient;

