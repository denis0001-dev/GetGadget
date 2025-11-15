import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton } from '../telegram';
import { api } from '../api/client';

function PCs() {
  const navigate = useNavigate();
  const [pcs, setPCs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser) return;

    setupBackButton(() => navigate('/'));
    loadPCs(telegramUser.id);

    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const loadPCs = async (userId: number) => {
    try {
      const response = await api.getUserPCs(userId);
      setPCs(response.data.pcs || []);
    } catch (error) {
      console.error('Error loading PCs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (pcs.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🖥️ Мои ПК</h1>
        <p>У вас пока нет собранных ПК.</p>
        <button onClick={() => navigate('/build')} style={{ padding: '12px', fontSize: '16px' }}>
          Собрать ПК
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🖥️ Мои ПК</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pcs.map((pc) => (
          <div
            key={pc.card_id}
            onClick={() => navigate(`/pcs/${pc.card_id}`)}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <h3>{pc.gadget_name}</h3>
            <p>Редкость: {pc.rarity}</p>
            <p>Цена: {pc.purchase_price} монет</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PCs;

