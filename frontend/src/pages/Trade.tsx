import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton } from '../telegram';
import { api } from '../api/client';

function Trade() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) return;

    setupBackButton(() => navigate('/'));
    loadOffers();

    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const loadOffers = async () => {
    try {
      const response = await api.getTradeOffers();
      setOffers(response.data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🔄 Торговля</h1>
      
      <h2>Входящие предложения</h2>
      {offers.incoming?.length === 0 ? (
        <p>Нет входящих предложений</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {offers.incoming?.map((offer: any) => (
            <div key={offer.offer_id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <p>От пользователя: {offer.from_user_id}</p>
              <p>Предложено карточек: {offer.offered_cards?.length || 0}</p>
              <p>Запрошено карточек: {offer.requested_cards?.length || 0}</p>
              <p>Монет: {offer.coins || 0}</p>
            </div>
          ))}
        </div>
      )}

      <h2>Исходящие предложения</h2>
      {offers.outgoing?.length === 0 ? (
        <p>Нет исходящих предложений</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {offers.outgoing?.map((offer: any) => (
            <div key={offer.offer_id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <p>Пользователю: {offer.to_user_id}</p>
              <p>Предложено карточек: {offer.offered_cards?.length || 0}</p>
              <p>Запрошено карточек: {offer.requested_cards?.length || 0}</p>
              <p>Монет: {offer.coins || 0}</p>
              <p>Статус: {offer.status}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '20px', color: '#666' }}>
        Функция создания предложений будет добавлена в следующей версии.
      </p>
    </div>
  );
}

export default Trade;

