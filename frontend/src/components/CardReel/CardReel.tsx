import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import { Card, Gadget } from '@/lib/api';
import styles from './CardReel.module.scss';
import cardImage from '@/images/card.png';

interface CardReelProps {
    drawnCard: { card: Card; gadget: Gadget } | null;
    onComplete: () => void;
}

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = 20;
const TOTAL_CARDS = 100;
const CENTER_X = 50; // Percentage position for center

export default function CardReel({ drawnCard, onComplete }: CardReelProps) {
    const [isSpinning, setIsSpinning] = useState(true);
    const [isSlowing, setIsSlowing] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [hasStopped, setHasStopped] = useState(false);
    const x = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 50, damping: 30 });
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!drawnCard) {
            // Start infinite scrolling
            let position = 0;
            const speed = 2;

            const animate = () => {
                position += speed;
                if (position >= (CARD_WIDTH + CARD_SPACING) * TOTAL_CARDS) {
                    position = 0;
                }
                x.set(-position);
                animationRef.current = requestAnimationFrame(animate);
            };

            animate();

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        } else if (drawnCard && isSpinning && !isSlowing) {
            // Start slowing down after receiving the drawn card
            setIsSlowing(true);

            // Calculate target position to center the drawn card
            // We'll use a random position in the first set of cards as the "winning" position
            const targetOffset = -(Math.random() * (CARD_WIDTH + CARD_SPACING) * 5 + (CARD_WIDTH + CARD_SPACING) * 10);

            // Gradually slow down and stop at target
            const slowDown = () => {
                let currentPosition = x.get();
                const distance = targetOffset - currentPosition;
                const speed = Math.max(Math.abs(distance) * 0.1, 0.5);

                if (Math.abs(distance) > speed) {
                    currentPosition += distance > 0 ? speed : -speed;
                    x.set(currentPosition);
                    requestAnimationFrame(slowDown);
                } else {
                    x.set(targetOffset);
                    setIsSpinning(false);
                    setHasStopped(true);

                    // Haptic feedback on stop
                    postEvent('web_app_trigger_haptic_feedback', {
                        type: 'impact',
                        impact_style: 'heavy',
                    });

                    // Start reveal animation
                    setTimeout(() => {
                        setIsRevealing(true);
                        postEvent('web_app_trigger_haptic_feedback', {
                            type: 'notification',
                            notification_type: 'success',
                        });

                        // Call onComplete after reveal
                        setTimeout(() => {
                            onComplete();
                        }, 1500);
                    }, 500);
                }
            };

            slowDown();
        }
    }, [drawnCard, isSpinning, isSlowing, x, onComplete]);

    return (
        <div className={styles.cardReel}>
            <div className={styles.reelContainer}>
                <div className={styles.centerIndicator} />
                <motion.div
                    className={styles.cardsContainer}
                    style={{ x: springX }}
                >
                    {Array.from({ length: TOTAL_CARDS }).map((_, i) => {
                        const isWinningCard = drawnCard && !isSpinning && i === Math.floor(Math.abs(x.get()) / (CARD_WIDTH + CARD_SPACING)) % TOTAL_CARDS;
                        const rarity = drawnCard?.card.rarity || 'Common';

                        return (
                            <motion.div
                                key={i}
                                className={styles.cardWrapper}
                                style={{
                                    width: CARD_WIDTH,
                                    height: CARD_HEIGHT,
                                    marginRight: CARD_SPACING,
                                }}
                                animate={isRevealing && isWinningCard ? {
                                    scale: 1.3,
                                    zIndex: 100,
                                } : {}}
                            >
                                <img
                                    src={cardImage}
                                    alt="Card"
                                    className={`${styles.cardImage} ${isWinningCard ? styles.winningCard : ''}`}
                                    style={{
                                        filter: isWinningCard && isRevealing
                                            ? `drop-shadow(0 0 20px ${getRarityColor(rarity)})`
                                            : 'none',
                                    }}
                                />
                                {isRevealing && isWinningCard && (
                                    <motion.div
                                        className={styles.revealGlow}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1.5 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            background: `radial-gradient(circle, ${getRarityColor(rarity)}80, transparent)`,
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
            <AnimatePresence>
                {isRevealing && drawnCard && (
                    <motion.div
                        className={styles.cardDetails}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <h3 className={styles.cardName}>{drawnCard.gadget.name}</h3>
                        <p className={styles.cardRarity}>{drawnCard.card.rarity}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
        'Trash': '#888888',
        'Common': '#ffffff',
        'Uncommon': '#00ff00',
        'Rare': '#0088ff',
        'Epic': '#ff00ff',
        'Legendary': '#ff8800',
        'Mythic': '#ff0000',
    };
    return colors[rarity] || '#ffffff';
}

