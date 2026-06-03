import os
from anthropic import Anthropic
from dotenv import load_dotenv
from retriever import retrieve

load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SCORE_THRESHOLD = 0.1
SYSTEM_PROMPT = """You are a Harry Potter book expert. You answer questions STRICTLY based on the retrieved book passages provided to you.

Rules:
- Only use information present in the provided passages
- If the passages don't contain enough information, say: "I couldn't find that in the book passages provided."
- Never use knowledge from the movies or any source outside the passages
- Always mention which book your answer is from"""


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
        context += f"\n[Passage {i+1} — Book {chunk['book_number']}: {chunk['book_title']}]\n"
        context += chunk["text"] + "\n"

    # Call Claude
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Based on these passages STRICTLY:\n{context}\n\nAnswer this question: {query}"
            }
        ]
    )

    return {
        "answer": response.content[0].text,
        "sources": [
            {"book": c["book_title"], "score": c["score"]}
            for c in relevant_chunks
        ]
    }


if __name__ == "__main__":
    result = generate_answer("Who is Nicolas Flamel?")
    print("\nAnswer:", result["answer"])
    print("\nSources:")
    for s in result["sources"]:
        print(f"  - {s['book']} (score: {s['score']})")