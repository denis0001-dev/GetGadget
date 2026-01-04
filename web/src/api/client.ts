import { getInitDataHeader } from "../lib/telegram"

const BASE = "https://api.getgadgets.toolbox-io.ru"

export async function fetchCatalog(): Promise<Array<{ name: string; rarity: string }>> {
  const headers = { ...getInitDataHeader() }
  const res = await fetch(`${BASE}/api/cards`, { headers })
  if (!res.ok) throw new Error("Failed to fetch catalog")
  const data = await res.json()
  return data.cards
}

export async function postGetCard(): Promise<{ id: number; name: string; rarity: string }> {
  const headers = { ...getInitDataHeader(), "Content-Type": "application/json" }
  const res = await fetch(`${BASE}/api/get-card`, { method: "POST", headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get card: ${res.status} ${text}`)
  }
  return await res.json()
}


