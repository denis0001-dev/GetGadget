import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showConfirm } from '../telegram';
import { api } from '../api/client';

function PCDetails() {
  const { pcId } = useParams<{ pcId: string }>();
  const navigate = useNavigate();
  const [pc, setPC] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramUser = getTelegramUser();
    if (!telegramUser || !pcId) return;

    setupBackButton(() => navigate('/pcs'));
    loadPC(telegramUser.id, parseInt(pcId));

    return () => {
      hideBackButton();
    };
  }, [pcId, navigate]);

  const loadPC = async (userId: number, id: number) => {
    try {
      const response = await api.getCard(userId, id);
      setPC(response.data);
      
      // Load component details
      if (response.data.components) {
        const compPromises = response.data.components.map((compId: number) =>
          api.getCard(userId, compId)
        );
        const compResponses = await Promise.all(compPromises);
        setComponents(compResponses.map(r => r.data));
      }
    } catch (error) {
      console.error('Error loading PC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEject = async (componentId: number) => {
    const confirmed = await showConfirm('Вы уверены, что хотите вытащить эту деталь?');
    if (!confirmed) return;

    const telegramUser = getTelegramUser();
    if (!telegramUser || !pcId) return;

    try {
      await api.ejectComponent(telegramUser.id, parseInt(pcId), componentId);
      loadPC(telegramUser.id, parseInt(pcId));
    } catch (error) {
      console.error('Error ejecting component:', error);
    }
  };

  const handleSell = async () => {
    const confirmed = await showConfirm('Вы уверены, что хотите продать этот ПК? Все компоненты будут проданы вместе с ПК.');
    if (!confirmed) return;

    const telegramUser = getTelegramUser();
    if (!telegramUser || !pcId) return;

    try {
      await api.sellPC(telegramUser.id, parseInt(pcId));
      navigate('/pcs');
    } catch (error) {
      console.error('Error selling PC:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!pc) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>ПК не найден</div>;
  }

  const specs = pc.specs || {};

  return (
    <div style={{ padding: '20px' }}>
      <h1>{pc.gadget_name}</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Редкость:</strong> {pc.rarity}</p>
        <p><strong>Цена:</strong> {pc.purchase_price} монет</p>
        
        <h3>Компоненты:</h3>
        {components.map((comp, idx) => (
          <div key={comp.card_id} style={{ marginBottom: '10px' }}>
            <p>
              {idx === 0 && '🎮 '}
              {idx === 1 && '⚡ '}
              {idx === 2 && '🔌 '}
              {comp.gadget_name}
            </p>
            <button 
              onClick={() => handleEject(comp.card_id)}
              style={{ padding: '8px', fontSize: '14px' }}
            >
              Вытащить
            </button>
          </div>
        ))}
        
        <h3>Характеристики:</h3>
        <p>💾 ОЗУ: {specs.ram || 'Н/Д'}</p>
        <p>💿 Накопитель: {specs.storage || 'Н/Д'}</p>
        <p>🔋 БП: {specs.psu || 'Н/Д'}</p>
        <p>📦 Корпус: {specs.case || 'Н/Д'}</p>
      </div>

      {components.length === 3 && (
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
          💰 Продать ПК
        </button>
      )}
    </div>
  );
}

export default PCDetails;

