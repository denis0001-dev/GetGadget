import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showConfirm, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, Card, Button, Loading, List, Cell } from '../components';

function PCDetails() {
  const { pcId } = useParams<{ pcId: string }>();
  const navigate = useNavigate();
  const [pc, setPC] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = getTelegramTheme();

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
    return <Loading />;
  }

  if (!pc) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
        ПК не найден
      </div>
    );
  }

  const specs = pc.specs || {};
  const componentTypes = ['🎮 Видеокарта', '⚡ Процессор', '🔌 Материнка'];

  return (
    <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
      <Header>{pc.gadget_name}</Header>
      
      <div style={{ padding: '16px' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
              Редкость
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {pc.rarity}
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
              Цена
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {pc.purchase_price} монет
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: theme.isDark ? '#ffffff' : '#000000'
          }}>
            Компоненты
          </div>
          <List>
            {components.map((comp, idx) => (
              <Cell
                key={comp.card_id}
                before={componentTypes[idx]}
                after={
                  <Button
                    onClick={() => handleEject(comp.card_id)}
                    variant="secondary"
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                  >
                    Вытащить
                  </Button>
                }
              >
                <div style={{ fontWeight: '500' }}>
                  {comp.gadget_name}
                </div>
              </Cell>
            ))}
          </List>
        </Card>

        <Card>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: theme.isDark ? '#ffffff' : '#000000'
          }}>
            Характеристики
          </div>
          <List>
            <Cell>
              <div>
                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                  💾 ОЗУ
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {specs.ram || 'Н/Д'}
                </div>
              </div>
            </Cell>
            <Cell>
              <div>
                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                  💿 Накопитель
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {specs.storage || 'Н/Д'}
                </div>
              </div>
            </Cell>
            <Cell>
              <div>
                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                  🔋 БП
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {specs.psu || 'Н/Д'}
                </div>
              </div>
            </Cell>
            <Cell>
              <div>
                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                  📦 Корпус
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {specs.case || 'Н/Д'}
                </div>
              </div>
            </Cell>
          </List>
        </Card>

        {components.length === 3 && (
          <Button 
            onClick={handleSell}
            variant="danger"
            fullWidth
            style={{ marginTop: '16px' }}
          >
            💰 Продать ПК
          </Button>
        )}
      </div>
    </div>
  );
}

export default PCDetails;
