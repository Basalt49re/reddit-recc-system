from sentence_transformers import SentenceTransformer

# Load a default model for embeddings
model = SentenceTransformer('BAAI/bge-large-en-v1.5')

def get_embedding(text):
    """Return the embedding for a given text using sentence-transformers."""
    return model.encode(text).tolist()
