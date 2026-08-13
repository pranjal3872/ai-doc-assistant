# Production Deployment Guide - AI Document Assistant

This guide covers step-by-step instructions for deploying the **AI Document Assistant** application to production.

---

## 🏗 Architecture Overview

The system consists of three decoupled microservices:

```
[ User Browser ]
       │
       ▼
 ┌───────────┐         ┌───────────┐         ┌───────────────┐
 │ Next.js   │────────►│ Node.js   │────────►│ Python        │
 │ Frontend  │         │ Backend   │         │ RAG Service   │
 │ Port 3000 │         │ Port 5000 │         │ Port 8000     │
 └───────────┘         └─────┬─────┘         └───────┬───────┘
                             │                       │
                             ▼                       ▼
                       [ Neon Postgres ]       [ Qdrant DB ]
```

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS)
- **Backend API**: Node.js / Express with Prisma ORM & JWT Auth
- **RAG Service**: FastAPI (PyTorch, Sentence Transformers, Groq LLM, Tavily Web Search)

---

## Option 1: Deploying via Docker Compose (VPS / AWS EC2 / DigitalOcean)

The fastest and most robust way to run the full stack on any Virtual Private Server (VPS) with Docker installed.

### Prerequisites
- A Linux VPS (Ubuntu 22.04 LTS recommended)
- Docker & Docker Compose installed (`docker compose version >= 2.0`)

### Step-by-Step Instructions

1. **Clone the repository on your server**:
   ```bash
   git clone <your-repository-url> /opt/ai-doc-assistant
   cd /opt/ai-doc-assistant
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Required variables to update:*
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g. Neon, AWS RDS, Supabase)
   - `GROQ_API_KEY`: Your Groq Cloud API Key
   - `TAVILY_API_KEY`: Your Tavily Search API Key
   - `JWT_SECRET` & `SESSION_SECRET`: Random secure secret strings

3. **Build & Start Containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify Running Services**:
   ```bash
   docker compose ps
   ```
   Check logs if needed:
   ```bash
   docker compose logs -f
   ```

---

## Option 2: Deploying to Cloud Platforms (Vercel + Render + Neon DB)

If you prefer managed cloud infrastructure without maintaining servers:

### 1. Database (Neon PostgreSQL)
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy your connection string (`DATABASE_URL`).
3. Run migrations from local:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### 2. RAG Service (Render / Railway / Hugging Face Spaces)
1. Connect your repository to **Render** or **Railway**.
2. Select **Web Service** with Root Directory: `rag-service`.
3. Set environment variables:
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY`
4. Deploy command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### 3. Backend API (Render / Railway)
1. Connect repository to **Render** or **Railway**.
2. Select **Web Service** with Root Directory: `backend`.
3. Build command: `npm install && npx prisma generate`
4. Start command: `npm start`
5. Set environment variables:
   - `DATABASE_URL`
   - `RAG_SERVICE_URL` (URL of deployed RAG service from step 2)
   - `FRONTEND_URL` (URL of deployed Next.js app)
   - `JWT_SECRET`
   - `SESSION_SECRET`

### 4. Frontend (Vercel)
1. Import repository into **Vercel** with Root Directory: `frontend`.
2. Framework Preset: **Next.js**.
3. Set Build Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com`
   - `NEXT_PUBLIC_RAG_URL`: `https://your-rag-service.onrender.com`
4. Click **Deploy**.

---

## 🔒 Security & Checklist Before Launch

- [x] CORS domain origins specified for production domains
- [x] Environment variable fallback defaults replaced with production values
- [ ] Database credentials restricted to SSL connections (`sslmode=require`)
- [ ] JWT and Session Secrets set to minimum 32-character random strings
- [ ] Domain SSL (HTTPS) enabled on all public endpoints
