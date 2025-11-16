import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Button, Card, Header, Loading } from '../components';
import { EdgeBackground } from '../components/EdgeBackground';
import { QuickAction } from '../components/QuickAction';
import { motion } from 'framer-motion';

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

    if (loading) return <Loading />;
    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
                Ошибка загрузки данных
            </div>
        );
    }

    const textColor = theme.isDark ? '#ffffff' : '#000000';
    const subColor = '#8e8e93';

    return (
        <div style={{ position: 'relative', minHeight: '100vh', color: textColor, paddingLeft: 'env(safe-area-inset-left, 0)', paddingRight: 'env(safe-area-inset-right, 0)' }}>
            <EdgeBackground />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Header>🎮 Добро пожаловать!</Header>
                <div style={{ padding: '0 12px 16px 12px', opacity: 0.8, fontSize: 13 }}>
                    Собирай редкие гаджеты, прокачивай коллекцию и строй лучшие ПК.
                </div>

                <div style={{ padding: '0 12px 16px 12px' }}>
                    {/* Hero glass panel */}
                    <motion.div
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        style={{
                            borderRadius: 20,
                            padding: 16,
                            background: theme.isDark
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
                                : 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 100%)',
                            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                            color: textColor,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, color: subColor, marginBottom: 6 }}>Монеты</div>
                                <div style={{ fontSize: 28, fontWeight: 700 }}>{user.coins}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: subColor, marginBottom: 6 }}>Карточек</div>
                                <div style={{ fontSize: 22, fontWeight: 700 }}>{user.total_cards}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: subColor, marginBottom: 6 }}>ПК</div>
                                <div style={{ fontSize: 22, fontWeight: 700 }}>{user.total_pcs}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 14, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                            <QuickAction icon="🎴" label="Получить" onClick={handleGetCard} />
                            <QuickAction icon="📚" label="Коллекция" onClick={() => navigate('/collection')} />
                            <QuickAction icon="🛠️" label="Сборка ПК" onClick={() => navigate('/build')} />
                            <QuickAction icon="👤" label="Профиль" onClick={() => navigate('/profile')} />
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <div style={{ marginTop: 16 }}>
                        <Button onClick={handleGetCard} fullWidth>
                            🎴 Получить новую карточку
                        </Button>
                    </div>

                    {/* Latest tips/info card */}
                    <div style={{ marginTop: 16 }}>
                        <Card>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: textColor }}>Совет дня</div>
                            <div style={{ opacity: 0.8, fontSize: 14, color: textColor }}>
                                Собирать ПК выгоднее с редкими комплектующими. Попробуй улучшить шансы — загляни в коллекцию!
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

