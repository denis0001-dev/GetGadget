import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, Card, Loading, List, Cell } from '../components';

export function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = getTelegramTheme();

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
            setUser(userResponse);
            setCards(cardsResponse.cards || []);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
                Ошибка загрузки
            </div>
        );
    }

    const totalPrice = cards.reduce((sum, card) => sum + card.purchase_price, 0);
    const pcs = cards.filter(c => c.category === 'PC');
  
    const categoryCounts: Record<string, number> = {};
    ['Phone', 'Tablet', 'Laptop', 'Graphics Card', 'Processor', 'Motherboard', 'PC'].forEach(category => {
        categoryCounts[category] = cards.filter(c => c.category === category).length;
    });

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>👤 Профиль</Header>
      
            <div style={{ padding: '16px' }}>
                <Card>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                            💰 Монеты
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '600', color: theme.isDark ? '#ffffff' : '#000000' }}>
                            {user.coins}
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: theme.isDark ? '#ffffff' : '#000000'
                    }}>
                        📊 Статистика
                    </div>
                    <List>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Всего карточек
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {user.total_cards} 🎴
                                </div>
                            </div>
                        </Cell>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Собранных ПК
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {user.total_pcs} 🖥️
                                </div>
                            </div>
                        </Cell>
                        <Cell>
                            <div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                                    Стоимость коллекции
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {totalPrice} монет 💎
                                </div>
                            </div>
                        </Cell>
                    </List>
                </Card>

                <Card>
                    <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: theme.isDark ? '#ffffff' : '#000000'
                    }}>
                        Коллекция по категориям
                    </div>
                    <List>
                        {Object.entries(categoryCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([category, count]) => (
                                <Cell key={category}>
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                            {category}
                                        </div>
                                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                            {count} карточек
                                        </div>
                                    </div>
                                </Cell>
                            ))}
                    </List>
                </Card>
            </div>
        </div>
    );
}

