import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    confirmText = 'OK',
    cancelText = 'Отмена',
    onConfirm,
    onCancel,
}: ModalProps) {
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

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    style={overlayStyle}
                    onClick={handleOverlayClick}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        style={modalStyle}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {title && (
                            <motion.h2
                                style={{
                                    marginTop: 0,
                                    marginBottom: '16px',
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: theme.isDark ? '#ffffff' : '#000000',
                                }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                {title}
                            </motion.h2>
                        )}
                        <motion.div
                            style={{ marginBottom: '20px', color: theme.isDark ? '#ffffff' : '#000000' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            {children}
                        </motion.div>
                        <motion.div
                            style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
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
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

