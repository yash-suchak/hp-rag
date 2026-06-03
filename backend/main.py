from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict
from datetime import datetime, timedelta
from anthropic import Anthropic
from dotenv import load_dotenv
from generator import generate_answer
from logger import get_logger
import os

load_dotenv()
logger = get_logger("main")

app = FastAPI(title="HP RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter ──────────────────────────────────────────
RATE_LIMIT = 5
rate_store: dict[str, list[datetime]] = defaultdict(list)

def is_rate_limited(ip: str) -> bool:
    now = datetime.now()
    window = now - timedelta(days=1)
    rate_store[ip] = [t for t in rate_store[ip] if t > window]
    if len(rate_store[ip]) >= RATE_LIMIT:
        return True
    rate_store[ip].append(now)
    return False

def get_remaining_queries(ip: str) -> int:
    now = datetime.now()
    window = now - timedelta(days=1)
    recent = [t for t in rate_store[ip] if t > window]
    return max(0, RATE_LIMIT - len(recent))

# ── Topic guardrail ───────────────────────────────────────
_anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def is_harry_potter_related(question: str) -> bool:
    try:
        response = _anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=10,
            system="""You are a topic classifier. 
The user is using a Harry Potter book Q&A system.
Determine if the question is related to Harry Potter, its characters, spells, events, or world.
Reply with only YES or NO.""",
            messages=[{"role": "user", "content": question}]
        )
        result = response.content[0].text.strip().upper()
        return result == "YES"
    except Exception as e:
        logger.error(f"Guardrail check failed: {e}")
        return True  # fail open so a guardrail bug doesn't break the app


# ── Request / Response models ─────────────────────────────
class QueryRequest(BaseModel):
    question: str
    book_number: int | None = None

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]
    queries_remaining: int


# ── Routes ────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/ask", response_model=QueryResponse)
async def ask(request: Request, body: QueryRequest):
    ip = request.client.host
    question = body.question.strip()

    logger.info(f"[{ip}] Query: '{question}' | book_filter: {body.book_number}")

    # Empty question
    if not question:
        logger.warning(f"[{ip}] Empty question received")
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Rate limit
    if is_rate_limited(ip):
        logger.warning(f"[{ip}] Rate limit exceeded")
        raise HTTPException(
            status_code=429,
            detail="You have used all 5 daily queries. Come back tomorrow."
        )

    # Guardrail
    if not is_harry_potter_related(question):
        logger.warning(f"[{ip}] Off-topic question blocked: '{question}'")
        raise HTTPException(
            status_code=400,
            detail="This tool only answers questions about the Harry Potter books. Please ask something related to the series."
        )

    # Generate
    try:
        result = generate_answer(question, body.book_number)
        remaining = get_remaining_queries(ip)
        logger.info(f"[{ip}] Answer generated | sources: {len(result['sources'])} | remaining: {remaining}")

        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            queries_remaining=remaining
        )
    except Exception as e:
        logger.error(f"[{ip}] Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong generating the answer.")