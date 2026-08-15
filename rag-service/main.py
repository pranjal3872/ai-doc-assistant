from fastapi import FastAPI, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from services.pdf_service import extract_text
from utils.chunker import chunk_text
from utils.privacy import redact_pii
from services.embedding_service import generate_embeddings

from services.llm_service import generate_answer, generate_summary_and_prompts
from database.qdrant import (
    create_collection,
    store_embeddings,
    search_similar_chunks,
    get_documents,
    delete_document,
)

from pydantic import BaseModel
from typing import Optional
import shutil
import os
import json

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

import os

frontend_url = os.getenv("FRONTEND_URL", "*")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]
if frontend_url and frontend_url != "*":
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if frontend_url == "*" else allowed_origins,
    allow_credentials=True if frontend_url != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


chat_history = []


class SearchRequest(BaseModel):
    query: str
    filename: Optional[str] = None
    user_id: Optional[str] = None

class CompareRequest(BaseModel):
    doc_a: str
    doc_b: str
    user_id: Optional[str] = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "AI Document Assistant API"
    }

@app.get("/documents")
async def documents(x_user_id: Optional[str] = Header(None)):
    user_id = x_user_id or "default_user"
    docs = get_documents(user_id=user_id)

    return {
        "documents": docs
    }

@app.delete("/documents/{filename}")
async def remove_document(filename: str, x_user_id: Optional[str] = Header(None)):
    user_id = x_user_id or "default_user"
    delete_document(filename, user_id=user_id)

    return {
        "message": f"{filename} deleted successfully for user {user_id}."
    }

@app.get("/documents/{filename}")
async def get_document_content(filename: str, x_user_id: Optional[str] = Header(None)):
    from database.qdrant import client, COLLECTION_NAME, Filter, FieldCondition, MatchValue

    user_id = x_user_id or "default_user"
    must_conditions = [
        FieldCondition(
            key="filename",
            match=MatchValue(value=filename)
        )
    ]
    if user_id:
        must_conditions.append(
            FieldCondition(
                key="user_id",
                match=MatchValue(value=user_id)
            )
        )

    response = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(must=must_conditions),
        limit=1000,
        with_payload=True,
        with_vectors=False
    )

    points = response[0]
    pages = {}
    for pt in points:
        pay = pt.payload
        p = pay.get("page", 1)
        text = pay.get("text", "")
        chunk_id = pay.get("chunk_id", 0)

        if p not in pages:
            pages[p] = []
        pages[p].append({"chunk_id": chunk_id, "text": text})

    sorted_pages = []
    for p_num in sorted(pages.keys()):
        chunks = sorted(pages[p_num], key=lambda x: x["chunk_id"])
        page_text = " ".join([c["text"] for c in chunks])
        sorted_pages.append({
            "page": p_num,
            "text": page_text,
            "chunks": [{"id": c["chunk_id"], "text": c["text"]} for c in chunks]
        })

    return {
        "filename": filename,
        "pages": sorted_pages
    }

@app.get("/documents/{filename}/summary")
async def get_document_summary(filename: str, x_user_id: Optional[str] = Header(None)):
    from database.qdrant import client, COLLECTION_NAME, Filter, FieldCondition, MatchValue

    user_id = x_user_id or "default_user"
    must_conditions = [
        FieldCondition(
            key="filename",
            match=MatchValue(value=filename)
        )
    ]
    if user_id:
        must_conditions.append(
            FieldCondition(
                key="user_id",
                match=MatchValue(value=user_id)
            )
        )

    response = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(must=must_conditions),
        limit=20,
        with_payload=True,
        with_vectors=False
    )

    points = response[0]
    sample_text = " ".join([pt.payload.get("text", "") for pt in points[:10]])
    summary_data = generate_summary_and_prompts(sample_text, filename=filename)

    return {
        "filename": filename,
        "summary": summary_data["summary"],
        "prompts": summary_data["prompts"]
    }

@app.on_event("startup")
async def startup():
    create_collection()


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), x_user_id: Optional[str] = Header(None)):
    user_id = x_user_id or "default_user"
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract page-wise text
    pages = extract_text(file_path)

    all_chunks = []
    all_metadata = []

    for page in pages:
        sanitized_text = redact_pii(page["text"])
        chunks = chunk_text(sanitized_text)


        for chunk in chunks:
            all_chunks.append(chunk)
            all_metadata.append(
                {
                    "page": page["page"]
                }
            )

    embeddings = generate_embeddings(all_chunks)

    store_embeddings(
        all_chunks,
        embeddings,
        file.filename,
        all_metadata,
        user_id=user_id,
    )

    return {
        "filename": file.filename,
        "pages": len(pages),
        "chunks": len(all_chunks),
        "first_chunk": all_chunks[0] if all_chunks else ""
    }


@app.post("/compare")
async def compare_documents(request: CompareRequest, x_user_id: Optional[str] = Header(None)):
    user_id = request.user_id or x_user_id or "default_user"
    from database.qdrant import client, COLLECTION_NAME, Filter, FieldCondition, MatchValue

    def get_sample(fn):
        res = client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(must=[
                FieldCondition(key="filename", match=MatchValue(value=fn)),
                FieldCondition(key="user_id", match=MatchValue(value=user_id))
            ]),
            limit=15,
            with_payload=True,
            with_vectors=False
        )
        pts = res[0]
        return " ".join([p.payload.get("text", "") for p in pts[:8]])

    sample_a = get_sample(request.doc_a)
    sample_b = get_sample(request.doc_b)

    from services.llm_service import client as groq_client
    if not groq_client:
        return {
            "doc_a": request.doc_a,
            "doc_b": request.doc_b,
            "comparison": f"**Side-by-Side Document Overview:**\n\n**{request.doc_a}:**\n- Extracted text sample length: {len(sample_a)} chars.\n\n**{request.doc_b}:**\n- Extracted text sample length: {len(sample_b)} chars.\n\n*Configure GROQ_API_KEY for dynamic comparative LLM analysis.*"
        }

    prompt = f"""Compare the following two documents side-by-side.

Document A ({request.doc_a}):
\"\"\"
{sample_a[:2500]}
\"\"\"

Document B ({request.doc_b}):
\"\"\"
{sample_b[:2500]}
\"\"\"

Produce a structured, comparative analysis:
**Core Objectives:**
- {request.doc_a}: ...
- {request.doc_b}: ...

**Key Differences & Unique Points:**
- {request.doc_a}: ...
- {request.doc_b}: ...

**Summary Synthesis:**
- ...
"""

    resp = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    return {
        "doc_a": request.doc_a,
        "doc_b": request.doc_b,
        "comparison": resp.choices[0].message.content
    }



@app.post("/search")
async def search(request: SearchRequest, x_user_id: Optional[str] = Header(None)):
    user_id = request.user_id or x_user_id or "default_user"
    clean_q = request.query.strip().lower()

    # Handle simple conversational greetings
    if clean_q in ["hi", "hello", "hlo", "hey", "hola", "good morning", "good evening", "how are you"]:
        doc_text = f" regarding **{request.filename}**" if request.filename else ""
        return {
            "query": request.query,
            "answer": f"Hello! How can I help you analyze your document{doc_text} today?"
        }

    try:
        # Check for web search request explicitly
        is_web_query = any(k in clean_q for k in ["search web", "google search", "latest news", "online search", "internet search"])

        if is_web_query:
            from agent.tools import web_search
            tavily_res = web_search.invoke({"query": request.query})
            return {
                "query": request.query,
                "answer": f"🌐 **Web Search Results (Tavily)**:\n\n{tavily_res}"
            }

        # Vector search in Qdrant DB
        query_emb = generate_embeddings([request.query])[0]
        target_fn = request.filename

        results = search_similar_chunks(query_emb, filename=target_fn, limit=6, user_id=user_id)
        if not results and target_fn:
            results = search_similar_chunks(query_emb, filename=None, limit=6, user_id=user_id)

        if results:
            context_blocks = []
            for item in results:
                context_blocks.append(
                    f"Source: [{item['filename']} • Page {item['page']}]\nText: {item['text']}"
                )
            context_str = "\n\n".join(context_blocks)

            # Generate dynamic customized answer using Groq LLM
            raw_answer = generate_answer(request.query, context_str)
            
            # Append citation pill if missing
            primary_doc = results[0]["filename"]
            primary_page = results[0]["page"]
            if f"[{primary_doc}" not in raw_answer:
                answer = f"{raw_answer}\n\n[{primary_doc} • Page {primary_page}]"
            else:
                answer = raw_answer
        else:
            from agent.tools import web_search
            tavily_res = web_search.invoke({"query": request.query})
            answer = f"No document matches found. 🌐 **Web Search Results (Tavily)**:\n\n{tavily_res}"

    except Exception as e:
        print(f"Search endpoint error: {e}")
        answer = f"Could not process query for '{request.query}'. Please check your document upload."

    return {
        "query": request.query,
        "answer": answer,
    }