from qdrant_client import QdrantClient
from dotenv import load_dotenv
import os
import uuid
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
)

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip() or None
QDRANT_PATH = "./qdrant_db"


def _create_client():
    # Hosted Qdrant (e.g. Qdrant Cloud) keeps documents across redeploys.
    # Don't fall back to local storage if it's unreachable: that would
    # silently write to a disk that gets wiped again.
    if QDRANT_URL:
        print(f"Using hosted Qdrant at {QDRANT_URL}")
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=30)

    print(
        f"QDRANT_URL is not set; storing vectors locally in {QDRANT_PATH}. "
        "This is fine for development, but on hosts with ephemeral disks "
        "(like Render) every redeploy wipes uploaded documents."
    )
    try:
        return QdrantClient(path=QDRANT_PATH)
    except Exception as e:
        print(f"Warning: Could not initialize local path {QDRANT_PATH} ({e}), falling back to in-memory Qdrant client.")
        return QdrantClient(location=":memory:")


client = _create_client()

COLLECTION_NAME = "documents"


def create_collection():
    collections = client.get_collections().collections

    if COLLECTION_NAME not in [c.name for c in collections]:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE,
            ),
        )
        print("Collection created!")
    else:
        print("Collection already exists.")

    # Every query filters on these fields. Qdrant Cloud rejects filters on
    # unindexed fields, and the indexes keep lookups fast. Safe to re-run.
    for field in ("user_id", "filename"):
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field,
            field_schema=PayloadSchemaType.KEYWORD,
        )

def store_embeddings(chunks, embeddings, filename, metadata, user_id="default_user"):
    points = []

    for i, (chunk, embedding, meta) in enumerate(
        zip(chunks, embeddings, metadata)
    ):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload={
                    "text": chunk,
                    "filename": filename,
                    "page": meta["page"],
                    "chunk_id": i,
                    "user_id": user_id,
                }
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    print(f"Stored {len(points)} chunks for user '{user_id}' in Qdrant.")

def search_similar_chunks(
    query_embedding,
    filename=None,
    limit=5,
    user_id=None,
):
    must_conditions = []
    if user_id:
        must_conditions.append(
            FieldCondition(
                key="user_id",
                match=MatchValue(value=user_id)
            )
        )
    if filename:
        must_conditions.append(
            FieldCondition(
                key="filename",
                match=MatchValue(value=filename)
            )
        )

    search_filter = Filter(must=must_conditions) if must_conditions else None

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding.tolist(),
        query_filter=search_filter,
        limit=limit,
    )

    return [
        {
            "score": point.score,
            "text": point.payload["text"],
            "filename": point.payload["filename"],
            "page": point.payload["page"],
            "chunk_id": point.payload["chunk_id"],
            "user_id": point.payload.get("user_id", "default_user"),
        }
        for point in response.points
    ]

def get_documents(user_id=None):
    scroll_filter = None
    if user_id:
        scroll_filter = Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id)
                )
            ]
        )

    response = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=scroll_filter,
        limit=10000,
        with_payload=True,
        with_vectors=False,
    )

    points = response[0]

    stats = {}
    for point in points:
        payload = point.payload
        if "filename" in payload:
            fn = payload["filename"]
            page = payload.get("page", 1)
            if fn not in stats:
                stats[fn] = {
                    "filename": fn,
                    "pages": 0,
                    "chunks": 0
                }
            stats[fn]["chunks"] += 1
            if page > stats[fn]["pages"]:
                stats[fn]["pages"] = page

    return sorted(list(stats.values()), key=lambda x: x["filename"])


def delete_document(filename: str, user_id=None):
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

    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(must=must_conditions)
    )

    print(f"{filename} deleted successfully for user '{user_id}'.")


