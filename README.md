# 🪑 DEEZ' EAZY-BREEZY BAR REVIEW BONANZA

> The Adequate, Unaccredited, Probably Illegal, but Arguably Ethical Bar Review — monobloc.com

California Bar Exam preparation with AI-powered explanations, advanced analytics, and a retrofuturist space pirate aesthetic. It's no frills. It's generic. But it's the baseline of what you need. And it's free.

## 🚀 Tech Stack

- **Frontend**: Nuxt 4 / Vue 3 SPA (`lunaire-spa/`)
- **Backend**: Flask API (`backend/`)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Hosting**: Vercel (frontend) + Render (backend + DB)

## ⚡ Features

- 🪑 Retrofuturist space pirate design
- 📚 1500+ MBE-style practice questions
- 🤖 AI-powered answer explanations (OpenAI)
- 📊 Performance analytics by subject/subtopic
- ✍️ Essay grading with model answers
- 🎯 Adaptive question selection

## Quick Start

### Prerequisites

- Node.js v20+
- Python 3.11+
- OpenAI API key (optional, for AI features)

### Development

```bash
# Frontend (Nuxt)
cd lunaire-spa
npm install
npm run dev
# → http://localhost:3000

# Backend (Flask) - in separate terminal
cd backend
pip install -r requirements.txt
python server.py
# → http://localhost:5001
```

### Database Setup

```bash
# Initialize SQLite database with questions
python scripts/initialize_db.py
```

### Environment Variables

Create `.env` in project root:

```env
OPENAI_API_KEY=sk-your-key-here
```

## 📁 Project Structure

```
barbarossa_law/
├── lunaire-spa/        # Nuxt 4 frontend
│   ├── app/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── pages/
│   │   └── stores/
│   └── nuxt.config.ts
├── backend/            # Flask API
│   ├── server.py
│   ├── ai_explanations.py
│   ├── essay_grader.py
│   └── requirements.txt
├── scripts/            # Database utilities
├── qa.csv              # Question bank
├── render.yaml         # Render deployment config
├── vercel.json         # Vercel deployment config
└── _deprecated/        # Legacy static site (staged for removal)
```

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

**Quick deploy:**

1. **Render**: Import repo → auto-detects `render.yaml` → deploys API + PostgreSQL
2. **Vercel**: Import repo → auto-detects `vercel.json` → builds Nuxt SPA

## License

ISC
