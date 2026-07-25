# 🔍 TruthLens AI

> Investigate claims. Verify facts. Understand the evidence.

TruthLens AI is an AI-powered fact investigation platform that goes beyond simple search by verifying factual claims using live web research, official sources, explainable confidence scoring, and evidence visualization.

Built for the **You.com Agentic AI Hackathon 2026**.

---

## ✨ Features

- 🔎 Verify factual claims using live web research
- 📊 Explainable confidence scoring
- 🌳 Claim Tree showing supporting and conflicting evidence
- 🏛 Official source detection
- 📰 Story evolution timeline
- ⚡ Multiple verdict categories
- 🎯 Exact claim verification to reduce misinformation

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

- React
- TypeScript
- Vite
- CSS

### Backend

- FastAPI
- Python
- HTTPX

### AI

- You.com Research API

---

## 📂 Project Structure

```text
truthlens-ai/
│
├── backend/
│   ├── app/
│   ├── services/
│   ├── routes/
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── assets/
│   └── App.tsx
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone

```bash
git clone https://github.com/<username>/truthlens-ai.git
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

Create `.env`

```env
YDC_API_KEY=YOUR_YOU_API_KEY
```

Run

```bash
uvicorn app.main:app --reload
```

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

---

## 💡 How It Works

1. User submits a factual claim.
2. Backend sends the claim to the You.com Research API.
3. Live web research is performed.
4. Evidence is categorized into:
   - Supporting
   - Conflicting
   - Official
5. TruthLens generates:
   - Verdict
   - Summary
   - Timeline
   - Explainable Confidence
   - Claim Tree

---

## 🌟 Future Improvements

- Multi-language support
- PDF evidence export
- Browser extension
- Saved investigations
- Collaboration & sharing
- Real-time breaking news monitoring

---

## 👨‍💻 Team

Built by **Avantika Chapegadikar**

For the **You.com Agentic AI Hackathon 2026**.
