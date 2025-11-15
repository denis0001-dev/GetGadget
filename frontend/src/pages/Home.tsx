import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser } from '../telegram';
import { api } from '../api/client';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) {
      alert('Пожалуйста, откройте приложение через Telegram');
      return;
    }

    loadUserData(telegramUser.id);
  }, []);

  const loadUserData = async (userId: number) => {
    try {
      const response = await api.getUser(userId);
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCard = async () => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) return;

    try {
      await api.getNewCard(telegramUser.id);
      navigate('/collection');
    } catch (error) {
      console.error('Error getting card:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!user) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Ошибка загрузки данных</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎮 Добро пожаловать!</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>💰 Монеты:</strong> {user.coins}</p>
        <p><strong>📊 Всего карточек:</strong> {user.total_cards}</p>
        <p><strong>🖥️ Собранных ПК:</strong> {user.total_pcs}</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleGetCard} style={{ padding: '12px', fontSize: '16px' }}>
          🎴 Получить Карточку
        </button>
        <button onClick={() => navigate('/collection')} style={{ padding: '12px', fontSize: '16px' }}>
          📚 Моя Коллекция
        </button>
        <button onClick={() => navigate('/build')} style={{ padding: '12px', fontSize: '16px' }}>
          🖥️ Собрать ПК
        </button>
        <button onClick={() => navigate('/pcs')} style={{ padding: '12px', fontSize: '16px' }}>
          💻 Мои ПК
        </button>
        <button onClick={() => navigate('/trade')} style={{ padding: '12px', fontSize: '16px' }}>
          🔄 Торговля
        </button>
        <button onClick={() => navigate('/profile')} style={{ padding: '12px', fontSize: '16px' }}>
          👤 Профиль
        </button>
      </div>
    </div>
  );
}

export default Home;

