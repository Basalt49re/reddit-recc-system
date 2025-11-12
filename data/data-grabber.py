import os
os.environ['TQDM_DISABLE'] = '1'

import requests
import chromadb
import json
import time
import logging
from chromadb.config import Settings
from embedding_utils import get_embedding
import concurrent.futures
import os

def initialize_or_setup_db():
    """
    Initializes client
    Returns: collection to write to
    """
    client = chromadb.PersistentClient(
        path="data",
        settings=Settings(anonymized_telemetry=False)
    )


    
    collection = client.get_or_create_collection("reddit_posts")
    
    return collection

def process_post(post):
    """
    Given: A post (dictionary)
    Return: information used to insert into chroma
    """
    post_id = post.get("id")

    # Skip no ID post
    if not post_id:
        return None
    
    content = post.get("selftext", "")
    title = post.get("title", "")
    full_content = f"{title}\n{content}" if content else title

    # Replace None values with type-appropriate defaults
    metadata = {
        "title": title if title is not None else "",
        "subreddit": post.get("subreddit") or "",
        "author": post.get("author") or "",
        "timestamp": post.get("created_utc") if post.get("created_utc") is not None else 0,
        "upvotes": post.get("ups") if post.get("ups") is not None else 0,
        "num_comments": post.get("num_comments") if post.get("num_comments") is not None else 0,
        "flair": post.get("link_flair_text") or ""
    }

    # Fetch embedding from sentence transformer
    embedding = get_embedding(full_content)

    # Return post_id, post information, metadata, and embedding to store inside chroma
    return post_id, full_content, metadata, embedding

def save_data(posts, post_collection):
    """given a list of dictionaries, save to chromadb database"""
    
    # Concurrently process posts, store into a list
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(process_post, posts))

    # Filter out None results (invalid posts)
    results = [r for r in results if r is not None]

    # Remove dupe IDs
    seen_ids = set()
    unique_results = []
    for r in results:
        post_id = r[0]
        if post_id not in seen_ids:
            unique_results.append(r)
            seen_ids.add(post_id)

    # Add to vector db, store only unseen posts into chroma
    if unique_results:
        ids, documents, metadatas, embeddings = zip(*unique_results)
        post_collection.add(
            ids=list(ids),
            documents=list(documents),
            metadatas=list(metadatas),
            embeddings=list(embeddings)
        )
        logging.info(f"Embedded and stored {len(unique_results)} posts in this batch.")
        return len(unique_results)
    return 0

def save_next_post(nextPost, secret_path):
    """
    Given the next post's id, and a path to secret json:
    Write next post id to secret json
    """
    try:
        with open(secret_path, "r") as f:
            secret = json.load(f)
    except Exception:
        secret = {}
    secret["nextPost"] = nextPost
    with open(secret_path, "w") as f:
        json.dump(secret, f, indent=4)

def save_total_processed(total_processed, secret_path):
    """
    Given secret json, and current total number processed:
    Write to secret json new total number processed
    """
    try:
        with open(secret_path, "r") as f:
            secret = json.load(f)
    except Exception:
        secret = {}
    secret["totalProcessed"] = total_processed
    with open(secret_path, "w") as f:
        json.dump(secret, f, indent=4)

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
    post_collection = initialize_or_setup_db()
    total_embedded = 0
    
    # Load nextTimestamp from secret.json if present
    secret_path = os.path.join(os.path.dirname(__file__), "..", "secret.json")
    secret_path = os.path.abspath(secret_path)
    try:
        with open(secret_path, "r") as f:
            secret = json.load(f)
            nextTimestamp = secret.get("nextTimestamp", None)
    except Exception:
        nextTimestamp = None

    # Start from September 18, 2024 if not present --> This date is the last date for data to be logged to this API!
    import datetime
    if not nextTimestamp:
        dt = datetime.datetime(2024, 9, 18, 0, 0)
        nextTimestamp = int(dt.timestamp())

    # Rate limit tracking
    from collections import deque
    req_minute = deque()
    req_hour = deque()

    # Saving next timestamp
    def save_next_timestamp(ts):
        try:
            with open(secret_path, "r") as f:
                secret = json.load(f)
        except Exception:
            secret = {}
        secret["nextTimestamp"] = ts
        with open(secret_path, "w") as f:
            json.dump(secret, f, indent=4)

    try:
        while True:
            now = time.time()

            """
            Rate limiting checks to make sure we don't go over provided rates:
            - Soft (15 reqs/min)
            - Hard (30 reqs/min)
            - Long Hard (1000 reqs/min)

            Sleep to reset rate limiting bucket
            """
            
            while req_minute and now - req_minute[0] > 60:
                req_minute.popleft()
            while req_hour and now - req_hour[0] > 3600:
                req_hour.popleft()

            if len(req_minute) >= 30:
                logging.info("Hard limit reached (30/min). Sleeping 60s.")
                time.sleep(60)
                continue
            elif len(req_minute) >= 15:
                logging.info("Soft limit reached (15/min). Sleeping 10s.")
                time.sleep(10)
                continue
            if len(req_hour) >= 1000:
                logging.info("Hourly limit reached (1000/hr). Sleeping 1hr.")
                time.sleep(3600)
                continue

            # PullPush API call
            url = "https://api.pullpush.io/reddit/search/submission/"
            params = {
                "subreddit": "CryptoCurrency",
                "size": 100,
                "before": int(nextTimestamp),  # get posts before this timestamp, ensure integer
                "sort": "desc",  # newest first
            }

            try:
                response = requests.get(url, params=params)
                req_minute.append(now)
                req_hour.append(now)
                response.raise_for_status()
                data = response.json()
            
            # Log any API errors, for debugging
            except requests.exceptions.RequestException as e:
                logging.error(f"API request error: {e}")
                if hasattr(e, 'response') and e.response is not None:
                    logging.error(f"API response text: {e.response.text}")
                save_next_timestamp(nextTimestamp)
                break

            posts = data.get("data", [])
            if not posts:
                logging.info("No more posts returned by PullPush API. Exiting loop.")
                save_next_timestamp(nextTimestamp)
                break

            batch_count = save_data(posts, post_collection)
            total_embedded += batch_count
            logging.info(f"Total embedded posts so far: {total_embedded}")
            save_total_processed(total_embedded, secret_path)

            # Calculate next date to get posts from
            oldest = min((p.get("created_utc", nextTimestamp) for p in posts if p.get("created_utc")), default=nextTimestamp)
            nextTimestamp = oldest - 1
            save_next_timestamp(nextTimestamp)

            # If less than 100 posts returned, prob reached end of day
            if len(posts) < 100:
                # Move to the start of the previous day and continue
                dt = datetime.datetime.utcfromtimestamp(nextTimestamp)
                prev_day = dt - datetime.timedelta(days=1)

                # Set nextTimestamp to midnight UTC of previous day
                nextTimestamp = int(datetime.datetime(prev_day.year, prev_day.month, prev_day.day, 0, 0).timestamp())
                logging.info(f"Moving to previous day: {prev_day.strftime('%Y-%m-%d')}, nextTimestamp={nextTimestamp}")
                save_next_timestamp(nextTimestamp)

                continue

    except KeyboardInterrupt:
        logging.info("Script interrupted by user. Saving nextTimestamp for recovery.")
        save_next_timestamp(nextTimestamp)
    except Exception as e:
        logging.error(f"Script stopped due to error: {e}. Saving nextTimestamp for recovery.")
        save_next_timestamp(nextTimestamp)

if __name__ == "__main__":
    main()