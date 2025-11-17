import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import { api, Card, Gadget, User } from '@/lib/api';
import CardReel from '@/components/CardReel/CardReel';
import styles from './HomePage.module.scss';

export default function HomePage() {
    const [coins, setCoins] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [drawnCard, setDrawnCard] = useState<{ card: Card; gadget: Gadget } | null>(null);
    const [showReel, setShowReel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait for SDK initialization before loading user
        const timer = setTimeout(() => {
            loadUser();
        }, 500);
        
        return () => clearTimeout(timer);
    }, []);

    const loadUser = async () => {
        try {
            // First initialize the API connection
            // The api.getUser() will handle getting initData internally
            // But we should call api.init() first if we have initData
            
            // Try to get initData and initialize
            try {
                // Extract from URL hash first (most reliable in Telegram)
                let initData = '';
                if (typeof window !== 'undefined') {
                    const hash = window.location.hash;
                    if (hash) {
                        const params = new URLSearchParams(hash.substring(1));
                        const tgWebAppData = params.get('tgWebAppData');
                        if (tgWebAppData) {
                            initData = decodeURIComponent(tgWebAppData);
                        }
                    }
                }
                
                if (initData) {
                    await api.init(initData);
                }
            } catch (initErr) {
                console.warn('API init failed (may already be initialized):', initErr);
            }
            
            // Then get user data (api.getUser() will get initData from getInitData() function)
            const data = await api.getUser();
            setCoins(data.user.coins);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('Error loading user:', error);
            setError(error.message || 'Ошибка загрузки данных пользователя');
        }
    };

    const handleDrawCard = async () => {
        if (loading) return;

        setLoading(true);
        setError(null);
        setShowReel(true);
        setDrawnCard(null);

        // Haptic feedback
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'impact',
            impact_style: 'medium',
        });

        try {
            const data = await api.drawCard();
            setDrawnCard({ card: data.card, gadget: data.gadget });
            setCoins(data.user.coins);

            // Haptic feedback on success
            postEvent('web_app_trigger_haptic_feedback', {
                type: 'notification',
                notification_type: 'success',
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || 'Ошибка при получении карточки');
            setShowReel(false);
            postEvent('web_app_trigger_haptic_feedback', {
                type: 'notification',
                notification_type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReelComplete = () => {
        setShowReel(false);
    };

    return (
        <div className={styles.homePage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>GetGadget</h1>
                    <div className={styles.coins}>
                        <span className={styles.coinIcon}>💰</span>
                        <span className={styles.coinAmount}>{coins}</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {showReel ? (
                        <motion.div
                            key="reel"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.reelContainer}
                        >
                            <CardReel
                                drawnCard={drawnCard}
                                onComplete={handleReelComplete}
                            />
                        </motion.div>
                    ) : drawnCard ? (
                        <motion.div
                            key="card"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={styles.cardResult}
                        >
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>🎴 Ты получил новую карточку! 🎉</h2>
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardName}>{drawnCard.gadget.name}</h3>
                                    <div className={styles.cardDetails}>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Категория:</span>
                                            <span className={styles.detailValue}>{drawnCard.gadget.category}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Цена:</span>
                                            <span className={styles.detailValue}>{drawnCard.gadget.price} монет 💰</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Редкость:</span>
                                            <span className={styles.detailValue}>{drawnCard.card.rarity}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>ID карточки:</span>
                                            <span className={styles.detailValue}>{drawnCard.card.card_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className={styles.drawAgainButton}
                                    onClick={() => {
                                        setDrawnCard(null);
                                        handleDrawCard();
                                    }}
                                >
                                    Получить еще карточку 🎴
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.mainContent}
                        >
                            {error && (
                                <div className={styles.error}>
                                    {error}
                                </div>
                            )}
                            <button
                                className={styles.drawButton}
                                onClick={handleDrawCard}
                                disabled={loading}
                            >
                                {loading ? 'Получение...' : 'Получить Карточку 🎴'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


