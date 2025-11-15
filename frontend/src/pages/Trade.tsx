import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, List, Cell, Loading, Card } from '../components';

function Trade() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const theme = getTelegramTheme();

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
    return <Loading />;
  }

  return (
    <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
      <Header>🔄 Торговля</Header>
      
      <div style={{ padding: '16px' }}>
        <Card>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: theme.isDark ? '#ffffff' : '#000000'
          }}>
            Входящие предложения
          </div>
          {offers.incoming?.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: theme.isDark ? '#8e8e93' : '#8e8e93'
            }}>
              Нет входящих предложений
            </div>
          ) : (
            <List>
              {offers.incoming?.map((offer: any) => (
                <Cell key={offer.offer_id} multiline>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      От пользователя: {offer.from_user_id}
                    </div>
                    <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                      Предложено: {offer.offered_cards?.length || 0} карточек
                    </div>
                    <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                      Запрошено: {offer.requested_cards?.length || 0} карточек
                    </div>
                    {offer.coins > 0 && (
                      <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                        Монет: {offer.coins}
                      </div>
                    )}
                  </div>
                </Cell>
              ))}
            </List>
          )}
        </Card>

        <Card>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: theme.isDark ? '#ffffff' : '#000000'
          }}>
            Исходящие предложения
          </div>
          {offers.outgoing?.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: theme.isDark ? '#8e8e93' : '#8e8e93'
            }}>
              Нет исходящих предложений
            </div>
          ) : (
            <List>
              {offers.outgoing?.map((offer: any) => (
                <Cell key={offer.offer_id} multiline>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      Пользователю: {offer.to_user_id}
                    </div>
                    <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                      Предложено: {offer.offered_cards?.length || 0} карточек
                    </div>
                    <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                      Запрошено: {offer.requested_cards?.length || 0} карточек
                    </div>
                    {offer.coins > 0 && (
                      <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                        Монет: {offer.coins}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '14px', 
                      color: offer.status === 'accepted' ? '#34c759' : 
                             offer.status === 'rejected' ? '#ff3b30' : '#ff9500',
                      marginTop: '4px'
                    }}>
                      Статус: {offer.status}
                    </div>
                  </div>
                </Cell>
              ))}
            </List>
          )}
        </Card>

        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
          borderRadius: '8px',
          fontSize: '14px',
          color: theme.isDark ? '#8e8e93' : '#8e8e93',
          textAlign: 'center'
        }}>
          Функция создания предложений будет добавлена в следующей версии.
        </div>
      </div>
    </div>
  );
}

export default Trade;
