import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import FeatureBreakdown from './FeatureBreakdown'

const MODEL_INFO = {
  M1_LR:  { name: 'M1 Logistic Regression', desc: 'Linear classifier on TF-IDF n-grams (1-3)', f1: 0.5784 },
  M1_SVM: { name: 'M1 Linear SVM',          desc: 'Linear support vector machine on sparse TF-IDF',  f1: 0.5943 },
  M1_XGB: { name: 'M1 XGBoost',             desc: 'Gradient-boosted trees on TF-IDF',                f1: 0.4987 },
  M2_RF:  { name: 'M2 Random Forest',       desc: 'Random forest on 17 handcrafted features',        f1: 0.5558 },
  M2_XGB: { name: 'M2 XGBoost',             desc: 'XGBoost on 17 handcrafted features',              f1: 0.5539 },
  M2_LR:  { name: 'M2 Logistic Regression', desc: 'Logistic regression on categorical features',     f1: 0.5367 },
  M3:     { name: 'M3 Static Hybrid',       desc: 'XGBoost on concatenated TF-IDF + 17 features',    f1: 0.5898 },
  M4_LR:  { name: 'M4 Stacking (LR meta)',  desc: '4 base models + Logistic Regression meta-learner', f1: 0.6203 },
  M4_LGB: { name: 'M4 Stacking (LGB meta)', desc: '4 base models + LightGBM meta-learner',           f1: 0.6250 },
  M5:     { name: 'M5 BERTweet',            desc: 'Fine-tuned transformer on 850M tweets',           f1: 0.7244 },
}


export default function SingleView({ result, modelId }) {
  const { predictions, categorical, debug, preprocessed } = result
  // Find the matching prediction
  const pred = predictions.find(p =>
    p.model.toLowerCase() === modelId.toLowerCase() ||
    (modelId.toLowerCase() === 'm4' && (p.model === 'M4_LR' || p.model === 'M4_LGB'))
  ) || predictions[0]

  if (!pred) return null

  const info = MODEL_INFO[pred.model] || { name: pred.model, desc: '' }

  const chartData = [
    { label: 'negative', value: pred.probabilities.negative * 100, color: '#FB7185' },
    { label: 'neutral',  value: pred.probabilities.neutral  * 100, color: '#FBBF24' },
    { label: 'positive', value: pred.probabilities.positive * 100, color: '#34D399' },
  ]

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <PredictionCard pred={pred} info={info} chartData={chartData} />
        <DetailsPanel pred={pred} preprocessed={preprocessed} />
      </div>
      <div>
        <FeatureBreakdown categorical={categorical} debug={debug} preprocessed={preprocessed} />
      </div>
    </div>
  )
}


function PredictionCard({ pred, info, chartData }) {
  const labelColors = {
    positive: { text: 'text-emerald-300', glow: 'shadow-emerald-500/20' },
    neutral:  { text: 'text-amber-300',   glow: 'shadow-amber-500/20'   },
    negative: { text: 'text-rose-300',    glow: 'shadow-rose-500/20'    },
  }
  const c = labelColors[pred.label] || labelColors.neutral

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-strong rounded-3xl p-6 md:p-8 shadow-2xl ${c.glow}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-1.5">{info.name}</div>
          <p className="text-sm text-ink-400 max-w-md">{info.desc}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-mono">test set F1</div>
          <div className="font-mono text-lg text-ink-100 mt-0.5">{info.f1.toFixed(4)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-4 mt-8 mb-6">
        <div className="font-display text-6xl italic">
          <span className={c.text}>{pred.label}</span>
        </div>
        <div className="text-ink-500 font-mono text-sm">
          confidence <span className="text-ink-200">{(pred.confidence * 100).toFixed(2)}%</span>
        </div>
      </div>

      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 8, bottom: 8 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A1A1AA', fontSize: 13, fontFamily: 'JetBrains Mono' }}
              width={80}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{
                background: 'rgba(24,24,27,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                fontSize: 12,
                fontFamily: 'JetBrains Mono'
              }}
              formatter={(v) => [`${v.toFixed(2)}%`, 'probability']}
            />
            <Bar dataKey="value" radius={[6, 6, 6, 6]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={d.label === pred.label ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}


function DetailsPanel({ pred, preprocessed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass rounded-2xl p-5"
    >
      <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-3">preprocessed input</div>
      <div className="font-mono text-sm text-ink-200 bg-white/[0.02] rounded-xl p-3 break-words border border-white/[0.04]">
        {preprocessed || <span className="text-ink-500 italic">(empty after preprocessing)</span>}
      </div>
      <div className="text-xs text-ink-500 mt-3 leading-relaxed">
        This is the cleaned, lemmatized, negation-prefixed token sequence the
        classical models actually see. M5 (BERTweet) uses the raw text.
      </div>
    </motion.div>
  )
}
