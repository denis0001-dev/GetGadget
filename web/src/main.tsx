import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./styles/global.module.scss"

function mount() {
  const root = document.getElementById("root")
  if (!root) return
  createRoot(root).render(<App />)
}

mount()


