import React, { useEffect, useState } from "react"
import styles from "./ActionButton.module.scss"

interface ActionButtonProps {
    onClick: () => void
    disabled?: boolean
    children: React.ReactNode
}

export default function ActionButton({ onClick, disabled = false, children }: ActionButtonProps) {
    const [tabBarHeight, setTabBarHeight] = useState(80)

    // Measure TabBar height dynamically
    useEffect(() => {
        const tabBar = document.querySelector('[class*="TabBar_container"]') as HTMLElement
        if (!tabBar) return

        const updateHeight = () => {
            setTabBarHeight(tabBar.offsetHeight)
        }

        // Initial measurement
        updateHeight()

        // Set up ResizeObserver for size changes
        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(tabBar)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    return (
        <button
            className={styles.button}
            style={{ bottom: `${tabBarHeight}px` }}
            onClick={onClick}
            disabled={disabled}>
        {children}
        </button>
    )
}
