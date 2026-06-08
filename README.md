---
title: HP RAG
emoji: 🧙
colorFrom: purple
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# HP RAG — Harry Potter Retrieval-Augmented Generation

Ask questions about all 7 Harry Potter books. The backend retrieves relevant passages from a ChromaDB vector store and sends them to Claude for grounded answers — all wrapped in a wizardry-themed UI.

---

## Stack

| Layer | Tech |
|---|---|
| Embedding | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Vector store | ChromaDB (persisted at `data/chroma_db/`) |
| LLM | Anthropic Claude (`claude-opus-4-5`) |
| Backend | FastAPI (Python) |
| Frontend | React + Vite (plain CSS modules) |

---

## Setup

### 1. Clone & configure environment

```bash
git clone https://github.com/yash-suchak/hp-rag.git
cd hp-rag
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

### 2. Download the books

1. Go to https://ia902903.us.archive.org/12/items/FantasyFictionebookcollection/
2. Download the 7 Harry Potter PDFs
3. Create the `data/books/` directory and place the files there, renamed exactly as follows:

```
data/books/
├── 1 - Harry Potter and the Sorcerer's Stone.pdf
├── 2 - Harry Potter and the Chamber of Secrets.pdf
├── 3 - Harry Potter and the Prisoner of Azkaban.pdf
├── 4 - Harry Potter and the Goblet of Fire.pdf
├── 5 - Harry Potter and the Order of the Phoenix.pdf
├── 6 - Harry Potter and the Half-Blood Prince.pdf
└── 7 - Harry Potter and the Deathly Hallows.pdf
```

> The filenames must match exactly — the ingest script uses these names to tag sources i.e. sr.no _ - _ Book name .pdf

### 3. Ingest books into the vector store

```bash
cd backend
pip install -r requirements.txt
python ingest.py
```

This builds the ChromaDB index and BM25 index. Only needed once (or when books change).

### 4. Run the backend

```bash
cd backend
uvicorn main:app --reload
# Runs at http://localhost:8000
```

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## API

```
POST http://localhost:8000/ask
Content-Type: application/json

Body:   { "question": string, "book_number": int | null }
Return: { "answer": string, "sources": [{ "book": string, "score": float }] }
```

- `book_number` 1–7 filters retrieval to a specific book; `null` searches all.
- `score` is cosine similarity (0–1); chunks below 0.1 are filtered out.
- Chunk size: 512 tokens, overlap: 64, top-k: 5 passages per query.

---

## Frontend

Wizardry-themed UI built with React + Vite:
- Purple night starfield background
- Cinzel Decorative font for headings
- Custom wand SVG cursor
- Gold spark particles on every click
- Character-by-character answer reveal with a fire/invisible-ink animation
