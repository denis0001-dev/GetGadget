import { ReactNode } from 'react';
import styles from './SafeAreaView.module.scss';

interface SafeAreaViewProps {
    children: ReactNode;
}

export default function SafeAreaView({ children }: SafeAreaViewProps) {
    return (
        <div className={styles.safeArea}>
            {children}
        </div>
    );
}