import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showConfirm, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, Card, Button, Loading, List, Cell } from '../components';

export function CardDetails() {
    const { cardId } = useParams<{ cardId: string }>();
    const navigate = useNavigate();
    const [card, setCard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const theme = getTelegramTheme();

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
            setCard(response);
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
        return <Loading />;
    }

    if (!card) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
                Карточка не найдена
            </div>
        );
    }

    const salePrice = Math.floor(card.purchase_price * 0.85);

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>{card.gadget_name}</Header>
      
            <div style={{ padding: '16px' }}>
                <Card>
                    <List>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Категория
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {card.category}
                                </div>
                            </div>
                        </Cell>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Редкость
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {card.rarity}
                                </div>
                            </div>
                        </Cell>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Цена
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {card.purchase_price} монет
                                </div>
                            </div>
                        </Cell>
                        {card.in_pc && (
                            <Cell>
                                <div style={{ color: theme.isDark ? '#ff9500' : '#ff9500' }}>
                                    🔗 Эта деталь находится в ПК
                                </div>
                            </Cell>
                        )}
                    </List>
                </Card>

                {!card.in_pc && (
                    <Button 
                        onClick={handleSell}
                        variant="danger"
                        fullWidth
                        style={{ marginTop: '16px' }}
                    >
                        💰 Продать ({salePrice} монет)
                    </Button>
                )}
            </div>
        </div>
    );
}

