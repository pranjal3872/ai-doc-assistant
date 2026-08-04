from qdrant_client import QdrantClient
import uuid
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

# In-memory Qdrant database
client = QdrantClient(path="./qdrant_db")

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


