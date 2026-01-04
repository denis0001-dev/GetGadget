import React, { useEffect, useState } from "react"
import styles from "./ActionButton.module.scss"

interface ActionButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

export default function ActionButton({ onClick, disabled = false, children }: ActionButtonProps) {
  const [tabBarTop, setTabBarTop] = useState(window.innerHeight - 80)

  // Measure TabBar position dynamically
  useEffect(() => {
    const tabBar = document.querySelector('[class*="TabBar_container"]') as HTMLElement
    if (!tabBar) return

    const updatePosition = () => {
      const rect = tabBar.getBoundingClientRect()
      setTabBarTop(rect.top)
    }

    // Initial measurement
    updatePosition()

    // Set up ResizeObserver for size changes
    const resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(tabBar)

    // Also listen for scroll events to update position
    const handleScroll = () => updatePosition()
    window.addEventListener('scroll', handleScroll)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <button
      className={styles.button}
      style={{ top: `${tabBarTop - 100}px` }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
