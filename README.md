# LifeLink – Intelligent Blood Donation Finder

**LifeLink** is a next-generation, ethical, and AI-powered platform designed to connect blood patients with verified donors in real-time during emergencies. Unlike traditional directories, LifeLink acts as an intelligent coordinator, ensuring speed, trust, and privacy.

---

## 🚀 Key Features

### 1. 🧠 AI-Powered Smart Matching (Gemini)
*   Uses **Google Gemini AI** to intelligently rank and match donors based on location, blood type compatibility, and availability.
*   Minimizes broadcast noise by targeting only the most relevant donors.

### 2. 🛡️ Verified Trust & Safety
*   **DigiLocker Integration**: Donors can verify their identity using government-issued documents.
*   **Manual Verification**: Robust fallback for manual admin verification ensuring a safe community.
*   **Privacy First**: Contact details are protected; communication happens via the secure in-app platform.

### 3. 💬 Real-Time Coordination
*   **Instant Chat**: Secure, in-app messaging between patients and donors.
*   **Live Location Sharing**: Coordinate meetups efficiently with integrated location services.

### 4. 📍 Live Tracking
*   Track the status of your request and the location of the matched donor in real-time (similar to ride-sharing apps) to reduce panic during emergencies.

### 5. 👥 Role-Based Dashboards
*   **Patient Dashboard**: Request blood, manage requests, and track donors.
*   **Donor Dashboard**: Receive alerts, manage availability, and view matched requests.
*   **Admin Dashboard**: Oversee platform activity and handle verification requests.

---

## 🔄 User Flow: How to Use LifeLink

### Step 1: Registration & Role Selection
*   **Sign Up**: Create an account securely.
*   **Choose Role**: Select whether you are a **Donor** (willing to give blood) or a **Patient** (need blood).

### Step 2: For Donors (The Heroes)
1.  **Complete Profile**: Fill in health details (Blood Group, Weight, etc.).
2.  **Verify Identity**: Use the "Verify Profile" feature (DigiLocker or Manual) to get a verified badge. Verified donors are ranked higher.
3.  **Receive Alerts**: When a patient near you needs blood, you'll receive an instant notification.
4.  **Accept & Connect**: Accept the request and use the chat to coordinate with the patient.

### Step 3: For Patients (Emergency Mode)
1.  **Create Request**: Submit a blood request specifying blood type, urgency, and hospital location.
2.  **AI Matching**: LifeLink's AI scans for the best nearby donors.
3.  **Track & Chat**: Once a donor accepts, track their arrival and communicate directly via the app.

---

## 💡 How is LifeLink Different?

| Feature | ❌ Traditional Apps | ✅ LifeLink |
| :--- | :--- | :--- |
| **Matching** | Static directory search (often outdated) | **AI-Driven Smart Matching** (Real-time & Context-aware) |
| **Privacy** | Publicly exposes phone numbers (spam risk) | **Secure Proxy Messaging** (Numbers hidden) |
| **Speed** | Manual calling from a list | **Instant Push Notifications** to relevant donors |
| **Trust** | No verification layers | **DigiLocker & Admin Verification** |
| **Experience** |Basic forms | **Real-time Tracking & Modern UI** |

---

## 🛠️ Technology Stack
*   **Frontend**: React + Vite + Tailwind CSS (Glassmorphism & Modern UI)
*   **Backend**: Firebase (Auth, Firestore, Cloud Functions)
*   **AI**: Google Gemini (via Model Context Protocol)
