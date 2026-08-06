# 🔍 TruthLens AI

> Investigate claims. Verify facts. Understand the evidence.

TruthLens AI is a full-stack fact investigation platform that goes beyond simple search by verifying factual claims using live web research, official-source detection, explainable confidence scoring, and source-independence analysis. It works on any claim regardless of domain — health, agriculture, tech, politics, finance, sports, and more.

**Live**: [avantika-truthlens-ai.vercel.app](https://avantika-truthlens-ai.vercel.app)

<img width="2152" height="1592" alt="truthlens-plain-dashboard" src="https://github.com/user-attachments/assets/03db19b1-0fc5-4ee1-bd24-f0b80b385db7" />

---

## ✨ Features

- 🔎 Verify factual claims using live web research (You.com Research API)
- 📊 Explainable confidence scoring with itemized factors
- 🔗 Independent Confirmation Score - classifies cited sources as independent primary reporting vs. ones just citing another source, and scores how many independent sources actually back the verdict
- 🌳 Claim Tree showing supporting, conflicting, and official evidence
- 📰 Story evolution timeline
- ⚡ Eight verdict categories (see below) instead of a binary true/false
- 🎯 Exact-claim verification (subject/action/object/direction/date) to avoid confirming a similar-but-different event
- 👤 Accounts with JWT auth - investigating stays fully anonymous by default; logging in additionally saves a personal history
- 🔗 Every investigation gets a shareable, permanent link, regardless of login state
- ⏱ Auto-logout after 30 minutes of inactivity (persisted across refreshes)

---

## 🚀 Supported Verdicts

- ✅ Confirmed
- ✅ Likely True
- 🟡 Developing
- 🟡 Unclear
- 🟠 Misleading
- 🔴 Likely False
- 🔴 False
- ❌ Contradicted

---

## 🖥 Tech Stack

### Frontend

- React 19 + TypeScript
- Vite
- React Router (client-side routing for `/`, `/login`, `/signup`, `/history`, `/share/:id`)
- Plain CSS

### Backend

- FastAPI + Python
- SQLAlchemy 2.0 (async engine) + Alembic migrations
- PostgreSQL (hosted on [Neon](https://neon.tech))
- JWT auth (PyJWT + bcrypt)
- HTTPX (You.com Research API client)

### Infrastructure

- Frontend deployed on **Vercel**
- Backend deployed on **Render**
- Database on **Neon** (serverless Postgres)

---

## ⚙️ Installation

### 1. Clone

```bash
git clone https://github.com/Avantiikaa16/truthlens-ai.git
cd truthlens-ai
```

---

### 2. Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (see `backend/.env.example`):

```env
YDC_API_KEY=your_you_dot_com_api_key

# Postgres connection strings from your Neon project's Connection Details panel
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Any long random string, used to sign JWTs
JWT_SECRET=change_me_to_a_long_random_string
```

Run the database migration once:

```bash
alembic upgrade head
```

Run the API:

```bash
uvicorn app.main:app --reload --loop none
```

> `--loop none` is required on Windows: uvicorn's default loop is `ProactorEventLoop`, which the async Postgres driver (`psycopg`) can't run under. This flag lets asyncio fall back to the policy set in `app/main.py`, which forces `SelectorEventLoop` instead.

Backend runs on:

```
http://localhost:8000
```

---

### 3. Frontend

```bash
cd frontend

npm install

npm run dev
```

Optionally set `frontend/.env` (see `frontend/.env.example`) to point at a non-local backend:

```env
VITE_API_URL=http://localhost:8000
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🎯 Example Claims

### ✅ Confirmed

```
Google acquired Wiz
```

### ❌ Contradicted

```
Linux was developed by Microsoft
```

### 🔴 False

```
Apple will acquire Disney next month
```

### 🟠 Misleading

```
OpenAI is secretly building its own smartphone
```

### Across other domains

```
The FDA approved a new mRNA vaccine for RSV in adults over 60
The USDA declared a nationwide emergency over bird flu in egg-laying hens
The Federal Reserve cut interest rates by 50 basis points in September 2024
```

---

## 💡 How It Works

1. User submits a factual claim (optionally logged in).
2. Backend sends the claim to the You.com Research API with a prompt that requires exact-claim verification (not a similar or reversed event).
3. Live web research is performed, and evidence is categorized into supporting, conflicting, official, and timeline sections.
4. Cited sources are classified as independent primary reporting vs. ones that just cite another already-listed source.
5. TruthLens generates:
   - Verdict + summary
   - Explainable confidence score
   - Independent Confirmation Score
   - Claim Tree
   - Story evolution timeline
6. The result is persisted with a UUID and a permanent share link; if the user is logged in, it's also added to their history.

---

## 🌟 Future Improvements

- Automated test coverage (backend auth/persistence, frontend components)
- PDF / image evidence export for sharing
- Browser extension
- Multi-language support
- Keep-alive ping to avoid Render free-tier cold starts
- Real-time breaking news monitoring

---

## 👨‍💻 Team

Built by **Avantika Chapegadikar**

Originally for the **You.com Agentic AI Hackathon 2026**.
