import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showConfirm } from '../telegram';
import { api } from '../api/client';

function CardDetails() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser || !cardId) return;

    setupBackButton(() => navigate('/collection'));
    loadCard(telegramUser.id, parseInt(cardId));

    return () => {
      hideBackButton();
    };
  }, [cardId, navigate]);

  const loadCard = async (userId: number, id: number) => {
    try {
      const response = await api.getCard(userId, id);
      setCard(response.data);
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    const confirmed = await showConfirm('Вы уверены, что хотите продать эту карточку?');
    if (!confirmed) return;

    const telegramUser = getTelegramUser();
    if (!telegramUser || !cardId) return;

    try {
      await api.sellCard(telegramUser.id, parseInt(cardId));
      navigate('/collection');
    } catch (error) {
      console.error('Error selling card:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!card) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Карточка не найдена</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{card.gadget_name}</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Категория:</strong> {card.category}</p>
        <p><strong>Редкость:</strong> {card.rarity}</p>
        <p><strong>Цена:</strong> {card.purchase_price} монет</p>
        {card.in_pc && <p>🔗 Эта деталь находится в ПК</p>}
      </div>

      {!card.in_pc && (
        <button 
          onClick={handleSell}
          style={{ 
            padding: '12px', 
            fontSize: '16px', 
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            width: '100%'
          }}
        >
          💰 Продать ({Math.floor(card.purchase_price * 0.85)} монет)
        </button>
      )}
    </div>
  );
}

export default CardDetails;

