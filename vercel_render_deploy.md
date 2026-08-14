# Vercel & Render Deployment Guide

Follow these simple steps to deploy your **AI Document Assistant** to **Vercel** (Frontend) and **Render** (Backend & RAG Service).

---

## ⚡ Step 1: Deploy Backend & RAG Service on Render

Render will read the [`render.yaml`](file:///c:/projects/ai-doc-assistant/render.yaml) blueprint file and automatically spin up both the **Express Backend** and **FastAPI RAG Service**.

1. Push your latest code to your **GitHub repository**:
   ```bash
   git add .
   git commit -m "Add Vercel and Render deployment configurations"
   git push origin main
   ```

2. Go to your [Render Dashboard](https://dashboard.render.com/).

3. Click **New +** -> Select **Blueprint**.

4. Connect your GitHub repository. Render will automatically detect `render.yaml`.

5. Render will ask you for Environment Variable values. Copy & paste these exact values:

   #### For `ai-doc-rag-service`:
   - `GROQ_API_KEY`: `<your_groq_api_key_from_groq_console>`
   - `TAVILY_API_KEY`: `<your_tavily_api_key_from_tavily_dashboard>`

   #### For `ai-doc-backend`:
   - `DATABASE_URL`: `<your_neon_postgresql_database_url>`
   - `BREVO_API_KEY`: `<your_brevo_api_key>` *(Recommended: Brevo API uses HTTPS port 443, bypassing Render SMTP port blocking)*
   - `SENDER_EMAIL`: `<your_verified_brevo_sender_email>`
   - `GOOGLE_CLIENT_ID`: `<your_google_client_id>`
   - `GOOGLE_CLIENT_SECRET`: `<your_google_client_secret>`
   - `SMTP_USER`: `<your_smtp_email>` *(Optional fallback)*
   - `SMTP_PASS`: `<your_smtp_password>` *(Optional fallback)*


6. Click **Apply**. Render will deploy both services!

7. Once deployment finishes, copy your two live Render URLs:
   - **Backend URL**: e.g., `https://ai-doc-backend-xxxx.onrender.com`
   - **RAG Service URL**: e.g., `https://ai-doc-rag-service-xxxx.onrender.com`

---

## 🚀 Step 2: Deploy Frontend on Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/new).

2. Click **Import** next to your GitHub repository.

3. In the project setup form:
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Framework Preset**: Next.js (automatically detected).

4. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL` ➔ `https://ai-doc-backend-xxxx.onrender.com` (Your Render Backend URL)
   - `NEXT_PUBLIC_RAG_URL` ➔ `https://ai-doc-rag-service-xxxx.onrender.com` (Your Render RAG Service URL)

5. Click **Deploy**!

---

## 🎉 Step 3: Update CORS / Callback URLs

After deployment finishes:
1. In Render -> `ai-doc-backend` Environment Variables, update `FRONTEND_URL` to your live Vercel URL (e.g. `https://ai-doc-assistant.vercel.app`).
2. Update `GOOGLE_CALLBACK_URL` in Render if using Google OAuth: `https://ai-doc-backend-xxxx.onrender.com/api/auth/google/callback`.
