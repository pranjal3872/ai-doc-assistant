import os
from pypdf import PdfReader

try:
    import docx
except ImportError:
    docx = None


def extract_text(file_path: str):
    """
    Extracts structured page/section text from PDF, TXT, MD, and DOCX files.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext in [".txt", ".md"]:
        return _extract_plain_text(file_path)
    elif ext in [".docx", ".doc"]:
        return _extract_docx(file_path)
    else:
        # Default fallback to plain text reader
        return _extract_plain_text(file_path)


def _extract_pdf(pdf_path: str):
    reader = PdfReader(pdf_path)
    pages = []
    for page_num, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text()
        if page_text and page_text.strip():
            pages.append({
                "page": page_num,
                "text": page_text
            })
    return pages if pages else [{"page": 1, "text": "Empty or unreadable PDF content."}]


def _extract_plain_text(text_path: str):
    try:
        with open(text_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()
    except Exception as e:
        print(f"Error reading plain text file {text_path}: {e}")
        full_text = ""

    if not full_text.strip():
        return [{"page": 1, "text": "Empty document."}]

    # Segment long text files into logical ~1500 char virtual "pages"
    page_size = 1500
    paragraphs = full_text.split("\n\n")
    pages = []
    current_page = []
    current_len = 0
    page_num = 1

    for para in paragraphs:
        cleaned = para.strip()
        if not cleaned:
            continue
        if current_len + len(cleaned) > page_size and current_page:
            pages.append({
                "page": page_num,
                "text": "\n\n".join(current_page)
            })
            page_num += 1
            current_page = [cleaned]
            current_len = len(cleaned)
        else:
            current_page.append(cleaned)
            current_len += len(cleaned)

    if current_page:
        pages.append({
            "page": page_num,
            "text": "\n\n".join(current_page)
        })

    return pages


def _extract_docx(docx_path: str):
    if docx is None:
        return _extract_plain_text(docx_path)

    try:
        doc = docx.Document(docx_path)
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        print(f"Error reading docx file {docx_path}: {e}")
        return [{"page": 1, "text": f"Could not read DOCX document: {e}"}]

    if not full_text.strip():
        return [{"page": 1, "text": "Empty DOCX document."}]

    # Segment into ~1500 character logical pages
    page_size = 1500
    paragraphs = full_text.split("\n")
    pages = []
    current_page = []
    current_len = 0
    page_num = 1

    for para in paragraphs:
        cleaned = para.strip()
        if not cleaned:
            continue
        if current_len + len(cleaned) > page_size and current_page:
            pages.append({
                "page": page_num,
                "text": "\n".join(current_page)
            })
            page_num += 1
            current_page = [cleaned]
            current_len = len(cleaned)
        else:
            current_page.append(cleaned)
            current_len += len(cleaned)

    if current_page:
        pages.append({
            "page": page_num,
            "text": "\n".join(current_page)
        })

    return pages