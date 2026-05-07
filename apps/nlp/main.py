from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import spacy

app = FastAPI(title="tAI NLP Sidecar", version="1.0.0")

# Load the spaCy model globally
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError("Failed to load spaCy model 'en_core_web_sm'. Ensure it is installed via 'python -m spacy download en_core_web_sm'.")

class SegmentRequest(BaseModel):
    text: str

class SegmentResponse(BaseModel):
    sentences: list[str]

@app.get("/")
def health_check():
    return {"status": "ok", "service": "nlp-sidecar"}

@app.post("/segment", response_model=SegmentResponse)
def segment_text(req: SegmentRequest):
    if not req.text.strip():
        return SegmentResponse(sentences=[])
    
    try:
        doc = nlp(req.text)
        # Extract sentences, preserving but stripping whitespace
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        return SegmentResponse(sentences=sentences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")
