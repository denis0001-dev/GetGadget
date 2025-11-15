import React from 'react';
import { getTelegramTheme } from '../telegram';

interface LoadingProps {
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ text = 'Загрузка...' }) => {
  const theme = getTelegramTheme();
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: theme.isDark ? '#ffffff' : '#000000',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.isDark ? '#2c2c2e' : '#e5e5e7'}`,
          borderTop: `3px solid ${theme.isDark ? '#ffffff' : '#3390ec'}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }}
      />
      <div style={{ fontSize: '16px' }}>{text}</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

