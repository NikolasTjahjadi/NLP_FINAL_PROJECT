"""
FastAPI Backend for SemEval 2017 Sentiment Analysis Comparison
Loads all trained models (M1-M5) from saved_models/ and exposes inference endpoints.
"""

import os
import re
import pickle
import copy
from collections import Counter
from typing import Optional
import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import spacy
from nltk.tokenize import TweetTokenizer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import emoji

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ─── Config ───────────────────────────────────────────────────────────────────
MODEL_DIR = '/Users/luissoetherio/Documents/NLP_FInal Project/saved_models'

LABEL_MAP     = {'negative': 0, 'neutral': 1, 'positive': 2}
LABEL_MAP_INV = {v: k for k, v in LABEL_MAP.items()}
LABEL_NAMES   = ['negative', 'neutral', 'positive']

# ─── Device detection ─────────────────────────────────────────────────────────
if torch.cuda.is_available():
    DEVICE = 'cuda'
elif torch.backends.mps.is_available():
    DEVICE = 'mps'
else:
    DEVICE = 'cpu'

# ─── NLP tools ────────────────────────────────────────────────────────────────
print('Loading NLP tools...', flush=True)
print('  spacy load...', flush=True)
nlp             = spacy.load('en_core_web_sm', disable=['ner', 'parser'])
print('  vader...', flush=True)
vader           = SentimentIntensityAnalyzer()
print('  tweet tokenizer...', flush=True)
tweet_tokenizer = TweetTokenizer(preserve_case=False, reduce_len=True, strip_handles=False)
print('NLP tools OK', flush=True)
# ─── Preprocessing (copy of training preprocessing) ──────────────────────────
SLANG_DICT = {
    'luv':'love','idk':"i don't know",'tbh':'to be honest','imo':'in my opinion',
    'omg':'oh my god','lol':'laugh out loud','lmao':'laughing my ass off',
    'smh':'shaking my head','ngl':"not gonna lie",'irl':'in real life',
    'brb':'be right back','btw':'by the way','fyi':'for your information',
    'thx':'thanks','thnx':'thanks','ty':'thank you','ur':'your','u':'you',
    'r':'are','gr8':'great','b4':'before','2day':'today','2nite':'tonight',
    'pls':'please','plz':'please','gonna':'going to','wanna':'want to',
    'gotta':'got to','kinda':'kind of','sorta':'sort of','cuz':'because',
    'cos':'because','w/':'with','w/o':'without','ugh':'ugh','meh':'meh',
    'yay':'yay','yep':'yes','nope':'no','dope':'great','lit':'great',
    'sucks':'is bad','sux':'is bad','fav':'favorite','fave':'favorite',
    'prolly':'probably','def':'definitely','obv':'obviously','tho':'though',
    'tbt':'throwback thursday','smth':'something','rn':'right now'
}

NEGATION_MARKERS = {
    'not','no','never','neither','nobody','nothing','nowhere','nor',
    "n't",'cannot','cant','dont',"don't",'didnt',"didn't",'isnt',
    "isn't",'wasnt',"wasn't",'arent',"aren't",'wouldnt',"wouldn't",
    'shouldnt',"shouldn't",'couldnt',"couldn't",'without','hardly',
    'scarcely','barely'
}

def _normalize_elongation(text):
    count = len(re.findall(r'(.)\1{2,}', text))
    return re.sub(r'(.)\1{2,}', r'\1\1', text), count

def _extract_emoji_sentiment(text):
    pos_c = neg_c = 0
    emoji_list = []
    for ch in text:
        if ch in emoji.EMOJI_DATA:
            desc  = emoji.demojize(ch).strip(':').replace('_', ' ')
            score = vader.polarity_scores(desc)['compound']
            if score > 0.05:
                pos_c += 1
                emoji_list.append({'emoji': ch, 'sentiment': 'positive', 'score': score})
            elif score < -0.05:
                neg_c += 1
                emoji_list.append({'emoji': ch, 'sentiment': 'negative', 'score': score})
            else:
                emoji_list.append({'emoji': ch, 'sentiment': 'neutral', 'score': score})
    return pos_c, neg_c, emoji_list


def preprocess_tweet(text):
    """Full preprocessing pipeline. Returns (clean_text, cat_dict, debug_info)."""
    raw_text = text
    emoji_pos, emoji_neg, emoji_list = _extract_emoji_sentiment(raw_text)
    excl_count       = raw_text.count('!')
    quest_count      = raw_text.count('?')
    uppercase_ratio  = sum(1 for c in raw_text if c.isupper()) / max(len(raw_text), 1)
    repeated_punct   = len(re.findall(r'[!?]{2,}', raw_text))

    text = text.lower()
    text = re.sub(r'http\S+|www\.\S+', ' ', text)
    text = re.sub(r'@\w+', ' ', text)
    text = re.sub(r'#(\w+)', r'\1', text)
    tokens = tweet_tokenizer.tokenize(text)
    tokens = [SLANG_DICT.get(t, t) for t in tokens]
    text_joined, elong_count = _normalize_elongation(' '.join(tokens))
    tokens = text_joined.split()

    vader_scores = vader.polarity_scores(' '.join(tokens))

    negation_flag = 0
    prefixed_tokens = []
    negate_next = False
    negation_words = []
    for tok in tokens:
        clean_tok = tok.strip("'.,:;")
        if clean_tok in NEGATION_MARKERS:
            negation_flag = 1
            negate_next   = True
            prefixed_tokens.append(tok)
            negation_words.append(tok)
        elif negate_next and re.match(r'[a-z]', clean_tok):
            prefixed_tokens.append('not_' + tok)
            negate_next = False
        else:
            if re.search(r'[.!?,;:]', tok): negate_next = False
            prefixed_tokens.append(tok)

    doc = nlp(' '.join(prefixed_tokens))
    lemmatized = [
        (t.text if t.text.startswith('not_') else t.lemma_)
        for t in doc if not t.is_punct and not t.is_space
    ]
    pos_counts = Counter(t.pos_ for t in doc)
    total = max(len(doc), 1)

    cat_features = {
        'vader_compound':       vader_scores['compound'],
        'vader_pos':            vader_scores['pos'],
        'vader_neg':            vader_scores['neg'],
        'vader_neu':            vader_scores['neu'],
        'emoji_pos_count':      emoji_pos,
        'emoji_neg_count':      emoji_neg,
        'noun_ratio':           pos_counts.get('NOUN', 0) / total,
        'verb_ratio':           pos_counts.get('VERB', 0) / total,
        'adj_ratio':            pos_counts.get('ADJ',  0) / total,
        'adv_ratio':            pos_counts.get('ADV',  0) / total,
        'exclamation_count':    excl_count,
        'question_count':       quest_count,
        'negation_flag':        negation_flag,
        'elongation_count':     elong_count,
        'token_count':          len(lemmatized),
        'uppercase_char_ratio': uppercase_ratio,
        'repeated_punct_count': repeated_punct,
    }

    debug = {
        'tokens_preprocessed': lemmatized,
        'negation_words':      negation_words,
        'emoji_detected':      emoji_list,
        'vader_compound':      vader_scores['compound'],
    }

    return ' '.join(lemmatized), cat_features, debug


# ─── Load models ──────────────────────────────────────────────────────────────
print('Loading models from disk...')

MODELS = {}
TFIDF  = None
M4_BASE_FULL = None
META_LR = None
META_LGB = None
BERTWEET = None
BERTWEET_TOKENIZER = None
BERTWEET_REMAP = None

def _load_pkl(name):
    path = os.path.join(MODEL_DIR, f'{name}.pkl')
    if not os.path.exists(path):
        print(f'  ⚠️  Missing: {name}.pkl')
        return None
    with open(path, 'rb') as f:
        return pickle.load(f)

try:
    print('  tfidf...', flush=True)
    TFIDF = _load_pkl('tfidf_vectorizer')
    print('  M1_LR...', flush=True)
    MODELS['M1_LR']  = _load_pkl('M1_LR')
    print('  M1_SVM...', flush=True)
    MODELS['M1_SVM'] = _load_pkl('M1_SVM')
    print('  M1_XGB...', flush=True)
    MODELS['M1_XGB'] = joblib.load(os.path.join(MODEL_DIR, 'M1_XGB_joblib.pkl'))
    print('  M2_RF...', flush=True)
    MODELS['M2_RF']  = _load_pkl('M2_RF')
    print('  M2_XGB...', flush=True)
    MODELS['M2_XGB'] = joblib.load(os.path.join(MODEL_DIR, 'M2_XGB_joblib.pkl'))
    print('  M2_LR...', flush=True)
    MODELS['M2_LR']  = _load_pkl('M2_LR')
    print('  M3...', flush=True)
    MODELS['M3']     = _load_pkl('M3')
    print('  M4_meta_LR...', flush=True)
    META_LR  = _load_pkl('M4_meta_LR')
    print('  M4_meta_LGB...', flush=True)
    META_LGB = _load_pkl('M4_meta_LGB')
    print('  M4_base_models_full...', flush=True)
    M4_BASE_FULL = joblib.load(os.path.join(MODEL_DIR, 'M4_base_models_full_joblib.pkl'))
    print('  checking bertweet path...', flush=True)
    bt_path = os.path.join(MODEL_DIR, 'bertweet_finetuned')
    if os.path.exists(os.path.join(bt_path, 'config.json')):
        print('  loading bertweet tokenizer...', flush=True)
        BERTWEET_TOKENIZER = AutoTokenizer.from_pretrained(bt_path, use_fast=True)
        print('  loading bertweet model...', flush=True)
        BERTWEET = AutoModelForSequenceClassification.from_pretrained(bt_path).to(DEVICE).eval()
        print('  bertweet remap...', flush=True)
        id2label = BERTWEET.config.id2label
        BERTWEET_REMAP = {}
        for cid, clbl in id2label.items():
            lbl = clbl.lower()
            if 'neg' in lbl:    BERTWEET_REMAP[cid] = LABEL_MAP['negative']
            elif 'neu' in lbl:  BERTWEET_REMAP[cid] = LABEL_MAP['neutral']
            else:               BERTWEET_REMAP[cid] = LABEL_MAP['positive']
        print(f'  BERTweet remap: {BERTWEET_REMAP}', flush=True)
    else:
        print('  ⚠️  BERTweet checkpoint not found', flush=True)

    print('✅ Models loaded.', flush=True)
except Exception as e:
    print(f'⚠️  Error loading models: {e}', flush=True)


# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="Sentiment Analysis Model Comparison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str
    model: Optional[str] = "all"  # all | M1_SVM | M2_RF | M3 | M4 | M5


class ModelPrediction(BaseModel):
    model: str
    label: str
    confidence: float
    probabilities: dict


@app.get("/")
def root():
    available = []
    if TFIDF: available.append("tfidf")
    for k, v in MODELS.items():
        if v is not None: available.append(k)
    if META_LR: available.append("M4_LR")
    if META_LGB: available.append("M4_LGB")
    if BERTWEET: available.append("M5")
    return {
        "status": "ok",
        "device": DEVICE,
        "available_models": available
    }


@app.get("/models")
def list_models():
    """Return metadata about all available models."""
    metadata = [
        {"id": "M1_LR",  "name": "M1 Logistic Regression",  "family": "Lexical",     "f1": 0.5784, "feature": "TF-IDF"},
        {"id": "M1_SVM", "name": "M1 Linear SVM",           "family": "Lexical",     "f1": 0.5943, "feature": "TF-IDF"},
        {"id": "M1_XGB", "name": "M1 XGBoost",              "family": "Lexical",     "f1": 0.4987, "feature": "TF-IDF"},
        {"id": "M2_RF",  "name": "M2 Random Forest",        "family": "Categorical", "f1": 0.5558, "feature": "17 features"},
        {"id": "M2_XGB", "name": "M2 XGBoost",              "family": "Categorical", "f1": 0.5539, "feature": "17 features"},
        {"id": "M2_LR",  "name": "M2 Logistic Regression",  "family": "Categorical", "f1": 0.5367, "feature": "17 features"},
        {"id": "M3",     "name": "M3 Static Hybrid",        "family": "Hybrid",      "f1": 0.5898, "feature": "TF-IDF + 17 features"},
        {"id": "M4_LR",  "name": "M4 Stacking (LR meta)",   "family": "Stacking",    "f1": 0.6203, "feature": "OOF stacking"},
        {"id": "M4_LGB", "name": "M4 Stacking (LGB meta)",  "family": "Stacking",    "f1": 0.6250, "feature": "OOF stacking"},
        {"id": "M5",     "name": "M5 BERTweet",             "family": "Transformer", "f1": 0.7244, "feature": "Contextual embeddings"},
    ]
    return {"models": metadata}


def _predict_classical(model_id, text_clean, cat_vec):
    """Predict with a classical model (returns probabilities)."""
    model = MODELS.get(model_id)
    if model is None:
        return None

    if model_id.startswith('M1'):
        X = TFIDF.transform([text_clean])
    elif model_id.startswith('M2'):
        X = cat_vec.reshape(1, -1)
    elif model_id == 'M3':
        X_lex = TFIDF.transform([text_clean])
        X = sp.hstack([X_lex, sp.csr_matrix(cat_vec.reshape(1, -1))])
    else:
        return None

    proba = model.predict_proba(X)[0]
    return proba


def _predict_m4(text_clean, cat_vec, meta='LGB'):
    """Predict using M4 stacking pipeline."""
    if M4_BASE_FULL is None:
        return None
    meta_clf = META_LGB if meta == 'LGB' else META_LR
    if meta_clf is None:
        return None

    X_lex = TFIDF.transform([text_clean])
    X_cat = cat_vec.reshape(1, -1)

    # Get probabilities from each base model (in same order as training)
    probs = []
    # base[0]: SVM on lex, base[1]: XGB on lex, base[2]: RF on cat, base[3]: XGB on cat
    probs.append(M4_BASE_FULL[0].predict_proba(X_lex)[0])
    probs.append(M4_BASE_FULL[1].predict_proba(X_lex)[0])
    probs.append(M4_BASE_FULL[2].predict_proba(X_cat)[0])
    probs.append(M4_BASE_FULL[3].predict_proba(X_cat)[0])

    meta_features = np.concatenate(probs).reshape(1, -1)
    proba = meta_clf.predict_proba(meta_features)[0]
    return proba


def _predict_bertweet(text):
    """Predict using BERTweet."""
    if BERTWEET is None:
        return None
    inputs = BERTWEET_TOKENIZER(
        text, truncation=True, padding='max_length',
        max_length=128, return_tensors='pt'
    ).to(DEVICE)
    with torch.no_grad():
        logits = BERTWEET(**inputs).logits[0].cpu().numpy()
    # softmax
    exp_logits = np.exp(logits - logits.max())
    probs = exp_logits / exp_logits.sum()

    # Remap to our label order
    remapped = np.zeros(3)
    for cid, our_id in BERTWEET_REMAP.items():
        remapped[our_id] = probs[cid]
    return remapped


def _format_prediction(model_name, proba):
    if proba is None:
        return None
    pred_idx = int(np.argmax(proba))
    return {
        'model':         model_name,
        'label':         LABEL_MAP_INV[pred_idx],
        'confidence':    float(proba[pred_idx]),
        'probabilities': {LABEL_NAMES[i]: float(proba[i]) for i in range(3)}
    }


@app.post("/predict")
def predict(req: PredictRequest):
    """Predict sentiment for a single text. Returns predictions from selected model(s)."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    # Preprocess once
    try:
        text_clean, cat_features, debug = preprocess_tweet(req.text)
        cat_vec = np.array(list(cat_features.values()), dtype=np.float32)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Preprocessing error: {e}')

    results = []
    target = req.model.lower()

    classical_models = ['M1_LR','M1_SVM','M1_XGB','M2_RF','M2_XGB','M2_LR','M3']

    if target == 'all' or target in [m.lower() for m in classical_models]:
        for m in classical_models:
            if target != 'all' and target != m.lower():
                continue
            proba = _predict_classical(m, text_clean, cat_vec)
            pred  = _format_prediction(m, proba)
            if pred: results.append(pred)

    if target == 'all' or target == 'm4' or target == 'm4_lr':
        proba = _predict_m4(text_clean, cat_vec, meta='LR')
        pred  = _format_prediction('M4_LR', proba)
        if pred: results.append(pred)

    if target == 'all' or target == 'm4' or target == 'm4_lgb':
        proba = _predict_m4(text_clean, cat_vec, meta='LGB')
        pred  = _format_prediction('M4_LGB', proba)
        if pred: results.append(pred)

    if target == 'all' or target == 'm5':
        proba = _predict_bertweet(req.text)
        pred  = _format_prediction('M5', proba)
        if pred: results.append(pred)

    return {
        'text':         req.text,
        'preprocessed': text_clean,
        'categorical':  cat_features,
        'debug':        debug,
        'predictions':  results,
    }
