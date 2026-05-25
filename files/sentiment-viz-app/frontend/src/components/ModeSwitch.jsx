import { motion } from 'framer-motion'
import { Layers, Target } from 'lucide-react'

export default function ModeSwitch({ mode, onChange }) {
  const modes = [
    { id: 'comparison', label: 'Compare all',      icon: Layers, desc: 'Run all five models side-by-side' },
    { id: 'single',     label: 'Single model',     icon: Target, desc: 'Pick one model and inspect details' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {modes.map((m) => {
        const Icon = m.icon
        const active = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`flex-1 group relative text-left rounded-2xl p-4 transition-all duration-300 ${
              active
                ? 'glass-strong shadow-[0_8px_32px_rgba(168,85,247,0.12)]'
                : 'glass hover:bg-white/[0.04]'
            }`}
          >
            {active && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 rounded-2xl border border-purple-400/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                active ? 'bg-purple-500/15 text-purple-300' : 'bg-white/[0.04] text-ink-400'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{m.label}</div>
                <div className="text-xs text-ink-500 mt-0.5">{m.desc}</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
