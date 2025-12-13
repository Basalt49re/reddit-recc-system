# Warning:
- Local runs and access on the official webpage can take up to 1-2 minutes before an actual response is received on the frontend!

# Start Up & Run Up Checklist (Local Development)

## Installation

Ensure all the following Python packages are installed (usually via `pip`):

- `chromadb` (version **1.3.5**, must be installed via pip)
- `sentence-transformers`
- `flask`
- `flask-cors`
- `gunicorn`

**Assumptions:**
- You are using **conda environments** for dependency management.
- **All dependencies are already installed** in the respective environments.
- Port **8000** is **not** in use by another process.

**Notes:**
- If you plan to run this locally you'll need to change the **API ENDPOINT** in App.jsx to point to the search route in the backend, if it's already configured to do that then don't worry.
- If you do run the data-grabber.py
    - It will create another /data folder in the current /data folder with the sqlite3 database (i.e. /data/data/chroma.sqlite3), if this happens simply move it to the /data folder so that the backend for the application can utilize it.
    - The data-grabber.py script has a tendency to time out (because we are using a real API that can time out), so be prepared for it to stop as it gets to high number of posts embedded (typically around 10k to 30k).
---

## Run Up (Data grabber)
1. Open a **separate, fresh terminal**.
2. **Activate** the (possibly same) conda environment:
    ```bash
    conda activate your_environment_name
    ```
3. **Install libraries needed in requirements.txt**
4. **Change directory** to the data folder:
    ```bash
    cd data
    ```
5. **Run data-grabber.py**
    ```
    python3 data-grabber.py
    ```
6. **If crash occurs in the script**
        - You can rerun it again as it will start from the date where the crash occured, preventing duplicate posts from being sent into the database.


## Start Up (Frontend)

1. Open a new terminal and **activate your conda environment**:
    ```bash
    conda activate your_environment_name
    ```
2. **Change directory** to the frontend:
    ```bash
    cd reddit-recc-system/frontendrec
    ```
3. **Start the frontend development server**:
    ```bash
    npm run dev
    ```

---

## Run Up (Backend)

1. Open a **separate, fresh terminal**.
2. **Activate* the (possibly same) conda environment:
    ```bash
    conda activate your_environment_name
    ```
3. **Change directory** to the project root:
    ```bash
    cd reddit-recc-system
    ```
4. **Start the backend server**:
    ```bash
    python backend.py
    ```
5. **Wait 10 seconds** for the backend to initialize.
6. **Access the frontend** in your browser:
    ```
    http://localhost:5173
    ```
7. **Query a request** via the frontend interface.

---

## Summary Checklist

- [ ] All dependencies installed (see above)
- [ ] Frontend running (`npm run dev`)
- [ ] Backend running (`python backend.py`)
- [ ] Access frontend at [localhost:5173](http://localhost:5173)