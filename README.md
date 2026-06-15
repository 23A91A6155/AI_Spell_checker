# 🤖 AI Grammar & Spell Checker

An AI-powered writing assistant that checks grammar, spelling, punctuation, sentence clarity, and readability using the **xAI Grok API**. Built with **Flask**, **Django**, and a premium vanilla **HTML/CSS/JavaScript** frontend.

![Powered by Grok AI](https://img.shields.io/badge/Powered%20by-Grok%20AI-7c3aed?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-3.1-green?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-5.1-blue?style=for-the-badge)

---

## ✨ Features

- **Grammar Correction** — Detects and fixes grammar errors (subject-verb agreement, tense, articles, etc.)
- **Spelling & Punctuation Checker** — Identifies misspelled words and punctuation mistakes
- **Sentence Clarity Improvement** — Rewrites sentences for better clarity while preserving meaning
- **Readability Analysis** — Flesch-Kincaid scoring with AI-powered improvement suggestions
- **Full Check** — Runs all four checks simultaneously
- **Inline Diff Highlighting** — Green/red word-level diff showing exactly what changed
- **Check History** — Browse past corrections via Django admin panel
- **Dark/Light Mode** — Premium UI with glassmorphism, animated gradients, and micro-animations
- **Keyboard Shortcut** — `Ctrl+Enter` for quick Full Check
- **Copy to Clipboard** — One-click copy of corrected text

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (HTML/CSS/JS)             │
│         Premium UI with glassmorphism design         │
└──────────────┬──────────────────────┬────────────────┘
               │ POST /api/*          │ GET /api/history
               ▼                      ▼
┌──────────────────────┐  ┌─────────────────────────┐
│  Flask API (:5000)   │  │  Django Admin (:8000)    │
│  • Grammar Check     │  │  • Check History         │
│  • Spell Check       │──│  • Admin Dashboard       │
│  • Clarity Improve   │  │  • Statistics API        │
│  • Readability       │  │  • SQLite Database       │
│  • Full Check        │  └─────────────────────────┘
└──────────┬───────────┘
           │ OpenAI-compatible API
           ▼
┌─────────────────────┐
│  xAI Grok API       │
│  api.x.ai/v1        │
└─────────────────────┘
```

---

## 📁 Project Structure

```
AI_Spell_checker/
├── .env                    # Environment variables (API keys)
├── .env.example            # Template for .env
├── .gitignore
├── README.md
├── requirements.txt
│
├── frontend/               # Static frontend
│   ├── index.html          # Main application page
│   ├── css/
│   │   └── style.css       # Premium design system
│   └── js/
│       └── app.js          # Application logic
│
├── flask_app/              # Flask API backend
│   ├── __init__.py
│   ├── app.py              # Flask routes & server
│   ├── config.py           # Environment config
│   └── services/
│       ├── __init__.py
│       ├── grok_client.py          # Grok API client
│       ├── grammar_checker.py      # Grammar correction module
│       ├── spell_checker.py        # Spelling & punctuation checker
│       ├── clarity_improver.py     # Sentence clarity improvement
│       └── readability_analyzer.py # Readability analysis
│
└── django_app/             # Django admin backend
    ├── manage.py
    ├── django_app/
    │   ├── __init__.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    └── checker/
        ├── __init__.py
        ├── admin.py
        ├── apps.py
        ├── models.py
        ├── views.py
        └── urls.py
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.10+
- xAI API Key from [console.x.ai](https://console.x.ai)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AI_Spell_checker.git
cd AI_Spell_checker
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your xAI API key
# XAI_API_KEY=your_actual_api_key_here
```

### 5. Setup Django Database

```bash
cd django_app
python manage.py migrate
python manage.py createsuperuser  # Optional: for admin panel access
cd ..
```

### 6. Run the Application

You need **three terminals** to run the full application:

**Terminal 1 — Flask API (Port 5000):**
```bash
cd AI_Spell_checker
python -m flask_app.app
```

**Terminal 2 — Django Backend (Port 8000):**
```bash
cd AI_Spell_checker/django_app
python manage.py runserver 8000
```

**Terminal 3 — Frontend (any static server):**
```bash
cd AI_Spell_checker/frontend
python -m http.server 3000
```

Then open **http://localhost:3000** in your browser.

---

## 🔑 API Endpoints

### Flask API (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/check-grammar` | Grammar correction |
| POST | `/api/check-spelling` | Spelling & punctuation check |
| POST | `/api/improve-clarity` | Sentence clarity improvement |
| POST | `/api/readability` | Readability analysis |
| POST | `/api/full-check` | Run all checks combined |

**Request Body:**
```json
{
    "text": "Your text to check goes here."
}
```

### Django API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/` | List check history |
| POST | `/api/history/` | Save check result |
| GET | `/api/history/<id>/` | Get specific check |
| DELETE | `/api/history/<id>/` | Delete specific check |
| GET | `/api/stats/` | Aggregate statistics |
| GET | `/admin/` | Django admin panel |

---

## 🧠 AI Models

The app uses the xAI Grok API (OpenAI-compatible). Available models:

| Model | Cost (Input/Output per 1M tokens) | Best For |
|-------|-----------------------------------|----------|
| `grok-3-mini-fast` | Cheapest | Development/testing |
| `grok-4.1-fast` | $0.20 / $0.50 | Production (cost-optimized) |
| `grok-4.3` | $1.25 / $2.50 | Highest quality |

Change the model in `.env`:
```
GROK_MODEL=grok-4.1-fast
```

---

## 🎨 UI Features

- **Dark Mode** (default) with light mode toggle
- **Glassmorphism** cards with backdrop blur effects
- **Animated gradient** hero background (purple → indigo → cyan)
- **Word-level diff highlighting** — green for additions, red strikethrough for removals
- **Micro-animations** on hover, focus, and stat updates
- **Responsive design** — works on mobile, tablet, and desktop
- **Keyboard shortcut** — `Ctrl+Enter` for Full Check

---

## 🧪 Testing

### Test Flask API:
```bash
curl -X POST http://localhost:5000/api/check-grammar \
  -H "Content-Type: application/json" \
  -d '{"text": "She dont goes to school yesterday."}'
```

### Test Django API:
```bash
curl http://localhost:8000/api/history/
curl http://localhost:8000/api/stats/
```

---

## 📚 Learning Outcomes

- AI-powered writing assistance systems
- Prompt engineering for NLP tasks
- Flask & Django development
- Language processing techniques
- Text correction and readability analysis
- AI API integration (xAI Grok)
- Real-world NLP implementation

---

## 📄 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- [xAI](https://x.ai) — Grok API for AI-powered text analysis
- [Flask](https://flask.palletsprojects.com/) — Lightweight Python web framework
- [Django](https://www.djangoproject.com/) — Full-featured Python web framework
- [Inter Font](https://fonts.google.com/specimen/Inter) — Typography
