#!/bin/bash
# Quick setup script — jalanin sekali aja
# Pastikan udah di folder sentiment-viz-app

set -e

echo "🐍 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python -m spacy download en_core_web_sm -q
python -c "import nltk; [nltk.download(p, quiet=True) for p in ['punkt','averaged_perceptron_tagger','wordnet','stopwords']]"
deactivate

echo "📦 Setting up frontend..."
cd ../frontend
npm install --silent

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run backend:"
echo "  cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "Run frontend (separate terminal):"
echo "  cd frontend && npm run dev"
