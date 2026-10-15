# 🤖 AI Document Assistant

[![GitHub Repository](https://img.shields.io/badge/GitHub-pranjal3872%2Fai--doc--assistant-blue?style=for-the-badge&logo=github)](https://github.com/pranjal3872/ai-doc-assistant)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Express.js](https://img.shields.io/badge/Express-5.2-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-red?style=for-the-badge&logo=qdrant)](https://qdrant.tech/)
[![Groq](https://img.shields.io/badge/Groq-LPU_Inference-f55036?style=for-the-badge)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

An enterprise-grade, privacy-conscious **Retrieval-Augmented Generation (RAG)** platform for interacting with and comparing documents in real-time. Built with a decoupled microservice architecture featuring **Next.js 16**, an **Express.js API Gateway**, and a **FastAPI RAG Engine** powered by **Qdrant Vector Database**, **Groq Cloud LPUs**, **Google Gemini**, **Ollama**, and **Tavily Web Search**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Option A: One-Command Run with Docker Compose](#option-a-one-command-run-with-docker-compose-recommended)
  - [Option B: Manual Local Development](#option-b-manual-local-development)
- [Database Setup & Migrations](#-database-setup--migrations)
- [API Reference](#-api-reference)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🌟 Overview

**AI Document Assistant** transforms unstructured documents into actionable intelligence. Users can upload single or multiple files—such as research papers, legal agreements, financial disclosures, or technical manuals—and instantly extract insights, query details, and compare documents side-by-side.

Every response is verified against ground-truth vector chunks with interactive citation pills linked directly to document page numbers. To protect user confidentiality, built-in **PII Redaction Guardrails** sanitize sensitive credentials before sending text to external LLMs.

---

## 🚀 Key Features

### 🔍 Advanced RAG & Ingestion
- **Multi-Format Document Parsing**: Ingest `.pdf`, `.docx`, `.txt`, and `.md` files seamlessly.
- **Smart Semantic Chunking**: Preserves structural context, headers, and paragraph boundaries.
- **Hosted & Persistent Vector Search**: Embeddings stored and queried via **Qdrant** with user-scoped collection isolation.
- **Real-Time Citations**: Responses feature clickable source pills `[Document • Page X]` deep-linked to exact passages.

### 🤖 Multi-Provider LLM Engine
- **Groq Cloud LPU Inference**: Ultra-fast responses leveraging `llama-3.1-8b-instant` and `mixtral-8x7b-32768`.
- **Google Gemini 1.5 Flash**: Dynamic fallback synthesis using Google AI Studio.
- **Local Ollama Integration**: Fully offline local inference support (`llama3.2`) via `OLLAMA_BASE_URL`.
- **Automated Tavily Web Search**: Intelligent fallback to real-time search when documents do not contain the answer.

### 🛡️ Privacy & Multi-Tenancy
- **Automated PII Redaction**: Strips emails, phone numbers, credit cards, and SSNs before reaching external LLM endpoints.
- **User Scoping & Gateway Security**: Microservices communicate through internal HMAC signing (`RAG_INTERNAL_KEY`) and strict user separation.
- **Complete Auth Suite**: Email + Password, OTP verification via Brevo/Nodemailer, and Google OAuth 2.0.

### 📊 Comparative Analysis & Productivity
- **Side-by-Side Comparison Matrix**: Compare two documents with automated extraction of shared objectives, variances, and synthesis.
- **Export Chat & Document Insights**: Download complete chat logs and extracted summaries in Markdown format.
- **Responsive Workspace UI**: Split-screen canvas with document reader, page controls, dark/light theme, and chunk inspector.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│       Next.js 16 (React 19, TypeScript, Tailwind CSS)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
               HTTP Requests   ▼   CORS & JWT Auth
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Gateway                       │
│    Node.js / Express 5 • Prisma ORM • Passport / Sessions   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               │ (Prisma Client)               │ (Internal Signed HMAC)
               ▼                               ▼
    ┌──────────────────────┐       ┌──────────────────────────┐
    │  PostgreSQL Database │       │    FastAPI RAG Engine    │
    │  (Neon / RDS / Local)│       │  PyTorch & Embeddings    │
    └──────────────────────┘       └─────────────┬────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                      ┌────────────────────┐          ┌────────────────────┐
                      │ Qdrant Vector DB   │          │  Groq / Gemini /   │
                      │  Dense Embeddings  │          │  Ollama & Tavily   │
                      └────────────────────┘          └────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Backend Gateway** | [Node.js](https://nodejs.org/), [Express.js 5](https://expressjs.com/), [Prisma ORM](https://www.prisma.io/), [Passport.js](https://www.passportjs.org/), [JWT](https://jwt.io/) |
| **RAG Microservice** | [Python 3.11+](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/), [PyPDF](https://pypdf.readthedocs.io/), [python-docx](https://python-docx.readthedocs.io/), [Sentence-Transformers](https://www.sbert.net/) |
| **Vector DB** | [Qdrant](https://qdrant.tech/) (Persistent vector search with payload filtering) |
| **Relational DB** | [PostgreSQL](https://www.postgresql.org/) (Serverless via [Neon](https://neon.tech/) or Docker) |
| **AI & Inference** | [Groq Cloud](https://groq.com/), [Google Gemini API](https://ai.google.dev/), [Ollama](https://ollama.ai/), [Tavily Search](https://tavily.com/) |
| **Containerization**| [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/) |
| **Deployment** | [Vercel](https://vercel.com/) (Frontend), [Render](https://render.com/) (Backend & RAG Engine Blueprint) |

---

## 📂 Project Structure

```bash
ai-doc-assistant/
├── backend/                  # Node.js / Express API Gateway
│   ├── prisma/               # Database schema & migration files
│   ├── src/
│   │   ├── config/           # Database & Passport OAuth setup
│   │   ├── controllers/      # Auth & user business logic
│   │   ├── middleware/       # JWT & session authentication
│   │   ├── routes/           # Auth, User, and RAG proxy routes
│   │   └── services/         # Token, OTP, and Email dispatch
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Next.js 16 Client Interface
│   ├── src/
│   │   ├── app/              # App Router (auth, workspace, callbacks)
│   │   ├── components/       # DocumentHub, Workspace, ChatInput, Header, Sidebar
│   │   ├── context/          # Auth context state provider
│   │   └── lib/              # Client API helpers
│   ├── Dockerfile
│   └── package.json
│
├── rag-service/              # Python FastAPI RAG Service
│   ├── agent/                # Tools, prompts, and ReAct agent
│   │   └── tools.py          # Tavily search integration
│   ├── database/             # Qdrant client & vector operations
│   ├── services/             # Embeddings, LLM inference, and document extraction
│   ├── utils/                # Text chunker and PII privacy redaction
│   ├── Dockerfile
│   ├── main.py               # FastAPI entry point & API endpoints
│   └── requirements.txt
│
├── docker-compose.yml        # Multi-container orchestration
├── render.yaml               # Render Cloud Blueprint
├── deployment.md             # Production deployment manual
├── vercel_render_deploy.md   # Step-by-step Vercel + Render guide
├── .env.example              # Sample environment configuration
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://www.docker.com/) (Recommended)
- Or for manual setup:
  - [Node.js](https://nodejs.org/) v18+ / v20+ & `npm`
  - [Python](https://www.python.org/) 3.11+
  - [PostgreSQL](https://www.postgresql.org/) database
  - API Keys for **Groq Cloud** and **Tavily Search** (optional: Gemini / Brevo)

---

### Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Populate the required environment variables:

```ini
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_doc_db?sslmode=prefer"

# AI Inference & Search
GROQ_API_KEY="gsk_your_groq_api_key_here"
TAVILY_API_KEY="tvly-your_tavily_api_key_here"
# Optional fallback models:
# GEMINI_API_KEY=""
# USE_OLLAMA="false"

# Service Routing & Security
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_RAG_URL="http://localhost:8000"
SESSION_SECRET="your-super-secret-session-key"
JWT_SECRET="your-super-secret-jwt-key"
RAG_INTERNAL_KEY="your-secure-internal-microservice-key"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# Optional: Email Service
BREVO_API_KEY=""
SENDER_EMAIL=""
```

---

### Option A: One-Command Run with Docker Compose (Recommended)

Build and boot all containers simultaneously:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **RAG Service & OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop services:
```bash
docker compose down
```

---

### Option B: Manual Local Development

#### 1. Start RAG Microservice (Python)
```bash
cd rag-service
python -m venv .venv

# Activate Virtualenv:
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Start Backend API Gateway (Node.js)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### 3. Start Frontend UI (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## 🗄 Database Setup & Migrations

The backend utilizes **Prisma ORM** for PostgreSQL data modeling.

```bash
cd backend

# Generate client bindings
npx prisma generate

# Apply migrations locally
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio web visualizer
npx prisma studio
```

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Sends email OTP for passwordless sign-in |
| `POST` | `/api/auth/verify-otp` | Validates OTP and issues session / JWT tokens |
| `POST` | `/api/auth/login` | Email and password authentication |
| `GET` | `/api/auth/google` | Initiates Google OAuth 2.0 flow |
| `GET` | `/api/auth/google/callback` | Google OAuth redirect callback |
| `POST` | `/api/auth/logout` | Revokes user session and invalidates cookies |

### 🤖 RAG Engine (`/api/rag`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rag/documents` | Lists all documents belonging to the authenticated user |
| `POST` | `/api/rag/upload` | Ingests `.pdf`, `.docx`, `.txt`, `.md`, runs chunking & vector indexing |
| `POST` | `/api/rag/search` | Performs vector search and returns synthesized answer with citation pills |
| `GET` | `/api/rag/documents/:filename` | Returns extracted pages, paragraphs, and chunks for document viewer |
| `DELETE`| `/api/rag/documents/:filename` | Deletes vector embeddings and stored records for the document |
| `POST` | `/api/rag/compare` | Produces side-by-side structured comparative synthesis of two documents |

---

## 🚀 Production Deployment

- 📖 **Vercel + Render + Neon Cloud**: Follow [vercel_render_deploy.md](file:///c:/projects/ai-doc-assistant/vercel_render_deploy.md)
- 🐳 **Self-Hosted VPS (Docker Compose)**: Follow [deployment.md](file:///c:/projects/ai-doc-assistant/deployment.md)
- ⚙️ **Render Blueprint Automation**: Uses [render.yaml](file:///c:/projects/ai-doc-assistant/render.yaml) for automatic web service provisioning.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
