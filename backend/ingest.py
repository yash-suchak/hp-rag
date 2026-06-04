import os
import fitz  # pymupdf
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb

# ── Config ────────────────────────────────────────────────
BOOKS_DIR = "../data/books"
CHROMA_DIR = "data/chroma_db"
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 150
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

BOOK_TITLES = {
    1: "Harry Potter and the Sorcerer's Stone.pdf",
    2: "Harry Potter and the Chamber of Secrets.pdf",
    3: "Harry Potter and the Prisoner of Azkaban.pdf",
    4: "Harry Potter and the Goblet of Fire.pdf",
    5: "Harry Potter and the Order of the Phoenix.pdf",
    6: "Harry Potter and the Half-Blood Prince.pdf",
    7: "Harry Potter and the Deathly Hallows.pdf",
}

# ── Step 1: Extract text from PDF ─────────────────────────
def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text

# ── Step 2: Chunk the text ────────────────────────────────
def chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
        separators=[
            "\n\n\n",   # chapter breaks
            "\n\n",     # paragraph breaks  ← primary split point
            "\n",       # single newlines
            ". ",       # sentence boundaries
            " ",        # word boundaries
            ""          # character fallback
        ]
    )
    return splitter.split_text(text)

# ── Step 3: Embed + store in ChromaDB ────────────────────
def ingest_book(pdf_path: str, book_number: int, chroma_collection):
    print(f"\n📖 Processing Book {book_number}: {BOOK_TITLES[book_number]}")

    # Extract
    print("  → Extracting text...")
    text = extract_text_from_pdf(pdf_path)
    print(f"  → Extracted {len(text)} characters")

    # Chunk
    print("  → Chunking...")
    chunks = chunk_text(text)
    print(f"  → Created {len(chunks)} chunks")

    # Embed + store
    print("  → Embedding and storing...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    ids = []
    embeddings = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"book{book_number}_chunk{i}"
        embedding = model.encode(chunk).tolist()

        ids.append(chunk_id)
        embeddings.append(embedding)
        documents.append(chunk)
        metadatas.append({
            "book_number": book_number,
            "book_title": BOOK_TITLES[book_number],
            "chunk_index": i,
        })

    # Batch insert into ChromaDB
    chroma_collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )
    print(f"  ✅ Book {book_number} stored — {len(chunks)} chunks")


# ── Main ──────────────────────────────────────────────────
def main():
    # Setup ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_or_create_collection(name="harry_potter")

    # Process each PDF
    pdf_files = sorted([f for f in os.listdir(BOOKS_DIR) if f.endswith(".pdf")])

    if not pdf_files:
        print("❌ No PDFs found in data/books/")
        return

    for pdf_file in pdf_files:
        book_number = int(pdf_file.split(" ")[0])
        pdf_path = os.path.join(BOOKS_DIR, pdf_file)
        ingest_book(pdf_path, book_number, collection)

    print(f"\n🎉 Ingestion complete! Total chunks: {collection.count()}")


if __name__ == "__main__":
    main()