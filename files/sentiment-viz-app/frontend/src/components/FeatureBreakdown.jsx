import { motion } from 'framer-motion'

export default function FeatureBreakdown({ categorical, debug, preprocessed }) {
  if (!categorical) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-5 space-y-5 sticky top-20"
    >
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-2">extracted features</div>
        <div className="text-[11px] text-ink-600 leading-relaxed">
          The 17-dimensional categorical vector M2/M3/M4 use, plus VADER & POS analysis.
        </div>
      </div>

      <VaderScore vader_compound={categorical.vader_compound} />

      <FeatureGrid categorical={categorical} debug={debug} />

      {debug?.emoji_detected?.length > 0 && <EmojiList emojis={debug.emoji_detected} />}

      {debug?.negation_words?.length > 0 && <NegationList words={debug.negation_words} />}

      <PosDistribution categorical={categorical} />
    </motion.div>
  )
}


function VaderScore({ vader_compound }) {
  const pct = (vader_compound + 1) / 2 * 100   // map [-1, 1] → [0, 100]
  const tone = vader_compound > 0.05 ? 'pos' : vader_compound < -0.05 ? 'neg' : 'neu'
  const colors = {
    pos: 'from-emerald-500 to-emerald-300',
    neu: 'from-amber-500 to-amber-300',
    neg: 'from-rose-500 to-rose-300',
  }[tone]

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-ink-400 font-mono">VADER compound</div>
        <div className={`font-mono text-sm ${
          tone === 'pos' ? 'text-emerald-300' : tone === 'neg' ? 'text-rose-300' : 'text-amber-300'
        }`}>{vader_compound > 0 ? '+' : ''}{vader_compound.toFixed(3)}</div>
      </div>
      <div className="relative h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        <div
          className={`absolute top-0 bottom-0 bg-gradient-to-r ${colors} transition-all duration-700`}
          style={vader_compound >= 0
            ? { left: '50%', width: `${pct - 50}%` }
            : { right: '50%', width: `${50 - pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink-600 font-mono mt-1">
        <span>−1.0</span><span>0</span><span>+1.0</span>
      </div>
    </div>
  )
}


function FeatureGrid({ categorical, debug }) {
  const items = [
    { label: 'tokens',       value: categorical.token_count,        hint: 'After preprocessing' },
    { label: 'exclamations', value: categorical.exclamation_count,  hint: '!' },
    { label: 'questions',    value: categorical.question_count,     hint: '?' },
    { label: 'emoji',        value: (categorical.emoji_pos_count || 0) + (categorical.emoji_neg_count || 0) },
    { label: 'negation',     value: categorical.negation_flag ? 'yes' : 'no' },
    { label: 'elongation',   value: categorical.elongation_count,   hint: 'sooo, loool' },
    { label: 'upper ratio',  value: (categorical.uppercase_char_ratio * 100).toFixed(1) + '%' },
    { label: 'rep. punct',   value: categorical.repeated_punct_count, hint: '!! ??' },
  ]

  return (
    <div>
      <div className="text-xs text-ink-400 font-mono mb-2">stats</div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.label} className="bg-white/[0.02] rounded-lg px-3 py-2">
            <div className="text-[10px] text-ink-500 uppercase tracking-wide">{it.label}</div>
            <div className="font-mono text-sm text-ink-100 mt-0.5">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


function EmojiList({ emojis }) {
  const colors = {
    positive: 'text-emerald-300 bg-emerald-500/10',
    neutral:  'text-amber-300   bg-amber-500/10',
    negative: 'text-rose-300    bg-rose-500/10',
  }
  return (
    <div>
      <div className="text-xs text-ink-400 font-mono mb-2">emoji detected</div>
      <div className="flex flex-wrap gap-1.5">
        {emojis.map((e, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${colors[e.sentiment]}`}>
            <span className="text-base leading-none">{e.emoji}</span>
            <span className="font-mono">{e.score > 0 ? '+' : ''}{e.score.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


function NegationList({ words }) {
  return (
    <div>
      <div className="text-xs text-ink-400 font-mono mb-2">negation markers</div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w, i) => (
          <span key={i} className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}


function PosDistribution({ categorical }) {
  const data = [
    { label: 'nouns', value: categorical.noun_ratio },
    { label: 'verbs', value: categorical.verb_ratio },
    { label: 'adj',   value: categorical.adj_ratio  },
    { label: 'adv',   value: categorical.adv_ratio  },
  ]
  return (
    <div>
      <div className="text-xs text-ink-400 font-mono mb-2">part-of-speech ratio</div>
      <div className="space-y-1.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-12 text-xs text-ink-500 font-mono">{d.label}</div>
            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-purple-400/60 transition-all duration-500" style={{ width: `${d.value * 100}%` }} />
            </div>
            <div className="w-10 text-right font-mono text-xs text-ink-400">{(d.value * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
