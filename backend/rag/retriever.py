import os
import warnings
import logging

# Silence deprecation and info warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
logging.getLogger("transformers").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Calculate path to ChromaDB created by build_rag.py (project root)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

_embeddings = None
_db = None

def get_db():
    global _embeddings, _db
    if _db is None:
        if not os.path.exists(CHROMA_PATH):
            print(f"Chroma DB not found at {CHROMA_PATH}")
            return None
        # Use a multilingual embedding model that supports Hindi and Bhojpuri
        _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        _db = Chroma(persist_directory=CHROMA_PATH, embedding_function=_embeddings)
    return _db

# Simple in‑memory cache for query → context
_cache = {}

def retrieve_context(query: str, k: int = 2) -> str:
    """Retrieve top k contexts for the given query from Chroma with caching."""
    global _cache
    if query in _cache:
        print(f"[RAG DEBUG] Cache hit for query: {query[:120]}")
        # Print cached snippet for debugging
        cached_snippet = _cache[query][:400].replace("\n", " ")
        print(f"[RAG DEBUG] Cached context snippet: {cached_snippet}...")
        return _cache[query]

    db = get_db()
    if not db:
        return ""

    # Try to get scores when available, otherwise fall back to basic similarity_search
    try:
        sr = db.similarity_search_with_score(query, k=k)
        # sr is often a list of (doc, score); normalize to docs list
        docs = [item[0] if isinstance(item, (list, tuple)) and len(item) >= 1 else item for item in sr]
    except Exception:
        docs = db.similarity_search(query, k=k)

    # Debug: print each retrieved chunk (truncated) so devs can see what RAG provided
    print(f"[RAG DEBUG] Retrieved top {len(docs)} chunks for query: {query[:120]}")
    for i, doc in enumerate(docs, start=1):
        content = getattr(doc, 'page_content', str(doc))
        snippet = content[:400].replace("\n", " ")
        print(f"[RAG DEBUG] Chunk {i} (len={len(content)}): {snippet}...")

    context = "\n\n".join([getattr(doc, 'page_content', str(doc)) for doc in docs])

    # Store in cache (limit size to 100 entries)
    if len(_cache) > 100:
        _cache.pop(next(iter(_cache)))
    _cache[query] = context
    return context
