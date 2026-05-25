import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Github, BarChart3, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'
import Composer from './components/Composer'
import ComparisonView from './components/ComparisonView'
import SingleView from './components/SingleView'
import ModeSwitch from './components/ModeSwitch'
import { predictSentiment, checkHealth } from './lib/api'

export default function App() {
  const [mode, setMode] = useState('comparison')   // 'comparison' | 'single'
  const [selectedModel, setSelectedModel] = useState('M4_LGB')
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendStatus, setBackendStatus] = useState({ ok: null, models: [] })

  useEffect(() => {
    checkHealth()
      .then(d => setBackendStatus({ ok: true, models: d.available_models, device: d.device }))
      .catch(() => setBackendStatus({ ok: false, models: [] }))
  }, [])

  async function handleSubmit() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predictSentiment(text, mode === 'comparison' ? 'all' : selectedModel)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full">
      <Header backendStatus={backendStatus} />

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        <Hero />

        <div className="mt-12 mb-6">
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>

        <Composer
          text={text}
          onTextChange={setText}
          onSubmit={handleSubmit}
          loading={loading}
          mode={mode}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 glass rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium text-sm">Request failed</p>
                <p className="text-ink-400 text-sm mt-1">{error}</p>
                <p className="text-ink-500 text-xs mt-2">
                  Make sure backend is running: <span className="font-mono">uvicorn main:app --reload</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10"
            >
              {mode === 'comparison'
                ? <ComparisonView result={result} />
                : <SingleView result={result} modelId={selectedModel} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}


function Header({ backendStatus }) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl italic">Sentiment</span>
            <span className="font-medium text-sm">Lab</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BackendIndicator status={backendStatus} />
        </div>
      </div>
    </header>
  )
}


function BackendIndicator({ status }) {
  if (status.ok === null) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <div className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse" />
        connecting
      </div>
    )
  }
  if (!status.ok) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
        offline
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs text-ink-400">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      <span className="font-mono">{status.models?.length || 0} models · {status.device || 'cpu'}</span>
    </div>
  )
}


function Hero() {
  return (
    <div className="text-center pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 text-xs text-ink-400 font-mono mb-6 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
          <span className="w-1 h-1 rounded-full bg-purple-400" />
          SemEval 2017 Task 4A · 5 model comparison
        </div>

        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-balance">
          Compare how five models<br />
          <span className="italic text-purple-300">read the same tweet.</span>
        </h1>

        <p className="mt-6 text-ink-400 max-w-xl mx-auto leading-relaxed text-balance">
          A research dashboard for the comparative analysis of lexical, categorical,
          hybrid, and transformer-based sentiment models on Twitter sentiment data.
        </p>
      </motion.div>
    </div>
  )
}


function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8">
      <div className="max-w-6xl mx-auto px-6 text-center text-xs text-ink-500 font-mono">
        Built for COMP6885001 · Bina Nusantara University · Even 2025/2026
      </div>
    </footer>
  )
}
