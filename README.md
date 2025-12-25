# LifeLink – Intelligent Blood Donation Finder

**LifeLink** is a next-generation, ethical, and AI-powered platform designed to connect blood patients with verified donors in real-time during emergencies. Unlike traditional directories, LifeLink acts as an intelligent coordinator, ensuring speed, trust, and privacy.

## 💻 Getting Started (Run Locally)

Follow these steps to set up and run the project strictly for development.

### Prerequisites
*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn**
*   **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/LifeLink.git
cd LifeLink
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory. You will need your Firebase configuration keys and Google Gemini API key.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
### 4. Run the Development Server*(inside src folder)
```bash
npm run dev
```
The app should now be running at `http://localhost:5173`.

### 5. Build for Production
To create a production build:
```bash
npm run build
```
