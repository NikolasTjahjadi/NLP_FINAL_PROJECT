# 🧪 Sentiment Lab

Research dashboard for comparing 5 sentiment analysis models (M1-M5) trained on SemEval 2017 Task 4A.

**Stack:**
- **Backend:** FastAPI + scikit-learn + XGBoost + LightGBM + Transformers (loads your trained `.pkl` files directly)
- **Frontend:** React 18 + Vite + Tailwind + Framer Motion + Recharts

---

## 📁 Project Structure

```
sentiment-viz-app/
├── backend/
│   ├── main.py                 # FastAPI server + preprocessing + inference
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── lib/api.js          # API client
│   │   └── components/
│   │       ├── Composer.jsx
│   │       ├── ModeSwitch.jsx
│   │       ├── ComparisonView.jsx
│   │       ├── SingleView.jsx
│   │       └── FeatureBreakdown.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Setup di Mac (VS Code)

### Prerequisites

```bash
# Check Python version (3.11 or 3.12 ideal)
python3 --version

# Check Node version (18+)
node --version
```

Install via Homebrew kalau belum ada:
```bash
brew install python@3.11 node
```

---

### Step 1 — Setup Backend (FastAPI)

```bash
# Masuk ke folder backend
cd /Users/luissoetherio/Documents/NLP_FInal Project/sentiment-viz-app/backend

# Pakai venv yang udah ada (kalau ada nlp_env dari sebelumnya), atau buat baru
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Download NLTK data
python -c "import nltk; [nltk.download(p, quiet=True) for p in ['punkt','averaged_perceptron_tagger','wordnet','stopwords']]"
```

#### Edit path model di `backend/main.py`

Cari baris ini di `main.py`, ganti sesuai path Mac lo:
```python
MODEL_DIR = '/Users/luissoetherio/Documents/NLP_FInal Project/saved_models'
```

Path ini harus berisi:
- `tfidf_vectorizer.pkl`
- `M1_LR.pkl`, `M1_SVM.pkl`, `M1_XGB.pkl`
- `M2_RF.pkl`, `M2_XGB.pkl`, `M2_LR.pkl`
- `M3.pkl`
- `M4_meta_LR.pkl`, `M4_meta_LGB.pkl`
- `M4_base_models_full.pkl`
- `bertweet_finetuned/` (folder, optional)

#### Jalanin backend:
```bash
uvicorn main:app --reload --port 8000
```

Buka di browser `http://localhost:8000` untuk cek status. Lo bakal lihat:
```json
{ "status": "ok", "device": "mps", "available_models": ["tfidf", "M1_LR", ...] }
```

---

### Step 2 — Setup Frontend (React)

**Buka terminal baru** (biarkan backend tetap jalan):

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project/files/sentiment-viz-app/frontend'

# Install dependencies
npm install

# Run dev server
npm run dev
```

Buka `http://localhost:5173` di browser.

---

### Step 3 — Workflow di VS Code

1. Buka folder `sentiment-viz-app` di VS Code (`code .` dari terminal)
2. Install ekstensi yang direkomendasikan:
   - **Python** (Microsoft)
   - **ES7+ React/Redux/React-Native snippets**
   - **Tailwind CSS IntelliSense**
   - **Prettier - Code formatter**
3. Buka dua terminal (Ctrl+Shift+`):
   - Terminal 1: backend (`cd backend && source venv/bin/activate && uvicorn main:app --reload`)
   - Terminal 2: frontend (`cd frontend && npm run dev`)
4. Buka browser ke `http://localhost:5173`

---

## 🎯 Cara Pakai

### Mode 1 — Compare All
Input tweet, semua 10 model classical (M1-M4) + BERTweet (M5) jalan paralel. Lo lihat:
- **Consensus banner**: berapa model setuju, dominant label apa
- **Family groups**: predictions di-group per famili (Lexical / Categorical / Hybrid / Stacking / Transformer)
- **Probability bars**: visualisasi 3-class probability per model
- **Feature breakdown sidebar**: VADER score, emoji detected, negation markers, POS distribution, dll

### Mode 2 — Single Model
Pilih 1 model dari dropdown, focus pada satu prediksi dengan:
- **Probability chart** (horizontal bar)
- **Preprocessed input** (apa yang model classical sebenernya lihat)
- **Feature panel** sama kayak comparison mode

---

## 🐛 Troubleshooting

### "models = []" / backend offline

- Pastikan venv aktif: `source venv/bin/activate`
- Cek path `MODEL_DIR` di `main.py`
- Cek file `.pkl` ada semua di folder itu

### CORS error

Backend udah set `allow_origins=["*"]`. Kalau masih error, restart backend.

### "Module not found" di Python

```bash
pip install -r requirements.txt --force-reinstall
```

### Port udah dipake

```bash
# Backend
uvicorn main:app --reload --port 8001
# lalu update vite.config.js: target: 'http://localhost:8001'

# Frontend
npm run dev -- --port 5174
```

### BERTweet ga muncul

Folder `bertweet_finetuned/` harus ada di `MODEL_DIR`. Kalau lo masih fine-tuning, app tetep jalan dengan 9 model classical (tanpa M5).

---

## 📦 Deploy (Optional)

### Build frontend:
```bash
cd frontend
npm run build
# output di frontend/dist/
```

### Production backend:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## 🎓 Untuk Presentasi ke Dosen

Demo flow yang gw rekomendasikan:

1. **Mode comparison** dengan tweet positif jelas → "Look how all models agree"
2. **Mode comparison** dengan tweet sarkasme atau ambigu → "Watch them disagree"
3. **Mode single → M4** vs **mode single → M5** dengan tweet yang sama → bandingin confidence
4. **Feature panel** → tunjukin bahwa M4 dapat data lebih kaya (emoji, negation, VADER) sementara M5 cuma lihat raw text

Ini menonjolkan kontribusi novel lo (stacking ensemble) dengan cara visual yang gampang dipahami.
