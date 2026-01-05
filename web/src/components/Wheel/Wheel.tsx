import React, { useEffect, useState, useRef, Component } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./Wheel.module.scss"
import ActionButton from "../ActionButton/ActionButton"
import { fetchCatalog, postGetCard } from "../../api/client"
import { vibrate } from "../../lib/telegram"

type Item = { name: string; rarity: string }

const RARITY_COLORS: Record<string, string> = {
    Trash: "#6b7280",
    Common: "#9ca3af",
    Uncommon: "#10b981",
    Rare: "#3b82f6",
    Epic: "#8b5cf6",
    Legendary: "#f59e0b",
    Mythic: "#ef4444"
}

// Exact copy of Slot component from react-slot-machine
class Slot extends Component<{
    duration?: number;
    target: number;
    easing?: (elapsed: number, initialValue: number, amountOfChange: number, duration: number) => number;
    times?: number;
    onEnd?: () => void;
    className?: string;
    children: React.ReactNode;
}> {
    static defaultProps = {
        duration: 3000,
        easing: function easeOutQuad(elapsed: number, initialValue: number, amountOfChange: number, duration: number) {
            return -amountOfChange * (elapsed /= duration) * (elapsed - 2) + initialValue;
        },
        times: 1,
        onEnd: function onEnd() {}
    };

    targetRefs: (HTMLElement | null)[] = [];
    FrameRef: HTMLElement | null = null;

    componentDidUpdate(prevProps: any) {
        if (this.props.target === prevProps.target) return;

        const $frame = this.FrameRef;

        if (!$frame) return;

        $frame.scrollTop = 0;

        if (this.props.target === 0) return;

        const $target = this.targetRefs[this.props.target];

        if ($target == null) return;

        const fullScroll = (this.targetRefs[this.targetRefs.length - 1]?.offsetTop || 0);
        const targetOffset = $target.offsetTop;

        const totalScroll = targetOffset + fullScroll * (this.props.times || 1 - 1);
        const startTime = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > (this.props.duration || 3000)) {
                this.props.onEnd?.();
                return;
            }

            const amount = (this.props.easing || Slot.defaultProps.easing)(elapsed, 0, totalScroll, this.props.duration || 3000);
            $frame.scrollTop = amount % fullScroll;

            // Haptic feedback when items pass
            const currentItemIndex = Math.floor(($frame.scrollTop / fullScroll) * this.targetRefs.length);
            if (currentItemIndex !== Math.floor((($frame.scrollTop - 10) / fullScroll) * this.targetRefs.length)) {
                vibrate();
            }

            requestAnimationFrame(tick);
        };

        tick();
    }

    render() {
        const children = React.Children.toArray(this.props.children);

        return React.createElement(
            'div',
            {
                className: this.props.className,
                style: { overflow: 'hidden', position: 'relative' },
                ref: (FrameRef: HTMLElement | null) => {
                    this.FrameRef = FrameRef;
                }
            },
            children.map((child, index) => {
                // Create a wrapper div that can accept the ref
                return React.createElement(
                    'div',
                    {
                        key: index,
                        ref: (ref: HTMLElement | null) => {
                            this.targetRefs[index] = ref;
                        }
                    },
                    child
                );
            })
        );
    }
}

export default function Wheel() {
    const [items, setItems] = useState<Item[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [target, setTarget] = useState(0);

    useEffect(() => {
        fetchCatalog().then(setItems);
    }, []);


    const handleSpin = () => {
        if (isSpinning || items.length === 0) return;

        setIsSpinning(true);
        setSelectedItem(null);

        // Random target (skip index 0 which is the default/placeholder)
        const randomIndex = Math.floor(Math.random() * (items.length - 1)) + 1;
        setTarget(randomIndex);
    }

    const handleEnd = () => {
        setIsSpinning(false);
        if (target > 0 && items[target]) {
            setSelectedItem(items[target]);

            // Get the card after spinning
            postGetCard().then(() => {
                fetchCatalog().then(setItems);
            });
        }
    }

    return (
        <div className={styles.wheelContainer}>
            <Slot
                className={styles.slot}
                duration={5000}
                target={target}
                times={5}
                onEnd={handleEnd}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={styles.slotItem}
                        style={{
                        backgroundColor: RARITY_COLORS[item.rarity] || '#666',
                        color: '#fff'
                        }}
                    >
                        <div className={styles.itemContent}>
                            <div className={styles.itemName}>{item.name}</div>
                            <div className={styles.itemRarity}>{item.rarity}</div>
                        </div>
                    </div>
                ))}
            </Slot>

            {/* Spin Button */}
            <ActionButton
                onClick={handleSpin}
                disabled={isSpinning}
            >
                {isSpinning ? 'Spinning...' : 'Spin!'}
            </ActionButton>

            {/* Result Display */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        className={styles.result}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            borderColor: RARITY_COLORS[selectedItem.rarity] || '#667'
                        }}
                    >
                        <h3>You got:</h3>
                        <p>{selectedItem.name}</p>
                        <span className={styles.rarity} style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                        {selectedItem.rarity}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}