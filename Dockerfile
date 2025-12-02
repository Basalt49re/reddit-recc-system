FROM python:3.10-slim

# Install Node.js for frontend build, remove build tools after
RUN apt-get update && \
    apt-get install -y curl build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend
COPY backend.py requirements.txt ./
COPY data ./data
RUN mkdir -p db
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Frontend
COPY frontendrec ./frontendrec
WORKDIR /app/frontendrec
RUN npm ci && npx vite build

# Move built frontend to backend static folder
WORKDIR /app
RUN mkdir -p static && cp -r frontendrec/dist/* static/

# Remove node_modules and frontend build tools to minimize image size
RUN rm -rf /app/frontendrec/node_modules /app/frontendrec/package-lock.json

# SQLite DB will be stored in /app/db/reddit.db
# When running the container, mount a volume:
EXPOSE 8000

# Use gunicorn for production backendn -v reddit-db:/app/db -p 8000:8000 your-image
CMD ["gunicorn", "backend:app", "-b", "0.0.0.0:8000", "--workers=2", "--threads=4", "--timeout=60"]
