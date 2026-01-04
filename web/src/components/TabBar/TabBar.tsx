import styles from "./TabBar.module.scss"
import { motion } from "framer-motion"

type Props = {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export default function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {tabs.map((t) => {
          const isActive = t === active
          return (
            <button
              key={t}
              className={styles.tab}
              onClick={() => onChange(t)}
              aria-current={isActive}
            >
              <span className={styles.icon}>{getEmoji(t)}</span>
              <span className={styles.label}>{t}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className={styles.pill}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getEmoji(tab: string) {
  switch (tab) {
    case "get":
      return "🎴"
    case "build":
      return "🛠️"
    case "collection":
      return "📚"
    case "profile":
      return "👤"
    default:
      return "❓"
  }
}


