import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import { api, Card } from '@/lib/api';
import styles from './CardDetailPage.module.scss';

const RARITY_EMOJIS: Record<string, string> = {
    'Trash': '🗑️',
    'Common': '⚪',
    'Uncommon': '🟢',
    'Rare': '🔵',
    'Epic': '🟣',
    'Legendary': '🟠',
    'Mythic': '🔴',
};

const CATEGORY_NAMES: Record<string, string> = {
    'Phone': 'Телефон',
    'Tablet': 'Планшет',
    'Laptop': 'Ноутбук',
    'Graphics Card': 'Видеокарта',
    'Processor': 'Процессор',
    'Motherboard': 'Материнская плата',
    'PC': 'ПК',
};

export default function CardDetailPage() {
    const { cardId } = useParams<{ cardId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [card, setCard] = useState<Card | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selling, setSelling] = useState(false);

    useEffect(() => {
        if (cardId) {
            loadCard(parseInt(cardId));
        }
    }, [cardId]);

    const loadCard = async (id: number) => {
        try {
            setLoading(true);
            const data = await api.getCard(id);
            setCard(data.card);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки карточки');
        } finally {
            setLoading(false);
        }
    };

    const handleSell = async () => {
        if (!card || selling) return;

        const confirmed = window.confirm(
            `⚠️ Подтверждение Продажи\n\n${card.gadget_name}\nОригинальная цена: ${card.purchase_price} монет\nЦена продажи: ${Math.floor(card.purchase_price * 0.85)} монет (85%)\n\nТы уверен, что хочешь продать эту карточку?`
        );

        if (!confirmed) return;

        try {
            setSelling(true);
            const data = await api.sellCard(card.card_id);
            
            postEvent('web_app_trigger_haptic_feedback', {
                type: 'notification',
                notification_type: 'success',
            });

            alert(`💰 Карточка Продана!\n\n${card.gadget_name}\nЦена продажи: ${data.sale_price} монет\n\nНовый баланс: ${data.new_balance} монет 💰`);

            // Navigate back
            const backPath = (location.state as any)?.from || '/collection';
            navigate(backPath);
        } catch (err: any) {
            setError(err.message || 'Ошибка продажи карточки');
            postEvent('web_app_trigger_haptic_feedback', {
                type: 'notification',
                notification_type: 'error',
            });
        } finally {
            setSelling(false);
        }
    };

    const handleBack = () => {
        const backPath = (location.state as any)?.from || '/collection';
        navigate(backPath);
    };

    if (loading) {
        return (
            <div className={styles.cardDetailPage}>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className={styles.cardDetailPage}>
                <div className={styles.container}>
                    <div className={styles.error}>{error || 'Карточка не найдена'}</div>
                    <button className={styles.backButton} onClick={handleBack}>
                        ← Назад
                    </button>
                </div>
            </div>
        );
    }

    const salePrice = Math.floor(card.purchase_price * 0.85);
    const canSell = !card.in_pc;

    return (
        <div className={styles.cardDetailPage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={handleBack}>
                        ← Назад
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.cardContent}
                >
                    <div className={styles.cardHeader}>
                        <span className={styles.rarityEmoji}>{RARITY_EMOJIS[card.rarity]}</span>
                        <h1 className={styles.cardName}>{card.gadget_name}</h1>
                    </div>

                    <div className={styles.cardDetails}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Категория:</span>
                            <span className={styles.detailValue}>{CATEGORY_NAMES[card.category] || card.category}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Редкость:</span>
                            <span className={styles.detailValue}>{card.rarity}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Цена:</span>
                            <span className={styles.detailValue}>{card.purchase_price} монет 💰</span>
                        </div>
                        {card.in_pc && (
                            <div className={styles.inPcWarning}>
                                🔗 Эта деталь находится в ПК
                            </div>
                        )}
                    </div>

                    {canSell && (
                        <button
                            className={styles.sellButton}
                            onClick={handleSell}
                            disabled={selling}
                        >
                            {selling ? 'Продажа...' : `💰 Продать (${salePrice} монет)`}
                        </button>
                    )}

                    {!canSell && (
                        <div className={styles.cannotSell}>
                            Нельзя продать деталь, которая в ПК! Сначала вытащи её.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

