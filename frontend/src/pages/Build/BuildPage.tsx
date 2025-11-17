import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import { api, Card, AvailableParts, PC } from '@/lib/api';
import styles from './BuildPage.module.scss';

const RARITY_EMOJIS: Record<string, string> = {
    'Trash': '🗑️',
    'Common': '⚪',
    'Uncommon': '🟢',
    'Rare': '🔵',
    'Epic': '🟣',
    'Legendary': '🟠',
    'Mythic': '🔴',
};

type BuildStep = 'gpu' | 'cpu' | 'mb' | 'result';

export default function BuildPage() {
    const [step, setStep] = useState<BuildStep>('gpu');
    const [parts, setParts] = useState<AvailableParts | null>(null);
    const [selectedGPU, setSelectedGPU] = useState<Card | null>(null);
    const [selectedCPU, setSelectedCPU] = useState<Card | null>(null);
    const [selectedMB, setSelectedMB] = useState<Card | null>(null);
    const [builtPC, setBuiltPC] = useState<PC | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadParts();
    }, []);

    const loadParts = async () => {
        try {
            setLoading(true);
            const data = await api.getAvailableParts();
            setParts(data.parts);

            // Check if all parts are available
            if (data.parts['Graphics Card'].length === 0) {
                setError('У тебя нет видеокарт! Сначала получи карточки через главную страницу 🎴');
            } else if (data.parts['Processor'].length === 0) {
                setError('У тебя нет процессоров! Сначала получи карточки через главную страницу 🎴');
            } else if (data.parts['Motherboard'].length === 0) {
                setError('У тебя нет материнских плат! Сначала получи карточки через главную страницу 🎴');
            } else {
                setError(null);
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки деталей');
        } finally {
            setLoading(false);
        }
    };

    const handleGPUSelect = (gpu: Card) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        setSelectedGPU(gpu);
        setStep('cpu');
    };

    const handleCPUSelect = (cpu: Card) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        setSelectedCPU(cpu);
        setStep('mb');
    };

    const handleMBSelect = async (mb: Card) => {
        if (!selectedGPU || !selectedCPU) return;

        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        setSelectedMB(mb);
        setLoading(true);
        setError(null);

        try {
            const data = await api.buildPC(selectedGPU.card_id, selectedCPU.card_id, mb.card_id);
            setBuiltPC(data.pc);
            setStep('result');

            postEvent('web_app_trigger_haptic_feedback', {
                type: 'notification',
                notification_type: 'success',
            });
        } catch (err: any) {
            setError(err.message || 'Ошибка сборки ПК');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        if (step === 'mb') {
            setStep('cpu');
            setSelectedMB(null);
        } else if (step === 'cpu') {
            setStep('gpu');
            setSelectedCPU(null);
        }
    };

    const handleReset = () => {
        setStep('gpu');
        setSelectedGPU(null);
        setSelectedCPU(null);
        setSelectedMB(null);
        setBuiltPC(null);
        setError(null);
        loadParts();
    };

    const currentParts = parts ? parts[step === 'gpu' ? 'Graphics Card' : step === 'cpu' ? 'Processor' : 'Motherboard'] : [];

    return (
        <div className={styles.buildPage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>🖥️ Сборка ПК</h1>
                    {step !== 'gpu' && step !== 'result' && (
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
                    {step === 'gpu' && (
                        <motion.div
                            key="gpu"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <h2 className={styles.stepTitle}>Шаг 1: Выбери видеокарту</h2>
                            {loading ? (
                                <div className={styles.loading}>Загрузка...</div>
                            ) : currentParts.length === 0 ? (
                                <div className={styles.empty}>Нет доступных видеокарт</div>
                            ) : (
                                <div className={styles.partsList}>
                                    {currentParts.map((part) => (
                                        <button
                                            key={part.card_id}
                                            className={styles.partCard}
                                            onClick={() => handleGPUSelect(part)}
                                        >
                                            <span className={styles.rarityEmoji}>{RARITY_EMOJIS[part.rarity]}</span>
                                            <span className={styles.partName}>{part.gadget_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'cpu' && selectedGPU && (
                        <motion.div
                            key="cpu"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <div className={styles.selectedInfo}>
                                <span className={styles.selectedLabel}>Выбрана видеокарта:</span>
                                <span className={styles.selectedValue}>{selectedGPU.gadget_name}</span>
                            </div>
                            <h2 className={styles.stepTitle}>Шаг 2: Выбери процессор</h2>
                            {loading ? (
                                <div className={styles.loading}>Загрузка...</div>
                            ) : currentParts.length === 0 ? (
                                <div className={styles.empty}>Нет доступных процессоров</div>
                            ) : (
                                <div className={styles.partsList}>
                                    {currentParts.map((part) => (
                                        <button
                                            key={part.card_id}
                                            className={styles.partCard}
                                            onClick={() => handleCPUSelect(part)}
                                        >
                                            <span className={styles.rarityEmoji}>{RARITY_EMOJIS[part.rarity]}</span>
                                            <span className={styles.partName}>{part.gadget_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'mb' && selectedGPU && selectedCPU && (
                        <motion.div
                            key="mb"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <div className={styles.selectedInfo}>
                                <div>
                                    <span className={styles.selectedLabel}>Выбрана видеокарта:</span>
                                    <span className={styles.selectedValue}>{selectedGPU.gadget_name}</span>
                                </div>
                                <div>
                                    <span className={styles.selectedLabel}>Выбран процессор:</span>
                                    <span className={styles.selectedValue}>{selectedCPU.gadget_name}</span>
                                </div>
                            </div>
                            <h2 className={styles.stepTitle}>Шаг 3: Выбери материнскую плату</h2>
                            {loading ? (
                                <div className={styles.loading}>Сборка ПК...</div>
                            ) : currentParts.length === 0 ? (
                                <div className={styles.empty}>Нет доступных материнских плат</div>
                            ) : (
                                <div className={styles.partsList}>
                                    {currentParts.map((part) => (
                                        <button
                                            key={part.card_id}
                                            className={styles.partCard}
                                            onClick={() => handleMBSelect(part)}
                                            disabled={loading}
                                        >
                                            <span className={styles.rarityEmoji}>{RARITY_EMOJIS[part.rarity]}</span>
                                            <span className={styles.partName}>{part.gadget_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'result' && builtPC && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={styles.content}
                        >
                            <h2 className={styles.resultTitle}>🖥️ Твой ПК Успешно Собран! 🎉</h2>
                            <div className={styles.pcCard}>
                                <h3 className={styles.pcName}>{builtPC.gadget_name}</h3>
                                <div className={styles.pcDetails}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Редкость:</span>
                                        <span className={styles.detailValue}>
                                            {RARITY_EMOJIS[builtPC.rarity]} {builtPC.rarity}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Цена:</span>
                                        <span className={styles.detailValue}>{builtPC.purchase_price} монет 💰</span>
                                    </div>
                                    {builtPC.component_details && builtPC.component_details.length > 0 && (
                                        <>
                                            <div className={styles.sectionTitle}>Компоненты:</div>
                                            {builtPC.component_details.map((comp, idx) => (
                                                <div key={comp.card_id} className={styles.componentRow}>
                                                    <span className={styles.componentLabel}>
                                                        {idx === 0 ? '🎮 Видеокарта:' : idx === 1 ? '⚡ Процессор:' : '🔌 Материнка:'}
                                                    </span>
                                                    <span className={styles.componentValue}>{comp.gadget_name}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {builtPC.specs && (
                                        <>
                                            <div className={styles.sectionTitle}>Характеристики:</div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>💾 ОЗУ:</span>
                                                <span className={styles.detailValue}>{builtPC.specs.ram || 'Н/Д'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>💿 Накопитель:</span>
                                                <span className={styles.detailValue}>{builtPC.specs.storage || 'Н/Д'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🔋 БП:</span>
                                                <span className={styles.detailValue}>{builtPC.specs.psu || 'Н/Д'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>📦 Корпус:</span>
                                                <span className={styles.detailValue}>{builtPC.specs.case || 'Н/Д'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button className={styles.resetButton} onClick={handleReset}>
                                Собрать еще один ПК 🖥️
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

