const API_BASE = 'https://kurtos123-Backend.hf.space'

export async function predictSentiment(text, model = 'all') {
  const res = await fetch(`${API_BASE}/predict`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text, model }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function listModels() {
  const res = await fetch(`${API_BASE}/models`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
