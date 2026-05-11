# LifeLink – Intelligent Blood Donation Finder
**LifeLink** is a next-generation, ethical, and AI-powered platform designed to connect blood patients with verified donors in real-time during emergencies. Unlike traditional directories, LifeLink acts as an intelligent coordinator, ensuring speed, trust, and privacy.

<<<<<<< HEAD
---

## 🏗️ Architecture Overview
- **Frontend:** React + Vite, TailwindCSS, Framer Motion for animations.
- **Backend/DB:** Firebase Authentication, Firestore (Real-time Database).
- **Automation/Alerts:** n8n Webhook integration for WhatsApp/Twilio alerts.
- **AI Integration:** Google Gemini API for donor matching context/analysis.
- **Routing:** React Router DOM with protected role-based access.

---

## 👥 User Roles & Workflow Interaction

### 1. Onboarding & Registration
- Users log in/sign up using Firebase Auth.
- Users are prompted to select a role: **Donor**, **Patient**, or **Admin**.
- The system enforces **Profile Completion** (Name, Blood Group, Age, Weight, WhatsApp Number, Gender, and Location) before unlocking dashboard access.

### 2. Patient Workflow (Requester)
1. **Dashboard:** Navigates to the Patient Dashboard (`/patient-dashboard`).
2. **Requesting:** Clicks "Initialize Request" to specify the required Blood Group, Urgency, Hospital Name, and Additional Notes.
3. **Broadcasting:** The request is broadcasted to the network. An n8n webhook automatically fires to notify matching donors off-platform (e.g., via WhatsApp).
4. **Matching:** Patients view real-time matched donors nearby. They can use the **Gemini AI Auto-match** feature to get an intelligent strategy based on distance and compatibility.
5. **Direct Requesting:** Patients can manually "ping/request" specific donors from the matched list.
6. **Communication:** Once a donor accepts, the patient enters a dedicated **Chat/Mission** view (`/chat/:requestId`) to communicate directly.
7. **Completion:** Upon successful blood transfer, the patient clicks "Received" which completes the request and updates the donor's impact score.

### 3. Donor Workflow (Responder)
1. **Dashboard:** Navigates to the Donor Dashboard (`/donor-dashboard`).
2. **Eligibility Engine:** The system checks the `lastDonated` timestamp and Gender. Donors enter a "Bio-Replenishment" phase (90 days for men, 120 days for women) where they cannot donate. 
3. **Broadcasting:** If eligible, they can toggle their status to **Live** (Available), broadcasting their location to nearby patients.
4. **Responding:** They view live, urgent requests nearby. If their blood group is compatible, they can click "Respond", give consent, and accept the mission.
5. **Execution:** Entering the Mission View, they can chat with the patient and potentially share live location.
6. **Post-Donation:** Once marked complete by the patient, the donor's `livesSaved` counter increments, and they are automatically switched back to the recovery/ineligible phase.

### 4. Admin Workflow (Blood Bank Manager)
1. **Dashboard:** Navigates to the Admin Dashboard (`/admin-dashboard`).
2. **Donor Management:** Admins can view, search, and manage the entire network of registered donors, viewing critical stats (Age, Weight, WhatsApp, Lives Saved).
3. **Stock Fulfillment:** Admins can intercept requests and fulfill them directly from the Blood Bank stock.
4. **Pickup Verification:** When fulfilling a request, a secure **Pickup Code** is generated. When the patient arrives, the Admin verifies this code to complete the transaction and deduct stock.

---

## ✨ Features Already Implemented
- **Firebase Auth & Firestore:** Real-time listeners updating the DOM seamlessly.
- **Dynamic Routing & Role Protection:** Secure routes requiring specific user roles.
- **Automated Eligibility Engine:** Calculates the recovery percentage based on days since last donation.
- **AI Donor Matching:** Integrates Gemini to analyze and suggest the best immediate donors.
- **N8N Alert Integration:** Fires a webhook payload containing donor data to trigger external notifications.
- **Real-Time Live Chat:** Sub-collections in Firestore enabling Donor-Patient direct messaging.
- **Live Location Proximity:** Calculates distance between the patient's needed location and active donors.
- **Auto-Healing Sync mechanism:** Synchronizes `users` and `donars` collections, automatically healing eligibility mismatch statuses.
- **Multi-Role Support:** Isolated experiences for Donors, Patients, and Admins.
- **Admin Stock Management & Secure Code Pickup:** Securely reserves blood and generates a 6-digit OTP for patient pickup.

---

## 🛠️ Edge Cases to Consider (Next Steps)
*(Use this section to outline the edge cases you plan to work on next)*

- **Location Denials:** Enhancing fallback workflows when a user totally denies geolocation access.
- **Request Timeouts:** What happens to a request that stays "Pending" for >24 hours?
- **Donor No-Shows:** Workflow for when a Donor "Accepts" but fails to arrive (Cancel/Re-broadcast).
- **Concurrent Accepts:** Preventing two donors from simultaneously accepting a single-unit request.
- **Malicious/Spam Requests:** Rate-limiting the Patient's ability to initialize requests.

---
=======

>>>>>>> 0240e93e04d6a610750e0ef3e95f6966a027361d

## 💻 Getting Started (Run Locally)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory.
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run the Development Server
```bash
npm run dev
```
