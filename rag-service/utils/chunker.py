def chunk_text(text, chunk_size=800, overlap=100):
    """
    Splits text into larger, coherent chunks (default 800 chars) while respecting
    word and sentence boundaries so text is never cut mid-word.
    """
    if not text or not text.strip():
        return []

    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Look for sentence/paragraph boundaries near end
        boundary = -1
        for punct in ['.\n', '\n\n', '\n', '. ', '! ', '? ']:
            pos = text.rfind(punct, start + chunk_size // 2, end)
            if pos != -1:
                boundary = pos + len(punct)
                break

        # If no sentence boundary, snap to space to avoid cutting mid-word
        if boundary == -1:
            space_pos = text.rfind(' ', start + chunk_size // 2, end)
            if space_pos != -1:
                boundary = space_pos + 1
            else:
                boundary = end

        chunk = text[start:boundary].strip()
        if chunk:
            chunks.append(chunk)

        # Advance start position with overlap, snapping to word boundary
        next_start = boundary - overlap
        if next_start <= start:
            next_start = boundary
        else:
            space_pos = text.find(' ', next_start, boundary)
            if space_pos != -1:
                next_start = space_pos + 1

        start = next_start

    return chunks