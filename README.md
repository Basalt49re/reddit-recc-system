
## Setup & Usage

### Backend

1. **Install dependencies**  
   - Using Conda or pip:  
     ```
     conda install --file requirements.txt
     ```
     or  
     ```
     pip install -r requirements.txt
     ```
   - Ensure Python 3.9 or higher is used.

2. **Initialize the database**  
   - Navigate to the `data` folder and run:
     ```
     python data-grabber.py
     ```
   - This will fetch posts from r/Cryptocurrency and store them in SQLite.

3. **Start the backend server**  
   - Run:
     ```
     python backend.py
     ```

### Frontend

1. **Install Node.js and npm**  
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install Vite and React plugin**  
   - In the `frontendrec` folder, run:
     ```
     npm install
     npm install vite
     npm install @vitejs/plugin-react
     ```

3. **Start the frontend**  
   - Run:
     ```
     npm run dev
     ```
   - The app will be available at `http://localhost:5173` (default Vite port).

## API Endpoints
**/search**
  - Takes in:
    - A query argument (i.e. "doge", "ethereum", "bitcoin") --> string
    - A number of recommendations argument --> integer
  - Returns:
    - The original query --> string
    - Total number of results --> integer
    - Posts --> List of dictionaries
  - This route is the main route that allows us to send posts to the frontend and recommend posts to users!
