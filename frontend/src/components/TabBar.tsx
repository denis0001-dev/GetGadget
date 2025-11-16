import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';
import { Link, useLocation } from 'react-router-dom';
import { TelegramIcon } from './TelegramIcon';
import type { TelegramIconName } from './TelegramIcon';

interface TabItem {
    path: string;
    label: string;
    icon: TelegramIconName;
}

interface TabBarProps {
    items: TabItem[];
    pillPadding?: number; // horizontal padding (px) added to the pill highlight (applied to both sides)
}

export function TabBar({ items, pillPadding = 8 }: TabBarProps) {
    const theme = getTelegramTheme();
    const location = useLocation();

    // Robust active index: exact '/' match, otherwise longest matching prefix
    const activeIndex = useMemo(() => {
        const p = location.pathname;
        const rootIdx = items.findIndex(i => i.path === '/');
        if (p === '/' && rootIdx !== -1) return rootIdx;
        let bestIdx = rootIdx !== -1 ? rootIdx : 0;
        let bestLen = -1;
        items.forEach((it, idx) => {
            if (it.path !== '/' && p.startsWith(it.path)) {
                if (it.path.length > bestLen) {
                    bestLen = it.path.length;
                    bestIdx = idx;
                }
            }
        });
        return bestIdx;
    }, [location.pathname, items]);

    const glassBg = theme.isDark
        ? 'linear-gradient(180deg, rgba(20,20,22,0.55) 0%, rgba(20,20,22,0.35) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)';

    const borderColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const shadow = theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)';

    // Active pill background (sliding highlight)
    const pillBg = theme.isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 100%)';
    const pillBorder = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    // track pill position/size from active child bounds
    const [pill, setPill] = useState<{ x: number; w: number }>({ x: 0, w: 0 });

    useEffect(() => {
        const measure = () => {
            const el = itemRefs.current[activeIndex];
            const container = containerRef.current;
            if (!el || !container) return;
            const x = el.offsetLeft;
            const w = el.clientWidth;
            // add configurable horizontal padding to the pill (split between left/right)
            setPill({ x: Math.max(0, x - pillPadding), w: w + pillPadding * 2 });
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('orientationchange', measure);
        window.addEventListener('resize', measure);
        return () => {
            ro.disconnect();
            window.removeEventListener('orientationchange', measure);
            window.removeEventListener('resize', measure);
        };
    }, [activeIndex, pillPadding]);

    return (
        <div
            style={{
                position: 'fixed',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 'calc(env(safe-area-inset-bottom, 0) + 10px)',
                zIndex: 100,
                background: glassBg,
                backdropFilter: 'blur(18px)',
                border: `1px solid ${borderColor}`,
                borderRadius: 25,
                boxShadow: `0 10px 25px ${shadow}`,
                width: 'max-content',
                maxWidth: 'calc(100% - 20px)',
                padding: '0 2px',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 18,
                    height: 64,
                    position: 'relative',
                    padding: '6px 10px',
                }}
            >
                {/* Sliding pill highlight behind active tab */}
                <motion.div
                    initial={false}
                    animate={{ x: pill.x, width: pill.w }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                        position: 'absolute',
                        top: 4,
                        left: 0,
                        bottom: 4,
                        borderRadius: 20,
                        background: pillBg,
                        border: `1px solid ${pillBorder}`,
                        boxShadow: theme.isDark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 16px rgba(0,0,0,0.25)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 16px rgba(0,0,0,0.08)',
                        zIndex: 0,
                        willChange: 'transform,width',
                    }}
                />

                {items.map((item, index) => {
                    const active = index === activeIndex;
                    return (
                        <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                            <div
                                ref={(node) => { itemRefs.current[index] = node; }}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: active ? (theme.isDark ? '#ffffff' : '#000000') : (theme.isDark ? '#8e8e93' : '#8e8e93'),
                                    zIndex: 1,
                                }}
                            >
                                <motion.div
                                    animate={{ scale: active ? 1.08 : 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <TelegramIcon name={item.icon} active={active} />
                                </motion.div>
                                <div style={{ fontSize: 11 }}>{item.label}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
