import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

const MODELS = [
  { id: 'M1_LR',  family: 'Lexical', f1: 0.5784 },
  { id: 'M1_SVM', family: 'Lexical', f1: 0.5943 },
  { id: 'M1_XGB', family: 'Lexical', f1: 0.4987 },
  { id: 'M2_RF',  family: 'Categorical', f1: 0.5558 },
  { id: 'M2_XGB', family: 'Categorical', f1: 0.5539 },
  { id: 'M2_LR',  family: 'Categorical', f1: 0.5367 },
  { id: 'M3',     family: 'Hybrid', f1: 0.5898 },
  { id: 'M4_LR',  family: 'Stacking', f1: 0.6203 },
  { id: 'M4_LGB', family: 'Stacking', f1: 0.6250 },
  { id: 'M5',     family: 'Transformer', f1: 0.7244 },
]

const EXAMPLES = [
  "Just watched the new Marvel movie, absolutely loved it 🤩 best one yet!",
  "Tbh i thought it would be better… disappointing honestly 😒",
  "Meeting at 3pm, conference room B",
  "this isn't bad at all, surprisingly decent actually",
]

export default function Composer({ text, onTextChange, onSubmit, loading, mode, selectedModel, onModelChange }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }, [text])

  function onKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <motion.div
        layout
        className="glass-strong rounded-3xl p-5 shadow-2xl"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a tweet to analyze..."
          rows={2}
          className="w-full bg-transparent text-lg text-ink-50 placeholder:text-ink-500 outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {mode === 'single' && (
              <ModelPicker selected={selectedModel} onChange={onModelChange} />
            )}
            <div className="text-xs text-ink-500 hidden sm:block font-mono">
              ⌘ + Enter to send
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={loading || !text.trim()}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> analyzing</>
              : <>Analyze <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>}
          </button>
        </div>
      </motion.div>

      {!text && !loading && (
        <div className="flex flex-wrap gap-2 px-1">
          <span className="text-xs text-ink-500 self-center mr-1">try:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => onTextChange(ex)}
              className="text-xs px-3 py-1.5 rounded-full glass hover:bg-white/[0.06] text-ink-400 hover:text-ink-100 transition-colors truncate max-w-[280px]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function ModelPicker({ selected, onChange }) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/[0.06] text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors text-ink-100 max-w-[200px]"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id} className="bg-ink-900">
          {m.id} · F1 {m.f1.toFixed(3)}
        </option>
      ))}
    </select>
  )
}
