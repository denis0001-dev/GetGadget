import React, { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import TabBar from "./components/TabBar/TabBar"
import GetPage from "./pages/Get"
import BuildPage from "./pages/Build"
import CollectionPage from "./pages/Collection"
import ProfilePage from "./pages/Profile"
import { requireTelegram, initializeTelegramWebApp, isTelegramReady, expandIfAvailable, applySafeAreaInsets } from "./lib/telegram"

const tabs = ["get", "build", "collection", "profile"]
type Tab = typeof tabs[number]

export default function App() {
  const [active, setActive] = useState<Tab>("get")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Ensure app only runs inside Telegram WebApp per requirement
    if (!requireTelegram()) {
      // Do not mount; render a fallback message in plain DOM
      const root = document.getElementById("root")
      if (root) {
        root.innerHTML = "<div style='padding:20px;font-family:Arial'>Please open this page from Telegram.</div>"
      }
      return
    }

    // Initialize Telegram WebApp and wait for it to be ready
    initializeTelegramWebApp().then(() => {
      if (!isTelegramReady()) {
        const root = document.getElementById("root")
        if (root) {
          root.innerHTML = "<div style='padding:20px;font-family:Arial'>Failed to initialize Telegram WebApp. Please refresh the page.</div>"
        }
        return
      }

      expandIfAvailable()
      applySafeAreaInsets()
      setMounted(true)
    })
  }, [])

  if (!mounted) return null

  return (
    <div className="app-root" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {active === "get" && (
            <motion.div key="get" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GetPage />
            </motion.div>
          )}
          {active === "build" && (
            <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BuildPage />
            </motion.div>
          )}
          {active === "collection" && (
            <motion.div key="collection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CollectionPage />
            </motion.div>
          )}
          {active === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfilePage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TabBar tabs={tabs} active={active} onChange={(t) => setActive(t as Tab)} />
    </div>
  )
}


