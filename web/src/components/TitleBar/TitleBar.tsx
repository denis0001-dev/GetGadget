import React from "react"
import styles from "./TitleBar.module.scss"

interface TitleBarProps {
  children: React.ReactNode
}

export default function TitleBar({ children }: TitleBarProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{children}</h2>
    </div>
  )
}

