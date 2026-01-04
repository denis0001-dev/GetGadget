import React, { useEffect, useRef, useState } from "react"
import styles from "./Wheel.module.scss"
import { motion, useAnimation } from "framer-motion"
import { fetchCatalog, postGetCard } from "../../api/client"
import { vibrate } from "../../lib/telegram"

type Item = { name: string; rarity: string }

const RARITY_COLORS: Record<string, string> = {
  Trash: "#6b7280",
  Common: "#9ca3af",
  Uncommon: "#10b981",
  Rare: "#3b82f6",
  Epic: "#8b5cf6",
  Legendary: "#f59e0b",
  Mythic: "#ef4444"
}

export default function Wheel(): JSX.Element {
  const [items, setItems] = useState<Item[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const controls = useAnimation()

  useEffect(() => {
    let mounted = true
    fetchCatalog()
      .then((cards) => {
        if (!mounted) return
        // Use only names for the wheel content
        const sampled = cards.slice(0, 12).map((c) => ({ name: c.name, rarity: c.rarity }))
        setItems(sampled)
      })
      .catch(() => {
        // fallback to a few placeholders
        setItems([
          { name: "Placeholder A", rarity: "Common" },
          { name: "Placeholder B", rarity: "Rare" },
          { name: "Placeholder C", rarity: "Epic" }
        ])
      })
    return () => {
      mounted = false
    }
  }, [])

  async function handleGet() {
    if (isSpinning || items.length === 0 || !listRef.current || !viewportRef.current) return
    setIsSpinning(true)

    try {
      // Request server to choose card for this authenticated user
      const result = await postGetCard()

      // Find index matching the returned name (fallback to random)
      const idx = items.findIndex((it) => it.name === result.name)
      const targetIndex = idx >= 0 ? idx : Math.floor(Math.random() * items.length)

      // Prepare a repeated list long enough to spin multiple cycles
      const cycles = 6
      const totalItems = cycles * items.length + targetIndex + items.length // buffer

      // Measure item height precisely (including margins)
      const firstItem = listRef.current.querySelector(`.${styles.item}`) as HTMLElement | null
      if (!firstItem) {
        throw new Error("Unable to measure wheel items")
      }
      const computed = window.getComputedStyle(firstItem)
      const marginTop = parseFloat(computed.marginTop || "0")
      const marginBottom = parseFloat(computed.marginBottom || "0")
      const itemHeight = firstItem.getBoundingClientRect().height + marginTop + marginBottom

      // Compute the target item's absolute top offset within the repeated list
      const targetTop = (cycles * items.length + targetIndex) * itemHeight

      // Viewport center
      const viewportRect = viewportRef.current.getBoundingClientRect()
      const centerY = viewportRect.height / 2

      // Compute translateY so that target item's center aligns with viewport center
      const finalTranslateY = centerY - (targetTop + itemHeight / 2)

      // total steps passed (number of item edges passed)
      const totalSteps = cycles * items.length + targetIndex

      // Duration (ms) total for spin
      const durationMs = 4200

      // Tick each time we pass an item: interval = duration / totalSteps
      const tickInterval = Math.max(8, Math.floor(durationMs / Math.max(1, totalSteps)))
      const tickTimer = setInterval(() => {
        vibrate()
      }, tickInterval)

      // Split animation into three phases: accel -> steady -> decel
      const accelRatio = 0.12
      const steadyRatio = 0.72
      const decelRatio = 1 - accelRatio - steadyRatio // ~0.16

      const accelDuration = (durationMs * accelRatio) / 1000
      const steadyDuration = (durationMs * steadyRatio) / 1000
      const decelDuration = (durationMs * decelRatio) / 1000

      const firstPhaseTranslate = finalTranslateY * accelRatio
      const secondPhaseTranslate = finalTranslateY * (accelRatio + steadyRatio)

      // Phase 1: quick accelerate (easeOut)
      await controls.start({
        y: firstPhaseTranslate,
        transition: { duration: accelDuration, ease: [0.22, 1, 0.36, 1] }
      })

      // Phase 2: steady fast movement (linear-ish)
      await controls.start({
        y: secondPhaseTranslate,
        transition: { duration: steadyDuration, ease: "linear" }
      })

      // Phase 3: decelerate to exact final position (easeOut)
      await controls.start({
        y: finalTranslateY,
        transition: { duration: decelDuration, ease: [0.22, 1, 0.36, 1] }
      })

      clearInterval(tickTimer)
      vibrate()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <div className={styles.wheelRoot}>
      <div className={styles.wheelViewport} ref={viewportRef}>
        <motion.div
          className={styles.list}
          ref={listRef}
          animate={controls}
          style={{ y: 0 }}
        >
          {/*
            Render a long repeated list deterministically so measurements are exact.
            We render cycles*items.length + a buffer to allow the animation to land precisely.
          */}
          {Array.from({ length: Math.max(1, items.length * cycles + items.length) }).map((_, i) => {
            const it = items[i % items.length] ?? { name: `...`, rarity: "Common" }
            return (
              <div
                key={i}
                className={styles.item}
                style={{ background: RARITY_COLORS[it.rarity] ?? "#9ca3af" }}
              >
                {it.name}
              </div>
            )
          })}
        </motion.div>
      </div>
      <button className={styles.getButton} onClick={handleGet} disabled={isSpinning}>
        {isSpinning ? "Spinning..." : "Get 🎴"}
      </button>
    </div>
  )
}


