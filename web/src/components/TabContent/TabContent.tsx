import TitleBar from "../TitleBar/TitleBar";
import styles from "./TabContent.module.scss";

interface TabContentProps {
    title?: string
    children?: React.ReactNode
}

export default function TabContent({ title, children }: TabContentProps) {
    return (
        <div className={styles.container}>
            {title && <TitleBar>{title}</TitleBar>}
            {children}
        </div>
    );
}