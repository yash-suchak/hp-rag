from sentence_transformers import SentenceTransformer
from sentence_transformers import CrossEncoder
import chromadb
from bm25_index import load_bm25_index
import numpy as np

CHROMA_DIR = "data/chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
reranker = CrossEncoder(RERANKER_MODEL)
TOP_K = 50
RRF_K = 60  # RRF constant, 60 is the standard default

model = SentenceTransformer(EMBEDDING_MODEL)
client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_collection(name="harry_potter")
bm25_data = load_bm25_index()

all_chunks = collection.get(
    include=["documents", "metadatas"]
)

chunk_lookup = {}
for i, meta in enumerate(all_chunks["metadatas"]):
    key = (
        meta["book_number"],
        meta["chunk_index"]
    )
    chunk_lookup[key] = all_chunks["documents"][i]

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

    # ── Reciprocal Rank Fusion - Step 1 Union────────────────────────────
    candidate_ids = []
    seen = set()

    for doc_id in dense_ids:
        if doc_id not in seen:
            candidate_ids.append(doc_id)
            seen.add(doc_id)

    for doc_id in bm25_ids:
        if doc_id not in seen:
            candidate_ids.append(doc_id)
            seen.add(doc_id)

    # Build a lookup from all retrieved ids → chunk data
    lookup = {}

    for i, doc_id in enumerate(dense_results["ids"][0]):
        lookup[doc_id] = {
            "text": dense_results["documents"][0][i],
            "book_number": dense_results["metadatas"][0][i]["book_number"],
            "book_title": dense_results["metadatas"][0][i]["book_title"],
            "chunk_index": dense_results["metadatas"][0][i]["chunk_index"],
        }

    for i in top_bm25_indices:
        doc_id = bm25_data["ids"][i]
        if doc_id not in lookup:
            lookup[doc_id] = {
                "text": bm25_data["documents"][i],
                "book_number": bm25_data["metadatas"][i]["book_number"],
                "book_title": bm25_data["metadatas"][i]["book_title"],
                "chunk_index": bm25_data["metadatas"][i]["chunk_index"],
            }
    
    pairs = []

    filtered_candidate_ids = []
    for doc_id in candidate_ids:
        chunk_index = lookup[doc_id]["chunk_index"]
        if chunk_index < 10:
            continue
        filtered_candidate_ids.append(doc_id)
        pairs.append(
            (query, lookup[doc_id]["text"])
        )

    scores = reranker.predict(pairs)

    ranked = sorted(
    zip(filtered_candidate_ids, scores),
    key=lambda x: x[1],
    reverse=True
    )

    TOP_RERANKED = 3
    
    # Return top 8 after fusion
    chunks = []
    expanded_seen = set()
    for doc_id, score in ranked[:TOP_RERANKED]:

        chunk_book_number = lookup[doc_id]["book_number"]
        chunk_index = lookup[doc_id]["chunk_index"]

        for neighbor_idx in [
            chunk_index - 1,
            chunk_index,
            chunk_index + 1
        ]:

            key = (chunk_book_number, neighbor_idx)

            if key not in chunk_lookup:
                continue

            if key in expanded_seen:
                continue

            expanded_seen.add(key)

            chunks.append({
                "text": chunk_lookup[key],
                "book_number": chunk_book_number,
                "book_title": lookup[doc_id]["book_title"],
                "chunk_index": neighbor_idx,
                "score": float(score)
            })

    return chunks


# if __name__ == "__main__":
#     query = "Who is the Half-Blood Prince?"
#     results = retrieve(query)

#     print(f"\nQuery: {query}\n")
#     for i, chunk in enumerate(results):
#         print(f"[{i+1}] Book {chunk['book_number']}: {chunk['book_title']} (rrf score: {chunk['score']})")
#         print(f"    {chunk['text'][:200]}...")
#         print() 

if __name__ == "__main__":

    questions = [
        # "Who is Scabbers really?",
        # "Who opened the Chamber of Secrets?"
        "Who is the Half-Blood Prince?"
        # "Who killed Dumbledore?"
        # # Direct Fact Retrieval
        # "Who is Nicolas Flamel?",
        # "What is Felix Felicis?",
        # "What is a Horcrux?",
        # "What is the Chamber of Secrets?",
        # "What is the Mirror of Erised?",

        # # Identity Questions
        # "Who is the Half-Blood Prince?",
        # "Who opened the Chamber of Secrets?",
        # "Who killed Dumbledore?",
        # "Who is Scabbers really?",
        # "Who is Lord Voldemort?",

        # # Relationship Questions
        # "What is the relationship between Sirius Black and Harry Potter?",
        # "Why does Snape hate Harry Potter?",
        # "What is the relationship between Snape and Lily Potter?",
        # "Why did Dumbledore trust Snape?",

        # # Event Questions
        # "Why did Sirius Black escape Azkaban?",
        # "How did Harry survive Voldemort's killing curse as a baby?",
        # "How was the Chamber of Secrets opened?",
        # "What happened at the graveyard in Little Hangleton?",

        # # Multi-Hop Questions
        # "Tell me Voldemort's backstory.",
        # "Explain the history of the Deathly Hallows."
    ]

    for q_num, query in enumerate(questions, start=1):
        print("\n" + "=" * 100)
        print(f"QUESTION {q_num}: {query}")
        print("=" * 100)

        results = retrieve(query)

        for i, chunk in enumerate(results):
            print(
                f"Book {chunk['book_number']} "
                f"Chunk {chunk['chunk_index']}"
            )

            preview = chunk["text"][:350].replace("\n", " ")
            print(f"    {preview}...")