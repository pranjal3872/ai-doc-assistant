from sentence_transformers import SentenceTransformer

_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def generate_embeddings(chunks):
    model = get_model()
    embeddings = model.encode(chunks)

    return embeddings