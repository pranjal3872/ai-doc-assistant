import os
import json
import urllib.request
import urllib.parse
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"

client = None
if api_key and not use_ollama:
    client = Groq(
        api_key=api_key
    )

def _query_ollama(prompt: str, model: str = "llama3.2") -> str:
    """Helper to query local Ollama instance at localhost:11434"""
    try:
        url = f"{ollama_url.rstrip('/')}/api/generate"
        payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("response", "")
    except Exception as e:
        print(f"Ollama local LLM query failed: {e}")
        return ""

def _query_gemini(prompt: str) -> str:
    """Helper to query Google Gemini REST API using GEMINI_API_KEY if available."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return ""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}]
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as e:
        print(f"Gemini API call failed: {e}")
    return ""


def _extractive_context_fallback(question: str, context: str) -> str:
    """Extractive context synthesis when external LLMs are unreachable or unconfigured."""
    if not context or not context.strip():
        return "No matching context found in document index for your query."

    lines = [l.strip() for l in context.split("\n") if l.strip()]
    extracted = []
    current_src = ""

    for l in lines:
        if l.startswith("Source:"):
            current_src = l.replace("Source:", "").strip()
        elif l.startswith("Text:"):
            t = l.replace("Text:", "").strip()
            if t:
                extracted.append((current_src, t))
        elif current_src and not l.startswith("Source:"):
            extracted.append((current_src, l))

    if not extracted:
        chunks = [c.strip() for c in context.split("\n\n") if c.strip()]
        for c in chunks[:5]:
            extracted.append(("", c))

    output = [
        "**Document Key Information & Excerpts:**",
        ""
    ]

    seen = set()
    count = 0
    for src, text in extracted:
        text_clean = text.replace("\n", " ").strip()
        if not text_clean or text_clean in seen:
            continue
        seen.add(text_clean)
        cit = f" {src}" if src else ""
        output.append(f"- {text_clean}{cit}")
        count += 1
        if count >= 6:
            break

    return "\n".join(output)


def generate_answer(question, context):
    prompt = f"""You are an expert AI document assistant. Answer the user's question clearly based ONLY on the provided context.

CRITICAL FORMATTING INSTRUCTIONS:
- Break down your answer into clear, distinct sections.
- Put every section heading on its own line using bold format, like:
  **Education:**
  **Technical Skills:**
  **Experience:**
  **Projects:**
  **Certifications:**
- Under each section heading, format every item as a separate bullet point starting with a dash (`- `).
- Insert a blank empty line between different sections.
- Never concatenate multiple sections into a single continuous paragraph.
- Always include citations in the format `[filename.pdf • Page X]` whenever referring to facts from the document.

Context:
{context}

Question:
{question}

Answer:
"""

    if client:
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API call failed: {e}, falling back to Gemini, Ollama, or context synthesis.")

    # Gemini Fallback
    gemini_res = _query_gemini(prompt)
    if gemini_res:
        return gemini_res

    # Local Ollama Fallback
    ollama_res = _query_ollama(prompt)
    if ollama_res:
        return f"🦙 **[Local Ollama Output]**\n\n{ollama_res}"

    # Extractive Context Synthesis Fallback (no hardcoded static response)
    return _extractive_context_fallback(question, context)



def generate_summary_and_prompts(text_sample: str, filename: str = "document"):
    """
    Generates a concise 2-sentence executive summary and 3-4 smart starter questions
    based on a sample of document text.
    """
    cleaned_sample = text_sample.strip()[:3000]
    if not cleaned_sample:
        return {
            "summary": f"Document '{filename}' uploaded and indexed successfully.",
            "prompts": [
                f"Summarize key points in {filename}",
                "What are the main topics covered?",
                "List any actionable items or requirements"
            ]
        }

    if not client:
        # Fallback when Groq API key is not configured
        lines = [l.strip() for l in cleaned_sample.split('\n') if len(l.strip()) > 20]
        preview = lines[0] if lines else cleaned_sample[:150]
        return {
            "summary": f"This document contains details on '{preview[:100]}...'. Analyzed and indexed for instant Q&A search.",
            "prompts": [
                f"Give me a high-level summary of {filename}",
                "What are the key technical or financial findings?",
                "List all important dates or numerical metrics",
                "What recommendations or conclusions are mentioned?"
            ]
        }

    prompt = f"""You are an intelligent document analyst. Analyze the following document sample and generate:
1. A clear, executive 2-sentence summary of what this document is about.
2. 4 distinct, engaging starter questions that a user might want to ask about this document.

Format your output strictly as a JSON object with keys "summary" (string) and "prompts" (array of 4 strings).

Document Sample ({filename}):
\"\"\"
{cleaned_sample}
\"\"\"

Return ONLY valid JSON matching this schema:
{{
  "summary": "...",
  "prompts": ["question 1", "question 2", "question 3", "question 4"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        res_text = response.choices[0].message.content
        data = json.loads(res_text)
        return {
            "summary": data.get("summary", f"Executive overview of {filename}."),
            "prompts": data.get("prompts", [
                f"Summarize key sections of {filename}",
                "What are the main goals or findings?",
                "List key data points and metrics"
            ])
        }
    except Exception as e:
        print(f"Error generating summary & prompts: {e}")
        return {
            "summary": f"Document '{filename}' successfully ingested and prepared for AI search.",
            "prompts": [
                f"Give an overview of {filename}",
                "What are the key findings or takeaways?",
                "What metrics or dates are highlighted?",
                "Summarize the main sections"
            ]
        }