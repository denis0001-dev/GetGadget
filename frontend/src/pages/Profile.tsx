import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton } from '../telegram';
import { api } from '../api/client';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) return;

    setupBackButton(() => navigate('/'));
    loadProfile(telegramUser.id);

    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const loadProfile = async (userId: number) => {
    try {
      const [userResponse, cardsResponse] = await Promise.all([
        api.getUser(userId),
        api.getUserCards(userId, false)
      ]);
      setUser(userResponse.data);
      setCards(cardsResponse.data.cards || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!user) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Ошибка загрузки</div>;
  }

  const totalPrice = cards.reduce((sum, card) => sum + card.purchase_price, 0);
  const pcs = cards.filter(c => c.category === 'PC');

  return (
    <div style={{ padding: '20px' }}>
      <h1>👤 Профиль</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>💰 Монеты: {user.coins}</h2>
        
        <h3>📊 Статистика:</h3>
        <p>Всего карточек: {user.total_cards} 🎴</p>
        <p>Собранных ПК: {user.total_pcs} 🖥️</p>
        <p>Стоимость коллекции: {totalPrice} монет 💎</p>
      </div>

      <h3>Коллекция по категориям:</h3>
      <div style={{ marginBottom: '20px' }}>
        {['Phone', 'Tablet', 'Laptop', 'Graphics Card', 'Processor', 'Motherboard', 'PC'].map(category => {
          const count = cards.filter(c => c.category === category).length;
          if (count === 0) return null;
          return <p key={category}>{category}: {count}</p>;
        })}
      </div>
    </div>
  );
}

export default Profile;

