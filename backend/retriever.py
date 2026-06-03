from sentence_transformers import SentenceTransformer
import chromadb
from bm25_index import load_bm25_index
import numpy as np

CHROMA_DIR = "../data/chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
TOP_K = 15
RRF_K = 60  # RRF constant, 60 is the standard default

model = SentenceTransformer(EMBEDDING_MODEL)
client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_collection(name="harry_potter")
bm25_data = load_bm25_index()


def reciprocal_rank_fusion(dense_ids, bm25_ids):
    scores = {}

    for rank, doc_id in enumerate(dense_ids):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (RRF_K + rank + 1)

    for rank, doc_id in enumerate(bm25_ids):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (RRF_K + rank + 1)

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def retrieve(query: str, book_number: int = None) -> list[dict]:
    # ── Dense retrieval ───────────────────────────────────
    query_embedding = model.encode(query).tolist()
    where_filter = {"book_number": book_number} if book_number else None

    dense_results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )
    dense_ids = dense_results["ids"][0]

    # ── BM25 retrieval ────────────────────────────────────
    tokenized_query = query.lower().split()
    bm25 = bm25_data["bm25"]
    all_scores = bm25.get_scores(tokenized_query)

    # Apply book filter to BM25 if needed
    if book_number:
        for i, meta in enumerate(bm25_data["metadatas"]):
            if meta["book_number"] != book_number:
                all_scores[i] = 0.0

    top_bm25_indices = np.argsort(all_scores)[::-1][:TOP_K]
    bm25_ids = [bm25_data["ids"][i] for i in top_bm25_indices]

    # ── Reciprocal Rank Fusion ────────────────────────────
    fused = reciprocal_rank_fusion(dense_ids, bm25_ids)

    # Build a lookup from all retrieved ids → chunk data
    lookup = {}

    for i, doc_id in enumerate(dense_results["ids"][0]):
        lookup[doc_id] = {
            "text": dense_results["documents"][0][i],
            "book_number": dense_results["metadatas"][0][i]["book_number"],
            "book_title": dense_results["metadatas"][0][i]["book_title"],
        }

    for i in top_bm25_indices:
        doc_id = bm25_data["ids"][i]
        if doc_id not in lookup:
            lookup[doc_id] = {
                "text": bm25_data["documents"][i],
                "book_number": bm25_data["metadatas"][i]["book_number"],
                "book_title": bm25_data["metadatas"][i]["book_title"],
            }

    # Return top 8 after fusion
    chunks = []
    for doc_id, rrf_score in fused[:8]:
        if doc_id in lookup:
            chunk = lookup[doc_id].copy()
            chunk["score"] = round(rrf_score, 4)
            chunks.append(chunk)

    return chunks


if __name__ == "__main__":
    query = "Who is the Half-Blood Prince?"
    results = retrieve(query)

    print(f"\nQuery: {query}\n")
    for i, chunk in enumerate(results):
        print(f"[{i+1}] Book {chunk['book_number']}: {chunk['book_title']} (rrf score: {chunk['score']})")
        print(f"    {chunk['text'][:200]}...")
        print() 