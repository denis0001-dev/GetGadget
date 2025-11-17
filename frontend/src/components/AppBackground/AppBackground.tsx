import { motion } from 'framer-motion';
import styles from './AppBackground.module.scss';

export default function AppBackground() {
    return (
        <div className={styles.background}>
            <div className={styles.gradient} />
            <div className={styles.particles}>
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className={styles.particle}
                        initial={{
                            x: Math.random() * 100 + '%',
                            y: Math.random() * 100 + '%',
                            opacity: Math.random() * 0.5 + 0.1,
                        }}
                        animate={{
                            x: [
                                Math.random() * 100 + '%',
                                Math.random() * 100 + '%',
                                Math.random() * 100 + '%',
                            ],
                            y: [
                                Math.random() * 100 + '%',
                                Math.random() * 100 + '%',
                                Math.random() * 100 + '%',
                            ],
                            opacity: [
                                Math.random() * 0.5 + 0.1,
                                Math.random() * 0.5 + 0.1,
                                Math.random() * 0.5 + 0.1,
                            ],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

