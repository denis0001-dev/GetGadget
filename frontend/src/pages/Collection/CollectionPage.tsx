import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import { api, Card, TypeCount } from '@/lib/api';
import styles from './CollectionPage.module.scss';

const GADGET_TYPE_GROUPS: Record<string, { name: string; categories: string[] }> = {
    'phones': { name: '📱 Телефоны', categories: ['Phone'] },
    'tablets': { name: '📱 Планшеты', categories: ['Tablet'] },
    'pcs': { name: '🖥️ ПК', categories: ['PC'] },
    'pc_parts': { name: '🔧 Комплектующие ПК', categories: ['Graphics Card', 'Processor', 'Motherboard'] },
    'laptops': { name: '💻 Ноутбуки', categories: ['Laptop'] },
};

const RARITY_ORDER = ['Trash', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const RARITY_NAMES: Record<string, string> = {
    'Trash': 'Мусор',
    'Common': 'Обычная',
    'Uncommon': 'Необычная',
    'Rare': 'Редкая',
    'Epic': 'Эпическая',
    'Legendary': 'Легендарная',
    'Mythic': 'Мифическая',
};
const RARITY_EMOJIS: Record<string, string> = {
    'Trash': '🗑️',
    'Common': '⚪',
    'Uncommon': '🟢',
    'Rare': '🔵',
    'Epic': '🟣',
    'Legendary': '🟠',
    'Mythic': '🔴',
};

type ViewState = 'types' | 'rarities' | 'cards';

export default function CollectionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [viewState, setViewState] = useState<ViewState>('types');
    const [types, setTypes] = useState<Record<string, TypeCount>>({});
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedRarity, setSelectedRarity] = useState<string>('');
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await api.getCardTypes();
            setTypes(data.types);
            setViewState('types');
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (type: string) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        setSelectedType(type);
        setViewState('rarities');
    };

    const handleRaritySelect = async (rarity: string) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        setSelectedRarity(rarity);
        setLoading(true);
        try {
            const data = await api.getCardsByTypeRarity(selectedType, rarity);
            setCards(data.cards);
            setViewState('cards');
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки карточек');
        } finally {
            setLoading(false);
        }
    };

    const handleCardSelect = (cardId: number) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'impact',
            impact_style: 'light',
        });
        navigate(`/collection/card/${cardId}`, {
            state: { from: location.pathname, type: selectedType, rarity: selectedRarity },
        });
    };

    const handleBack = () => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        if (viewState === 'cards') {
            setViewState('rarities');
            setCards([]);
        } else if (viewState === 'rarities') {
            setViewState('types');
            setSelectedType('');
            setSelectedRarity('');
        }
    };

    const typeInfo = selectedType ? GADGET_TYPE_GROUPS[selectedType] : null;
    const rarities = typeInfo && types[selectedType] ? Object.keys(types[selectedType].rarities) : [];

    return (
        <div className={styles.collectionPage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>📚 Коллекция</h1>
                    {viewState !== 'types' && (
                        <button className={styles.backButton} onClick={handleBack}>
                            ← Назад
                        </button>
                    )}
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {viewState === 'types' && (
                        <motion.div
                            key="types"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            {loading ? (
                                <div className={styles.loading}>Загрузка...</div>
                            ) : Object.keys(types).length === 0 ? (
                                <div className={styles.empty}>
                                    <p>📭 У тебя пока нет гаджетов!</p>
                                    <p>Используй главную страницу чтобы получить первую карточку! 🎴</p>
                                </div>
                            ) : (
                                <div className={styles.typesList}>
                                    {Object.entries(types).map(([typeKey, typeData]) => (
                                        <button
                                            key={typeKey}
                                            className={styles.typeCard}
                                            onClick={() => handleTypeSelect(typeKey)}
                                        >
                                            <span className={styles.typeName}>{typeData.name}</span>
                                            <span className={styles.typeCount}>{typeData.total}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {viewState === 'rarities' && typeInfo && (
                        <motion.div
                            key="rarities"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <h2 className={styles.sectionTitle}>{typeInfo.name}</h2>
                            <div className={styles.raritiesList}>
                                {RARITY_ORDER.filter(r => rarities.includes(r)).map((rarity) => {
                                    const count = types[selectedType]?.rarities[rarity] || 0;
                                    return (
                                        <button
                                            key={rarity}
                                            className={styles.rarityCard}
                                            onClick={() => handleRaritySelect(rarity)}
                                        >
                                            <span className={styles.rarityEmoji}>{RARITY_EMOJIS[rarity]}</span>
                                            <span className={styles.rarityName}>{RARITY_NAMES[rarity]}</span>
                                            <span className={styles.rarityCount}>({count})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {viewState === 'cards' && (
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <h2 className={styles.sectionTitle}>
                                {typeInfo?.name} - {RARITY_EMOJIS[selectedRarity]} {RARITY_NAMES[selectedRarity]}
                            </h2>
                            {loading ? (
                                <div className={styles.loading}>Загрузка...</div>
                            ) : cards.length === 0 ? (
                                <div className={styles.empty}>Нет карточек этой редкости</div>
                            ) : (
                                <div className={styles.cardsGrid}>
                                    {cards.map((card) => (
                                        <button
                                            key={card.card_id}
                                            className={styles.cardButton}
                                            onClick={() => handleCardSelect(card.card_id)}
                                        >
                                            <div className={styles.cardName}>{card.gadget_name}</div>
                                            <div className={styles.cardPrice}>{card.purchase_price} 💰</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


