# HP RAG — Harry Potter Retrieval-Augmented Generation

## Project Overview

A full-stack RAG application that lets you ask questions about all 7 Harry Potter books. The backend retrieves relevant passages from a ChromaDB vector store and sends them to Claude for grounded answers.

## Stack

| Layer | Tech |
|---|---|
| Embedding | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Vector store | ChromaDB (persisted at `data/chroma_db/`) |
| LLM | Anthropic Claude (`claude-opus-4-5`) |
| Backend | FastAPI (Python) |
| Frontend | React + Vite (plain CSS modules) |

## Running the Project

### Backend
```bash
cd backend
uvicorn main:app --reload
# Runs at http://localhost:8000
```
Requires `ANTHROPIC_API_KEY` in `backend/.env`.

### Frontend
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

## API Contract

```
POST http://localhost:8000/ask
Content-Type: application/json

Body:   { "question": string, "book_number": int | null }
Return: { "answer": string, "sources": [{ "book": string, "score": float }] }
```

- `book_number` 1–7 filters retrieval to a specific book; `null` searches all.
- `score` is cosine similarity (0–1); chunks below 0.1 are filtered out.

## Data

- Books live in `data/books/` as PDFs.
- Run `python backend/ingest.py` to rebuild the vector index (only needed if books change).
- Chunk size: 512 tokens, overlap: 64, top-k: 5 passages per query.

## Frontend Design

Wizardry-themed UI:
- Purple night starfield background (`#0d0221`)
- Cinzel Decorative font for the heading (closest free font to HP movie title)
- Custom wand SVG cursor
- Gold spark particles on every click (`useSparks.js`)
- "Accio Answer!" submit button with golden gradient
- Answer text reveals character-by-character with a fire/invisible-ink animation (`inkReveal` keyframe)
