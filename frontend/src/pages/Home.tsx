import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Button, Card, Header, Loading } from '../components';

export function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const theme = getTelegramTheme();

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
            setUser(response);
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
        return <Loading />;
    }

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
                Ошибка загрузки данных
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>🎮 Добро пожаловать!</Header>
      
            <div style={{ padding: '16px' }}>
                <Card>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                            💰 Монеты
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: theme.isDark ? '#ffffff' : '#000000' }}>
                            {user.coins}
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                            📊 Всего карточек
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: theme.isDark ? '#ffffff' : '#000000' }}>
                            {user.total_cards}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginBottom: '4px' }}>
                            🖥️ Собранных ПК
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: theme.isDark ? '#ffffff' : '#000000' }}>
                            {user.total_pcs}
                        </div>
                    </div>
                </Card>
        
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button onClick={handleGetCard} fullWidth>
                        🎴 Получить Карточку
                    </Button>
                    <Button onClick={() => navigate('/collection')} variant="secondary" fullWidth>
                        📚 Моя Коллекция
                    </Button>
                    <Button onClick={() => navigate('/build')} variant="secondary" fullWidth>
                        🖥️ Собрать ПК
                    </Button>
                    <Button onClick={() => navigate('/pcs')} variant="secondary" fullWidth>
                        💻 Мои ПК
                    </Button>
                    <Button onClick={() => navigate('/trade')} variant="secondary" fullWidth>
                        🔄 Торговля
                    </Button>
                    <Button onClick={() => navigate('/profile')} variant="secondary" fullWidth>
                        👤 Профиль
                    </Button>
                </div>
            </div>
        </div>
    );
}

