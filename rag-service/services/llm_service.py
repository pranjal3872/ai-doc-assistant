import os
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