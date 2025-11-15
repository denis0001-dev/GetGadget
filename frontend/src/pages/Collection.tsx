import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, List, Cell, Loading } from '../components';

export function Collection() {
    const navigate = useNavigate();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const theme = getTelegramTheme();

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
            setCards(response.cards || []);
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
        return <Loading />;
    }

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>📚 Моя Коллекция</Header>
      
            <div style={{ padding: '16px' }}>
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ 
                        padding: '12px 16px', 
                        fontSize: '16px', 
                        width: '100%',
                        marginBottom: '16px',
                        borderRadius: '12px',
                        border: theme.isDark ? '1px solid #2c2c2e' : '1px solid #e5e5e7',
                        backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
                        color: theme.isDark ? '#ffffff' : '#000000',
                    }}
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

                {filteredCards.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: theme.isDark ? '#8e8e93' : '#8e8e93'
                    }}>
                        Нет карточек в этой категории
                    </div>
                ) : (
                    <List>
                        {filteredCards.map((card, index) => (
                            <Cell
                                key={card.card_id}
                                onClick={() => navigate(`/collection/${card.card_id}`)}
                                after="→"
                                index={index}
                            >
                                <div>
                                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                        {card.gadget_name}
                                    </div>
                                    <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                        {card.category} • {card.rarity} • {card.purchase_price} монет
                                    </div>
                                </div>
                            </Cell>
                        ))}
                    </List>
                )}
            </div>
        </div>
    );
}

