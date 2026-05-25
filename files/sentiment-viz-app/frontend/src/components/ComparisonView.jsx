import { motion } from 'framer-motion'
import { TrendingUp, MinusCircle, TrendingDown } from 'lucide-react'
import FeatureBreakdown from './FeatureBreakdown'

const MODEL_META = {
  M1_LR:  { family: 'Lexical',     accent: 'sky',     f1: 0.5784 },
  M1_SVM: { family: 'Lexical',     accent: 'sky',     f1: 0.5943 },
  M1_XGB: { family: 'Lexical',     accent: 'sky',     f1: 0.4987 },
  M2_RF:  { family: 'Categorical', accent: 'amber',   f1: 0.5558 },
  M2_XGB: { family: 'Categorical', accent: 'amber',   f1: 0.5539 },
  M2_LR:  { family: 'Categorical', accent: 'amber',   f1: 0.5367 },
  M3:     { family: 'Hybrid',      accent: 'orange',  f1: 0.5898 },
  M4_LR:  { family: 'Stacking',    accent: 'fuchsia', f1: 0.6203 },
  M4_LGB: { family: 'Stacking',    accent: 'fuchsia', f1: 0.6250 },
  M5:     { family: 'Transformer', accent: 'emerald', f1: 0.7244 },
}

export default function ComparisonView({ result }) {
  const { predictions, categorical, debug, preprocessed } = result

  // Group predictions by family
  const grouped = predictions.reduce((acc, p) => {
    const meta = MODEL_META[p.model] || { family: 'Other', accent: 'gray' }
    if (!acc[meta.family]) acc[meta.family] = []
    acc[meta.family].push({ ...p, meta })
    return acc
  }, {})

  // Compute consensus
  const labelCounts = predictions.reduce((acc, p) => {
    acc[p.label] = (acc[p.label] || 0) + 1
    return acc
  }, {})
  const consensus = Object.entries(labelCounts).sort((a,b) => b[1] - a[1])[0]
  const totalAgreement = consensus ? consensus[1] / predictions.length : 0

  return (
    <div className="space-y-6">
      <ConsensusBar
        label={consensus?.[0]}
        agreement={totalAgreement}
        count={consensus?.[1]}
        total={predictions.length}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(grouped).map(([family, preds], i) => (
            <FamilyGroup key={family} family={family} preds={preds} delay={i * 0.05} />
          ))}
        </div>

        <div className="space-y-4">
          <FeatureBreakdown categorical={categorical} debug={debug} preprocessed={preprocessed} />
        </div>
      </div>
    </div>
  )
}


function ConsensusBar({ label, agreement, count, total }) {
  const palette = {
    positive: { bg: 'from-emerald-500/15 to-emerald-500/0', text: 'text-emerald-300', dot: 'bg-emerald-400', icon: TrendingUp },
    neutral:  { bg: 'from-amber-500/15  to-amber-500/0',    text: 'text-amber-300',   dot: 'bg-amber-400',   icon: MinusCircle },
    negative: { bg: 'from-rose-500/15   to-rose-500/0',     text: 'text-rose-300',    dot: 'bg-rose-400',    icon: TrendingDown },
  }
  const p = palette[label] || palette.neutral
  const Icon = p.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl glass-strong p-6`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${p.bg} pointer-events-none`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center ${p.text}`}>
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-ink-500 uppercase tracking-wider font-mono">consensus</span>
            <span className={`text-xs font-mono ${p.text}`}>{count}/{total} models</span>
          </div>
          <div className="font-display text-3xl italic mt-1">
            <span className={p.text}>{label}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500 uppercase tracking-wider font-mono">agreement</div>
          <div className="font-mono text-2xl text-ink-100 mt-1">{(agreement * 100).toFixed(0)}%</div>
        </div>
      </div>
    </motion.div>
  )
}


function FamilyGroup({ family, preds, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs uppercase tracking-wider text-ink-500 font-mono">{family}</span>
        <div className="flex-1 h-px bg-white/[0.04]" />
        <span className="text-xs text-ink-600 font-mono">{preds.length} model{preds.length > 1 ? 's' : ''}</span>
      </div>

      {preds.map((p, i) => (
        <ModelRow key={p.model} pred={p} delay={delay + i * 0.04} />
      ))}
    </motion.div>
  )
}


function ModelRow({ pred, delay }) {
  const { model, label, confidence, probabilities, meta } = pred

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass rounded-2xl p-4 hover:bg-white/[0.04] transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="font-mono text-sm text-ink-100">{model}</div>
          <div className="text-xs text-ink-500 mt-0.5">F1 {meta.f1.toFixed(3)}</div>
        </div>

        <div className="flex-1 min-w-0">
          <ProbabilityBars probs={probabilities} predicted={label} />
        </div>

        <div className="flex-shrink-0 text-right">
          <PredictionLabel label={label} />
          <div className="text-xs text-ink-500 font-mono mt-1">
            {(confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  )
}


function ProbabilityBars({ probs, predicted }) {
  const order = ['negative', 'neutral', 'positive']
  const colors = {
    negative: 'bg-rose-400',
    neutral:  'bg-amber-400',
    positive: 'bg-emerald-400',
  }

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
      {order.map((label) => {
        const w = (probs[label] || 0) * 100
        const isPred = predicted === label
        return (
          <div
            key={label}
            className={`${colors[label]} transition-all duration-700 ease-out ${isPred ? 'shadow-[0_0_8px_currentColor]' : 'opacity-60'}`}
            style={{ width: `${w}%` }}
            title={`${label}: ${w.toFixed(1)}%`}
          />
        )
      })}
    </div>
  )
}


function PredictionLabel({ label }) {
  const cls = {
    positive: 'text-emerald-300',
    neutral:  'text-amber-300',
    negative: 'text-rose-300',
  }[label] || 'text-ink-100'
  return <span className={`text-sm font-medium capitalize ${cls}`}>{label}</span>
}
