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

// Exact animation parameters (NO approximations)
const ANIMATION_CYCLES = 6
const ACCEL_RATIO = 0.12
const STEADY_RATIO = 0.72
const DECEL_RATIO = 0.16 // 1 - ACCEL_RATIO - STEADY_RATIO

// Simply repeat the list 2 times for smooth animation

export default function Wheel() {
  const [items, setItems] = useState<Item[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const controls = useAnimation()

  // Reset wheel position if it gets too far from center
  const resetWheelIfNeeded = () => {
    if (!listRef.current || !viewportRef.current || isSpinning) return

    const listRect = listRef.current.getBoundingClientRect()
    const viewportRect = viewportRef.current.getBoundingClientRect()

    // If the wheel has scrolled too far, reset to a safe position
    const currentY = listRect.top - viewportRect.top
    const safeZone = items.length * 2 // Keep within 2 cycles of center

    if (Math.abs(currentY) > safeZone * 40) { // 40px per item approx
      controls.set({ y: 0 })
    }
  }

  useEffect(() => {
    let mounted = true
    console.log('Wheel: Starting to fetch catalog...')
    fetchCatalog()
      .then((cards) => {
        console.log('Wheel: Fetched cards:', cards)
        if (!mounted) return
        // Use only names for the wheel content
        const sampled = cards.map((c) => ({ name: c.name, rarity: c.rarity }))
        console.log('Wheel: Setting items:', sampled)
        setItems(sampled)
      })
      .catch((error) => {
        console.log('Wheel: Fetch failed, using placeholders:', error)
        if (!mounted) return
        // fallback to a few placeholders
        const placeholders = [
          { name: "Placeholder A", rarity: "Common" },
          { name: "Placeholder B", rarity: "Rare" },
          { name: "Placeholder C", rarity: "Epic" }
        ]
        console.log('Wheel: Setting placeholder items:', placeholders)
        setItems(placeholders)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function handleGet() {
    console.log('Wheel: handleGet called, items.length:', items.length, 'isSpinning:', isSpinning)
    if (isSpinning || items.length === 0 || !listRef.current || !viewportRef.current) {
      console.log('Wheel: Animation blocked - spinning:', isSpinning, 'no items:', items.length === 0, 'no refs:', !listRef.current || !viewportRef.current)
      return
    }
    setIsSpinning(true)

    // Debug viewport measurement
    if (viewportRef.current) {
      const viewportRect = viewportRef.current.getBoundingClientRect()
      console.log('Viewport measurement:', {
        width: viewportRect.width,
        height: viewportRect.height,
        top: viewportRect.top,
        left: viewportRect.left
      })
      const computedStyle = window.getComputedStyle(viewportRef.current)
      console.log('Viewport computed style:', {
        width: computedStyle.width,
        height: computedStyle.height,
        display: computedStyle.display,
        position: computedStyle.position
      })
    }

    try {
      // Request server to choose card for this authenticated user
      const result = await postGetCard()

      // Find index matching the returned name (fallback to random)
      const idx = items.findIndex((it) => it.name === result.name)
      const targetIndex = idx >= 0 ? idx : Math.floor(Math.random() * items.length)

      // Pick a random cycle (0 or 1 since we repeat the list twice)
      const randomCycle = Math.floor(Math.random() * 2)

      // Simply repeat the list twice
      const totalRenderedItems = items.length * 2

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
      const targetTop = (randomCycle * items.length + targetIndex) * itemHeight

      // Viewport center
      const viewportRect = viewportRef.current.getBoundingClientRect()
      const centerY = viewportRect.height / 2

      // The target item should be centered in the viewport
      // targetTop is the top position of the target item in the scrolled content
      // To center it, we need to scroll so that: viewport_center = item_center
      // Therefore: scroll_position = item_center - viewport_center
      // But since we're using transform: translateY, negative values scroll down
      const finalTranslateY = -(targetTop + itemHeight / 2 - centerY)

      // Calculate the absolute bounds for transform-based scrolling
      // translateY = 0: shows top of content
      // translateY = negative: scrolls content up (shows lower content)
      // translateY = positive: scrolls content down (shows higher content, if any)

      const totalContentHeight = totalRenderedItems * itemHeight
      const maxTranslateY = 0  // Can't scroll below top (positive translateY shows non-existent content above)
      const minTranslateY = Math.min(0, -(totalContentHeight - viewportRect.height))  // Can scroll up to show bottom, but not if content fits in viewport

      // Clamp the final position to absolute bounds
      const clampedFinalTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, finalTranslateY))

      // Debug bounds
      console.log('Bounds Debug:', {
        totalContentHeight: totalContentHeight / itemHeight,
        viewportHeight: viewportRect.height / itemHeight,
        maxTranslateY: maxTranslateY / itemHeight,
        minTranslateY: minTranslateY / itemHeight,
        finalTranslateY: finalTranslateY / itemHeight,
        clampedFinalTranslateY: clampedFinalTranslateY / itemHeight
      })

      // Calculate the actual displacement needed
      const actualDisplacement = clampedFinalTranslateY

      // Calculate maximum safe displacement in each direction
      const maxUpwardDisplacement = Math.abs(maxTranslateY) // How far we can scroll up
      const maxDownwardDisplacement = Math.abs(minTranslateY) // How far we can scroll down

      // Clamp the displacement to safe bounds
      const clampedDisplacement = Math.max(-maxDownwardDisplacement, Math.min(maxUpwardDisplacement, actualDisplacement))

      // Scale all animation phases proportionally to stay within safe bounds
      const accelPhase = clampedDisplacement * ACCEL_RATIO
      const steadyPhase = clampedDisplacement * (ACCEL_RATIO + STEADY_RATIO)
      const finalPhase = clampedDisplacement

      // Debug logging
      console.log('Wheel Debug:', {
        itemsLength: items.length,
        targetIndex,
        randomCycle,
        totalRenderedItems,
        targetTop: targetTop / itemHeight,
        finalTranslateY: finalTranslateY / itemHeight,
        clampedFinalTranslateY: clampedFinalTranslateY / itemHeight,
        maxTranslateY: maxTranslateY / itemHeight,
        minTranslateY: minTranslateY / itemHeight,
        actualDisplacement: actualDisplacement / itemHeight,
        clampedDisplacement: clampedDisplacement / itemHeight,
        accelPhase: accelPhase / itemHeight,
        steadyPhase: steadyPhase / itemHeight,
        finalPhase: finalPhase / itemHeight
      })

      // total steps passed (exact calculation: number of item edges passed)
      const totalSteps = randomCycle * items.length + targetIndex

      // Duration (ms) total for spin (exact value)
      const durationMs = 4200

      // Tick each time we pass an item: interval = duration / totalSteps (exact calculation)
      const tickInterval = Math.max(8, Math.floor(durationMs / Math.max(1, totalSteps)))
      const tickTimer = setInterval(() => {
        vibrate()
      }, tickInterval)

      // Split animation into three phases: accel -> steady -> decel (exact ratios)
      const accelRatio = ACCEL_RATIO
      const steadyRatio = STEADY_RATIO
      const decelRatio = DECEL_RATIO

      const accelDuration = (durationMs * accelRatio) / 1000
      const steadyDuration = (durationMs * steadyRatio) / 1000
      const decelDuration = (durationMs * decelRatio) / 1000

      // Phase 1: quick accelerate (easeOut) - proportionally scaled within safe bounds
      await controls.start({
        y: accelPhase,
        transition: { duration: accelDuration, ease: [0.22, 1, 0.36, 1] }
      })

      // Phase 2: steady fast movement (linear-ish) - proportionally scaled within safe bounds
      await controls.start({
        y: steadyPhase,
        transition: { duration: steadyDuration, ease: "linear" }
      })

      // Phase 3: decelerate to exact final position (easeOut) - within safe bounds
      await controls.start({
        y: finalPhase,
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

  // Ensure we have at least some items to display
  const displayItems = items.length > 0 ? items : [
    { name: "Loading...", rarity: "Common" },
    { name: "Please wait", rarity: "Common" },
    { name: "Items coming", rarity: "Common" }
  ]

  return (
    <div className={styles.wheelRoot}>
      <div className={styles.wheelViewport} ref={viewportRef}>
        <motion.div
          className={styles.list}
          ref={listRef}
          animate={controls}
          style={{ y: 0 }}
        >
          {/* Render the list repeated twice for smooth animation */}
          {Array.from({ length: displayItems.length * 2 }).map((_, i) => {
            const it = displayItems[i % displayItems.length] ?? { name: "...", rarity: "Common" }
            return (
              <div
                key={`item-${i}`}
                className={styles.item}
                style={{ background: RARITY_COLORS[it.rarity] ?? "#9ca3af" }}
              >
                {it.name}
              </div>
            )
          })}
        </motion.div>
      </div>
      <button className={styles.getButton} onClick={handleGet} disabled={isSpinning || displayItems.length === 0}>
        {isSpinning ? "Spinning..." : "Get 🎴"}
      </button>
    </div>
  )
}


