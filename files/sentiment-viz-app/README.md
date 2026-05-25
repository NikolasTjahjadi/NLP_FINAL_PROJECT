# 🐦 Sentiment Lab — Comparative Sentiment Analysis on SemEval 2017 Task 4A

**Course**: COMP6885001 – Natural Language Processing | Bina Nusantara University | Even 2025/2026  
**Authors**: Nikolas Tjahjadi · Nur Hady · Luis Alexandro Soetherio

---

## Overview

This project compares five generations of machine learning models for Twitter sentiment classification (positive / neutral / negative) on the SemEval-2017 Task 4A benchmark dataset. It includes a research notebook, a FastAPI backend, and a React frontend dashboard that lets you test all models side-by-side in real time.

| Model | Feature | Classifier(s) | Macro-F1 |
|-------|---------|--------------|----------|
| M1 | TF-IDF (lexical) | LR, LinearSVM, XGBoost | 0.578 – 0.594 |
| M2 | Categorical 17-dim | RF, XGBoost, LR | 0.537 – 0.556 |
| M3 | TF-IDF + Categorical (concat) | Logistic Regression | 0.590 |
| M4 | Stacking ensemble | Meta-LR / Meta-LGB | 0.620 – 0.625 |
| M5 | Contextual embeddings | BERTweet (pysentimiento) | **0.718** |

---

## Project Structure

```
NLP_FInal Project/
├── NLP_AOL_Final.ipynb          # Main research notebook (training + evaluation)
├── dataset/
│   ├── train/                   # SemEval 2013–2016 training files (.txt)
│   └── test/                    # SemEval 2017 test file
├── saved_models/                # Auto-generated after running notebook
│   ├── tfidf_vectorizer.pkl
│   ├── M1_LR.pkl / M1_SVM.pkl / M1_XGB.pkl
│   ├── M2_RF.pkl / M2_XGB.pkl / M2_LR.pkl
│   ├── M3.pkl
│   ├── M4_meta_LR.pkl / M4_meta_LGB.pkl
│   ├── M4_base_models_full.pkl
│   └── bertweet_finetuned/      # Saved BERTweet checkpoint
├── results/                     # Auto-generated after running notebook
│   ├── performance_summary.csv
│   ├── all_predictions.csv
│   └── figures/
└── files/
    └── sentiment-viz-app/
        ├── backend/             # FastAPI backend
        │   ├── main.py
        │   ├── venv/
        │   └── requirements.txt
        └── frontend/            # React + Vite frontend
            ├── src/
            │   ├── App.jsx
            │   ├── components/
            │   └── lib/
            ├── package.json
            └── vite.config.js
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- macOS (tested on Apple Silicon M-series)

---

## Setup

### 1. Clone / download the project

Make sure the full folder structure above is in place, including the `dataset/` folder with SemEval data files.

### 2. Create Python virtual environment

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project'
python3 -m venv nlp_env
source nlp_env/bin/activate
pip install ipykernel
python -m ipykernel install --user --name=nlp_env --display-name "NLP Env (Python)"
```

### 3. Install backend dependencies

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project/files/sentiment-viz-app/backend'
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn torch transformers spacy nltk vaderSentiment emoji \
            scikit-learn xgboost lightgbm numpy pandas scipy
python -m spacy download en_core_web_sm
```

### 4. Install frontend dependencies

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project/files/sentiment-viz-app/frontend'
npm install
```

---

## Running the Notebook

Open `NLP_AOL_Final.ipynb` in VS Code, select kernel **NLP Env (Python)**, then run cells in order:

```
Cell 1  → Install dependencies
Cell 2  → Paths & config
Cell 3  → Imports
Cell 4  → Load dataset
Cell 5  → Preprocessing
Cell 6  → TF-IDF vectorizer
Cell 7  → Subset definitions
Cell 8  → Utility functions
Cell 9  → M1 (Lexical models)
Cell 10 → M2 (Categorical models)
Cell 11 → M3 (Hybrid)
Cell 12 → M4 OOF stacking
Cell 13 → M4 meta-learner
Cell 14 → M4 full retrain
Cell 15 → M5 dataset prep
Cell 16 → M5 load BERTweet
Cell 17 → M5 evaluation
Cell 18 → Ablation study
Cell 19 → McNemar test
Cell 20 → Summary
Cell 21 → Save all results
```

> **Resume-safe**: every cell checks disk before training. If a model already exists in `saved_models/`, it loads from disk and skips training automatically.

---

## Running the Web App

### Terminal 1 — Backend

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project/files/sentiment-viz-app/backend'
source venv/bin/activate
python main.py
```

Wait for `✅ Models loaded.` before starting the frontend.

### Terminal 2 — Frontend

```bash
cd '/Users/luissoetherio/Documents/NLP_FInal Project/files/sentiment-viz-app/frontend'
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Model Details

### M1 — Lexical (TF-IDF)

- **Features**: unigram + bigram TF-IDF, max 50,000 features
- **Classifiers**: Logistic Regression (L2, C=1.0), LinearSVC (C=1.0), XGBoost
- **Tuning**: GridSearchCV 5-fold
- **Note**: XGBoost performs worst here (F1=0.499) because sparse TF-IDF vectors hurt gradient boosting leaf splits

### M2 — Categorical (17-dim handcrafted features)

- **Features**: VADER compound/pos/neg/neu scores, emoji count, uppercase ratio, token count, negation flag, question/exclamation marks, POS ratios (noun/verb/adj/adv), elongation count, repeated punctuation
- **Classifiers**: Random Forest (100 estimators), XGBoost, Logistic Regression

### M3 — Hybrid

- **Features**: horizontal concatenation of TF-IDF sparse matrix + categorical vector
- **Classifier**: Logistic Regression
- **Result**: F1=0.590, confirms TF-IDF and categorical features are complementary

### M4 — Stacking Ensemble

- **Base models** (retrained on full data): M1-SVM, M1-XGB, M2-RF, M2-XGB
- **Meta-features**: out-of-fold class probabilities from 5-fold CV
- **Meta-learners**: Logistic Regression (F1=0.620) and LightGBM (F1=0.625)

### M5 — BERTweet (pysentimiento)

- **Model**: `finiteautomata/bertweet-base-sentiment-analysis` (Perez et al., 2021)
- **Architecture**: BERTweet (RoBERTa-base trained on 850M tweets) fine-tuned on SemEval 2017 ~40k tweets by pysentimiento authors
- **Why not further fine-tuned**: Additional fine-tuning on the same data degraded performance from F1=0.718 to F1=0.706, consistent with catastrophic forgetting (Luo et al., 2023)
- **Result**: Macro-F1=0.718, best model overall

---

## Preprocessing Pipeline

All models share this pipeline before feature extraction:

1. **TweetTokenizer** (NLTK) — preserves @mentions and #hashtags, reduces character repetition
2. **Emoji → text** — converts 🔥 to `:fire:` via `emoji` library
3. **Slang normalization** — expands common Twitter abbreviations (lol, ngl, tbh, etc.)
4. **Elongation normalization** — `loooove` → `loove`
5. **Negation marking** — tokens within 4-word window after negation marker get `not_` prefix
6. **Lemmatization** (spaCy) — M1 and M3 only
7. **Feature extraction** — branches into TF-IDF (Path A) or 17-dim categorical (Path B)

---

## Key Results

| Model | Macro-F1 | Accuracy | F1-Neg | F1-Neu | F1-Pos |
|-------|----------|----------|--------|--------|--------|
| M1-LR | 0.578 | 0.588 | 0.566 | 0.619 | 0.550 |
| M1-SVM | 0.594 | 0.610 | 0.558 | 0.654 | 0.570 |
| M1-XGB | 0.499 | 0.574 | 0.304 | 0.678 | 0.515 |
| M2-RF | 0.556 | 0.579 | 0.492 | 0.645 | 0.530 |
| M2-XGB | 0.554 | 0.579 | 0.492 | 0.647 | 0.523 |
| M2-LR | 0.537 | 0.562 | 0.462 | 0.630 | 0.518 |
| M3 | 0.590 | 0.615 | 0.522 | 0.675 | 0.573 |
| M4-LR | 0.620 | 0.636 | 0.577 | 0.678 | 0.606 |
| M4-LGB | 0.625 | 0.638 | 0.596 | 0.674 | 0.606 |
| **M5** | **0.718** | **0.718** | **0.750** | **0.700** | **0.710** |

Evaluated on SemEval-2017 Task 4A test set (12,284 tweets). Metric: Macro-averaged F1.

---

## Known Issues & Notes

- **Import order matters**: `xgboost` and `torch` must be imported before `spacy` in `main.py` to avoid segmentation faults on Apple Silicon
- **M4 base models**: loaded via `joblib` (not pickle) to avoid OpenMP conflicts on macOS
- **BERTweet**: loaded directly from HuggingFace — requires internet connection on first run, then cached locally
- **MPS device**: backend auto-detects Apple MPS for GPU acceleration on M-series Macs

---

## References

- Rosenthal, S., Farra, N., & Nakov, P. (2017). SemEval-2017 Task 4: Sentiment Analysis in Twitter. *SemEval-2017*.
- Nguyen, D. Q., Vu, T., & Nguyen, A. T. (2020). BERTweet: A pre-trained language model for English Tweets. *EMNLP 2020*.
- Perez, J. M., Giudici, J. C., & Luque, F. (2021). pysentimiento: A Python Toolkit for Sentiment Analysis and SocialNLP tasks. *arXiv:2106.09462*.
- Hutto, C. J., & Gilbert, E. E. (2014). VADER: A Parsimonious Rule-Based Model for Sentiment Analysis of Social Media Text. *ICWSM 2014*.
- Luo, Y., et al. (2023). An Empirical Study of Catastrophic Forgetting in Large Language Models During Continual Fine-tuning. *arXiv:2308.08747*.
