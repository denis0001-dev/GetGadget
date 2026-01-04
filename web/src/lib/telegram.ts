/* Lightweight typed wrapper around the Telegram WebApp object.
   Prioritize Telegram WebApp haptic API and other helpers. */

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string
        initDataUnsafe?: any
        isExpanded?: boolean
        expand?: () => void
        getSafeAreaInsets?: () => { top?: number; bottom?: number; left?: number; right?: number }
        HapticFeedback?: {
          impactOccurred?: (style: "light" | "medium" | "heavy") => void
          notificationOccurred?: (type: "success" | "warning" | "error") => void
        }
      }
    }
  }
}

export function requireTelegram(): boolean {
  return Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)
}

export function getInitData(): string | null {
  return window.Telegram?.WebApp?.initData ?? null
}

export function getInitDataHeader(): Record<string, string> {
  const init = getInitData()
  return init ? { "X-Telegram-InitData": init } : {}
}

export function vibrate() {
  // Prefer Telegram haptics
  try {
    const h = window.Telegram?.WebApp?.HapticFeedback
    if (h && typeof h.impactOccurred === "function") {
      h.impactOccurred("light")
      return
    }
  } catch (e) {
    // ignore
  }

  // Fallback: navigator.vibrate if available (but per requirement, app shouldn't load outside Telegram)
  if (navigator && "vibrate" in navigator) {
    // small pulse
    ;(navigator as any).vibrate?.(10)
  }
}

export function expandIfAvailable() {
  try {
    if (window.Telegram?.WebApp?.expand) {
      window.Telegram.WebApp.expand()
    }
  } catch (e) {
    // ignore
  }
}

export function applySafeAreaInsets() {
  try {
    const insets = window.Telegram?.WebApp?.getSafeAreaInsets?.()
    if (!insets) return
    const root = document.documentElement
    if (insets.top != null) root.style.setProperty("--safe-top", `${insets.top}px`)
    if (insets.bottom != null) root.style.setProperty("--safe-bottom", `${insets.bottom}px`)
    if (insets.left != null) root.style.setProperty("--safe-left", `${insets.left}px`)
    if (insets.right != null) root.style.setProperty("--safe-right", `${insets.right}px`)
  } catch (e) {
    // ignore
  }
}


