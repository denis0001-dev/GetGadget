import { motion } from 'framer-motion';
import styles from './HelpPage.module.scss';

export default function HelpPage() {
    return (
        <div className={styles.helpPage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>📖 Помощь</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.content}
                >
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Команды Бота</h2>
                        <div className={styles.commandList}>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/start</span>
                                <span className={styles.commandDesc}>Приветствие и обзор бота</span>
                            </div>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/card</span>
                                <span className={styles.commandDesc}>Получить случайную карточку гаджета</span>
                            </div>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/gadgets</span>
                                <span className={styles.commandDesc}>Посмотреть свою коллекцию гаджетов</span>
                            </div>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/profile</span>
                                <span className={styles.commandDesc}>Посмотреть профиль и статистику</span>
                            </div>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/build</span>
                                <span className={styles.commandDesc}>Собрать кастомный ПК из деталей</span>
                            </div>
                            <div className={styles.commandItem}>
                                <span className={styles.commandName}>/help</span>
                                <span className={styles.commandDesc}>Показать это сообщение помощи</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>💰 Система Монет</h2>
                        <ul className={styles.infoList}>
                            <li>Начинаешь с 0 монет (но это не проблема!)</li>
                            <li>Зарабатывай монеты, продавая карточки</li>
                            <li>При продаже получаешь 85% от оригинальной цены (комиссия 15%)</li>
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>🎴 Уровни Редкости</h2>
                        <div className={styles.rarityList}>
                            <div className={styles.rarityItem}>🗑️ Мусор</div>
                            <div className={styles.rarityItem}>⚪ Обычная</div>
                            <div className={styles.rarityItem}>🟢 Необычная</div>
                            <div className={styles.rarityItem}>🔵 Редкая</div>
                            <div className={styles.rarityItem}>🟣 Эпическая</div>
                            <div className={styles.rarityItem}>🟠 Легендарная</div>
                            <div className={styles.rarityItem}>🔴 Мифическая</div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>🖥️ Сборка ПК</h2>
                        <ul className={styles.infoList}>
                            <li>Собирай видеокарты, процессоры и материнки</li>
                            <li>Используй страницу "Собрать" чтобы собрать их в ПК</li>
                            <li>Характеристики ПК (ОЗУ, накопитель, БП, корпус) генерируются автоматически</li>
                            <li>Можешь вытащить детали из ПК в любой момент</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}


