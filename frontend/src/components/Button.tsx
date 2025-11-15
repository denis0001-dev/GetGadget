import React from 'react';
import { getTelegramTheme } from '../telegram';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  style,
  fullWidth = false,
}) => {
  const theme = getTelegramTheme();
  
  const baseStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.isDark ? '#3390ec' : '#3390ec',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.isDark ? '#2b2b2b' : '#f0f0f0',
      color: theme.isDark ? '#ffffff' : '#000000',
    },
    danger: {
      backgroundColor: '#ff3b30',
      color: '#ffffff',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
};

