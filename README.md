# ✨ DiaSync: Your Smart Companion for Diabetes Management ✨

---

Welcome to **DiaSync**! This isn't just another health app; it's your personalized assistant designed to make managing diabetes simpler, smarter, and more insightful. Track your health, understand your trends, and even chat with an intelligent AI that knows *your* data.

---

## 🌟 Features That Make a Difference

* **🔐 Secure Authentication**: Your health data is personal. We keep it safe with robust user registration and login.
* **🩸 Intuitive Glucose Monitoring**:
    * Effortlessly log your blood sugar readings.
    * See instant insights into your average glucose and time-in-range percentages.
    * Visualize your glucose trends with dynamic, easy-to-read charts.
* **🍽️ Smart Meal Tracking**:
    * Record what you eat and the carbohydrate content.
    * Build a comprehensive dietary history to understand how food impacts your levels.
* **💉 Precise Insulin Logging**:
    * Log every insulin dose, including type and units.
    * Maintain an accurate record of your medication regimen.
* **📈 Insightful Reports**:
    * Generate clear, concise monthly reports to spot patterns and progress.
    * Easily export your data to share with your doctor or diabetes educator, empowering informed discussions.
* **👤 Personalized Profile**: Tailor your experience by managing your personal details and setting your unique target glucose ranges.
* **🤖 AI Chatbot — Your Data-Aware Assistant**:
    * Ask questions like, "What was my average glucose yesterday?" or "Tell me about my recent meals."
    * Our chatbot processes *your* actual glucose, meal, and insulin data to provide personalized, contextual responses and helpful advice. No more generic answers!

---

## 🚀 Built with Cutting-Edge Tech

### Frontend Prowess

* **React**: Crafting a fluid and responsive user experience.
* **React Router DOM**: Seamless navigation between all your health insights.
* **Chart.js with React-Chartjs-2**: Turning complex data into beautiful, actionable charts.
* **date-fns**: Handling all date and time magic with ease.
* **Lucide React**: Crisp, modern icons for a delightful interface.
* **Tailwind CSS**: Rapidly styling a sleek and intuitive design.
* **Axios**: Powering smooth communication with the backend.

### Backend Brilliance

* **Node.js & Express.js**: A robust and scalable server foundation.
* **MongoDB & Mongoose**: Securely storing and managing your health records.
* **JWT & bcryptjs**: Ensuring your data remains private and secure.
* **CORS**: Enabling secure communication between your frontend and backend.
* **dotenv**: Keeping sensitive configurations safe and sound.
* **Google Generative AI (Gemini API)**: The intelligent core of our contextual chatbot, delivering smart and helpful responses.

---

## 🛠️ Get DiaSync Up and Running!

Ready to take control of your diabetes? Follow these simple steps to set up DiaSync on your local machine.

### Prerequisites

Before you begin, make sure you have:

* **Node.js** (LTS version recommended)
* **npm** or **Yarn**
* A **MongoDB** instance (local or cloud-hosted like MongoDB Atlas)
* A **Google Cloud Project** with the **Gemini API enabled** and your shiny new **API Key**.

### Installation Steps

1.  **Clone the Magic!**

    ```bash
    git clone <repository_url> # Replace with your repo URL
    cd diasync
    ```

2.  **Backend Setup (The Brains)**

    Navigate into the `backend` directory:

    ```bash
    cd backend
    npm install # or yarn install
    ```

    Now, create a file named `.env` in the `backend` directory and fill it with your credentials:

    ```env
    MONGO_URI="your_mongodb_connection_string"
    JWT_SECRET="a_super_secret_key_for_jwt_security"
    GEMINI_API_KEY="your_google_gemini_api_key_here"
    NODE_ENV=development # Set to 'production' for deployment
    FRONTEND_URL="http://localhost:5173" # Or your production frontend URL
    ```

    * Remember to replace the placeholder values with your actual connection strings and keys!

3.  **Frontend Setup (The Beauty)**

    Hop back to the main `diasync` directory, then dive into `frontend`:

    ```bash
    cd ../ # If you are still in backend
    cd frontend
    npm install # or yarn install
    ```

    Create another `.env` file in the `frontend` directory:

    ```env
    VITE_BACKEND_URL="http://localhost:5000" # Important for connecting to your local backend
    # If using Create React App, it would be REACT_APP_BACKEND_URL="http://localhost:5000"
    ```

---

## ▶️ Let's Get It Running!

1.  **Fire Up the Backend!**

    From the `backend` directory, run:

    ```bash
    npm start # Or use 'node index.js'
    ```

    You'll see a message indicating the server is happily running on `http://localhost:5000`.

2.  **Launch the Frontend!**

    From the `frontend` directory, kick off the development server:

    ```bash
    npm run dev # For Vite projects
    # Or 'npm start' if you used Create React App
    ```

    Your browser should automatically open to `http://localhost:5173`, and you'll be greeted by DiaSync!

---

## 📂 Project At a Glance
https://diasync.netlify.app/
