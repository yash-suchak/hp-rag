import os
from anthropic import Anthropic
from dotenv import load_dotenv
from retriever import retrieve

load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SCORE_THRESHOLD = 0.1
SYSTEM_PROMPT = """You are a Harry Potter book expert.

Answer questions ONLY using the provided book passages.

Rules:
- Use only information found in the provided passages
- You may combine information from multiple passages when needed
- If a passage directly answers or resolves the question, prioritize it over passages that merely discuss the topic
- Mention the source book or books used in your answer
- If the passages do not contain enough information, say:
  "I couldn't find that in the book passages provided."
- Do not use movie knowledge or outside knowledge.
- After every fact or claim, add a superscript-style book reference in square brackets, e.g. [3] for Book 3. Use only the book numbers from the provided passages. Do not mention chunk numbers or relevance scores.
"""


def generate_answer(query: str, book_number: int = None) -> dict:
    chunks = retrieve(query, book_number)

    # Filter low relevance chunks
    relevant_chunks = chunks

    if not relevant_chunks:
        return {
            "answer": "I couldn't find that in the book passages provided.",
            "sources": []
        }

    # Build context from chunks
    context = ""

    for i, chunk in enumerate(relevant_chunks):

        score = round(chunk.get("score", 0), 4)
        print(f"Chunk: {i} - {chunk['text'][:200]}")
        context += (
            f"\n"
            f"[Passage {i+1} | "
            f"Book {chunk['book_number']} | "
            f"Chunk {chunk['chunk_index']} | "
            f"Relevance Score: {score}]\n"
        )
        context += chunk["text"] + "\n"

    context += f"\n\nQuestion:\n{query}\n"

    # Call Claude
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": context
            }
        ]
    )

    seen_books = {}
    for c in relevant_chunks:
        bn = c["book_number"]
        if bn not in seen_books or c["score"] > seen_books[bn]["score"]:
            seen_books[bn] = {
                "book_number": bn,
                "book": c["book_title"].replace(".pdf", "").strip(),
                "score": round(c["score"], 4),
            }

    return {
        "answer": response.content[0].text,
        "sources": list(seen_books.values())
    }


if __name__ == "__main__":
    result = generate_answer("Who is the Half Blood prince")
    print("\nAnswer:", result["answer"])
    print("\nSources:")
    for s in result["sources"]:
        print(f"  - {s['book']} (score: {s['score']})")