import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, User, UserStats } from '@/lib/api';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await api.getUser();
            setUser(data.user);
            setStats(data.stats);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || 'Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>👤 Профиль</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.content}
                >
                    <div className={styles.coinsCard}>
                        <div className={styles.coinsLabel}>💰 Монеты</div>
                        <div className={styles.coinsAmount}>{user?.coins || 0}</div>
                    </div>

                    {stats && (
                        <div className={styles.statsCard}>
                            <h2 className={styles.statsTitle}>📊 Статистика</h2>
                            <div className={styles.statsList}>
                                <div className={styles.statRow}>
                                    <span className={styles.statLabel}>Всего карточек:</span>
                                    <span className={styles.statValue}>{stats.total_cards} 🎴</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statLabel}>Собранных ПК:</span>
                                    <span className={styles.statValue}>{stats.pc_count} 🖥️</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statLabel}>Стоимость коллекции:</span>
                                    <span className={styles.statValue}>{stats.total_price} монет 💎</span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}


