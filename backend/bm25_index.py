import chromadb
import pickle
import os
from rank_bm25 import BM25Okapi

CHROMA_DIR = "../data/chroma_db"
BM25_INDEX_PATH = "../data/bm25_index.pkl"


def build_bm25_index():
    print("Loading chunks from ChromaDB...")
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection("harry_potter")

    results = collection.get(include=["documents", "metadatas"])
    documents = results["documents"]
    metadatas = results["metadatas"]
    ids = results["ids"]

    print(f"Building BM25 index over {len(documents)} chunks...")
    tokenized = [doc.lower().split() for doc in documents]
    bm25 = BM25Okapi(tokenized)

    index_data = {
        "bm25": bm25,
        "documents": documents,
        "metadatas": metadatas,
        "ids": ids,
    }

    with open(BM25_INDEX_PATH, "wb") as f:
        pickle.dump(index_data, f)

    print(f"BM25 index saved to {BM25_INDEX_PATH}")


def load_bm25_index():
    if not os.path.exists(BM25_INDEX_PATH):
        print("BM25 index not found, building...")
        build_bm25_index()

    with open(BM25_INDEX_PATH, "rb") as f:
        return pickle.load(f)


if __name__ == "__main__":
    build_bm25_index()