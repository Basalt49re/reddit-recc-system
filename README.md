```markdown
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

---

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
```