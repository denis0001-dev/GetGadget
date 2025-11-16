import React from 'react';
import { getTelegramTheme } from '../telegram';

export type TelegramIconName = 'home' | 'collection' | 'build' | 'pcs' | 'trade' | 'profile';

interface TelegramIconProps {
    name: TelegramIconName;
    size?: number;
    active?: boolean;
}

export function TelegramIcon({ name, size = 24, active = false }: TelegramIconProps) {
    const theme = getTelegramTheme();
    const stroke = active ? (theme.isDark ? '#ffffff' : '#000000') : (theme.isDark ? '#8e8e93' : '#8e8e93');

    const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke,
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    switch (name) {
        case 'home':
            return (
                <svg {...common}>
                    <path d="M3 10.5 12 3l9 7.5"/>
                    <path d="M5.5 9v10.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9"/>
                </svg>
            );
        case 'collection':
            return (
                <svg {...common}>
                    <rect x="3.5" y="4" rx="2" ry="2" width="11" height="7"/>
                    <rect x="9.5" y="13" rx="2" ry="2" width="11" height="7"/>
                </svg>
            );
        case 'build':
            return (
                <svg {...common}>
                    <path d="M9 3h6l1.5 3H7.5L9 3Z"/>
                    <rect x="6" y="9" width="12" height="10" rx="2"/>
                </svg>
            );
        case 'pcs':
            return (
                <svg {...common}>
                    <rect x="3.5" y="5.5" width="17" height="11" rx="2"/>
                    <path d="M8 20h8M12 16.5v3.5"/>
                </svg>
            );
        case 'trade':
            return (
                <svg {...common}>
                    <path d="M7 7h10M7 12h10M7 17h10"/>
                    <path d="M7 7l-2 2 2 2M17 13l2 2-2 2"/>
                </svg>
            );
        case 'profile':
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="3.5"/>
                    <path d="M5.5 19a6.5 6.5 0 0 1 13 0"/>
                </svg>
            );
        default:
            return null;
    }
}
