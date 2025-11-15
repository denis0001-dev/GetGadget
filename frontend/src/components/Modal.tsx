import React, { useEffect } from 'react';
import { getTelegramTheme } from '../telegram';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmText = 'OK',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}) => {
  const theme = getTelegramTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        {title && (
          <h2
            style={{
              marginTop: 0,
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: '600',
              color: theme.isDark ? '#ffffff' : '#000000',
            }}
          >
            {title}
          </h2>
        )}
        <div style={{ marginBottom: '20px', color: theme.isDark ? '#ffffff' : '#000000' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel || onClose}>
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

