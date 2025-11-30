# Import libraries
import sqlite3
import json
import os
import chromadb
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import logging
import threading


DB_PATH = os.environ.get("DB_PATH", "data/chroma.sqlite")

def on_request(request):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        # Example query
        rows = cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()

        return json.dumps({
            "tables": rows
        })

    except Exception as e:
        return json.dumps({"error": str(e)})
    

# Initialize components
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow frontend requests

# Load the same embedding model used during scraping
print("Loading embedding model 'BAAI/bge-large-en-v1.5'...")
model = SentenceTransformer('BAAI/bge-large-en-v1.5')

# Connect to the same ChromaDB instance created by data-grabber.py
client = chromadb.PersistentClient(path="data")  # <- Matches 'path="data"' in your script
collection = client.get_or_create_collection("reddit_posts")  # <- Same collection name

logger.info("Connected to ChromaDB at ./data/collection=reddit_posts")

# Define GET route for recommendations
@app.route('/search', methods=['GET'])
def search_posts():
    """
    Search relevant Reddit posts based on user query.
    
    Query Parameters:
        q (str): User input like "doge", "when lambo", or "BTC pump"
        n (int): Number of results (default=5)
    
    Returns:
        JSON: {query, total_results, posts[]}
    """
    query = request.args.get('q', '').strip()
    n_results = max(1, min(20, int(request.args.get('n',5))))  # Limit results between 1 and 20
    if not query:
        return jsonify({"error": "q parameter is required"}), 400

    try:
        # Generate embedding for the query
        query_embedding = model.encode([query]).tolist()[0]

        # Perform similarity search in ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,  # Number of recommendations to return
            include=['documents', 'metadatas', 'distances']
        )

        # Format results
        posts = []
        ids_list = results['ids'][0]
        docs_list = results['documents'][0]
        metas_list = results['metadatas'][0]
        distances_list = results['distances'][0]

        for i in range(len(ids_list)):
            meta = metas_list[i]
            post_data = {
                "id": ids_list[i],
                "title": meta.get("title", "No Title"),
                "subreddit": meta.get("subreddit", "Unknown"),
                "author": meta.get("author", "Unknown"),
                "upvotes": meta.get("upvotes", 0),
                "num_comments": meta.get("num_comments", 0),
                "flair": meta.get("flair", "None"),
                "text": docs_list[i],
                "url": f"https://reddit.com/r/{meta['subreddit']}/comments/{ids_list[i]}",
                "relevance_score": round(1 - distances_list[i], 4)  # Convert distance to similarity score
            }
            posts.append(post_data)
        
        return jsonify({"query": query, "total_results": len(posts), "posts": posts}), 200
    
    except Exception as e:
        logger.error(f"Error during search: {e}")
        return jsonify({"error": "Internal server error"}), 500

   
#if __name__ == "__main__":
   # app.run(debug=True, port=8000) # debug=True enables debug mode and auto-reloading

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)  