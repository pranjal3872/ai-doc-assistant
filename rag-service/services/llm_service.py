import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = None
if api_key:
    client = Groq(
        api_key=api_key
    )

def generate_answer(question, context):
    if not client:
        return "Simulated response: The profit margin for 2023 was 18.2%, driven by digital services (42% of earnings) and logistics AI workflows [financial_report_2023.pdf • Page 3]."

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

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content


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