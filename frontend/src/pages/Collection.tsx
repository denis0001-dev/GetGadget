import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton } from '../telegram';
import { api } from '../api/client';

function Collection() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) return;

    setupBackButton(() => navigate('/'));
    loadCards(telegramUser.id);

    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const loadCards = async (userId: number) => {
    try {
      const response = await api.getUserCards(userId, false);
      setCards(response.data.cards || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = filter === 'all' 
    ? cards 
    : cards.filter(card => card.category === filter);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>📚 Моя Коллекция</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '100%' }}
        >
          <option value="all">Все</option>
          <option value="Phone">Телефоны</option>
          <option value="Tablet">Планшеты</option>
          <option value="Laptop">Ноутбуки</option>
          <option value="Graphics Card">Видеокарты</option>
          <option value="Processor">Процессоры</option>
          <option value="Motherboard">Материнские платы</option>
          <option value="PC">ПК</option>
        </select>
      </div>

      {filteredCards.length === 0 ? (
        <p>Нет карточек в этой категории</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredCards.map((card) => (
            <div
              key={card.card_id}
              onClick={() => navigate(`/collection/${card.card_id}`)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <h3>{card.gadget_name}</h3>
              <p>Категория: {card.category}</p>
              <p>Редкость: {card.rarity}</p>
              <p>Цена: {card.purchase_price} монет</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Collection;

