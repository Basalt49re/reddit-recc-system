import requests
import chromadb
import json
import time
import logging
from chromadb.config import Settings
from embedding_utils import get_embedding
import concurrent.futures

def initialize_or_setup_db():
    """
    Initializes client
    Returns: collection to write to
    """
    client = chromadb.PersistentClient(path="data")

    
    collection = client.get_or_create_collection("reddit_posts")
    
    return collection

def process_post(post):
    """
    Given: A post (dictionary)
    Return: information used to insert into chroma
    """
    post_data = post.get("data", {})
    post_id = post_data.get("name") or post_data.get("id")
    content = post_data.get("selftext", "")
    title = post_data.get("title", "")
    full_content = f"{title}\n{content}" if content else title
    
    # Replace None values with type-appropriate defaults
    metadata = {
        "title": title if title is not None else "",
        "subreddit": post_data.get("subreddit") or "",
        "author": post_data.get("author") or "",
        "timestamp": post_data.get("created_utc") if post_data.get("created_utc") is not None else 0,
        "upvotes": post_data.get("ups") if post_data.get("ups") is not None else 0,
        "num_comments": post_data.get("num_comments") if post_data.get("num_comments") is not None else 0,
        "flair": post_data.get("link_flair_text") or ""
    }

    embedding = get_embedding(full_content)
    return post_id, full_content, metadata, embedding

def save_data(posts, post_collection):
    """given a list of dictionaries, save to chromadb database"""
    # Concurrently process posts, store into a list
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(process_post, posts))

    # Add to vector db, suppress unwanted stdout prints from ChromaDB
    if results:
        ids, documents, metadatas, embeddings = zip(*results)
        post_collection.add(
            ids=list(ids),
            documents=list(documents),
            metadatas=list(metadatas),
            embeddings=list(embeddings)
        )
        logging.info(f"Embedded and stored {len(posts)} posts in this batch.")
        return len(posts)
    return 0



def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
    post_collection = initialize_or_setup_db()
    total_embedded = 0
    req_count = 0
    nextPost = None
    while True:
        url = "https://www.reddit.com/r/crypto/hot.json"
        headers = {"User-Agent": "MyRedditApp/0.1 by OutlandishnessGrand8"}
        params = {"limit": 100}
        if nextPost:
            params["after"] = nextPost
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        req_count += 1
        if req_count >= 100:
            logging.info("Hit 100 requests, sleeping for 60 seconds to respect Reddit rate limits.")
            time.sleep(60)
            req_count = 0

        nextPost = data.get("data", {}).get("after", None)
        posts = data.get("data", {}).get("children", [])

        if not posts:
            logging.info("No more posts returned by API. Exiting loop.")
            break

        batch_count = save_data(posts, post_collection)
        total_embedded += batch_count
        logging.info(f"Total embedded posts so far: {total_embedded}")

        if not nextPost:
            logging.info("No nextPost value returned by API. Exiting loop.")
            break

        # Sleep to ensure we don't exceed 100 requests/minute
        time.sleep(0.7)

        print(f"done!")

if __name__ == "__main__":
    main()