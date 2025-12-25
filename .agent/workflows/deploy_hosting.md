---
description: Deploy the application to Firebase Hosting
---

This workflow guides you through deploying your React application to Firebase Hosting.

1.  **Build the Application**
    Create the production build of your Vite/React app.
    ```cmd
    npm run build
    ```

2.  **Install Firebase Tools (if not already installed)**
    ```cmd
    npm install -g firebase-tools
    ```

3.  **Login to Firebase**
    This will open your browser to authenticate.
    ```cmd
    firebase login
    ```

4.  **Initialize Hosting**
    Run this command in your project root.
    ```cmd
    firebase init hosting
    ```
    **Select the following options when prompted:**
    *   **Project Setup**: Select **"Use an existing project"** (Use arrow keys to move, Enter to select).
    *   **Select Project**: Choose your current project ID from the list (the same one you use for Firestore/Auth).
    *   **What do you want to use as your public directory?** `dist`
        *(Vite builds to `dist` by default, not `public`)*
    *   **Configure as a single-page app (rewrite all urls to /index.html)?** `Yes`
        *(Crucial for React Router to work)*
    *   **Set up automatic builds and deploys with GitHub?** `No` (for now)
    *   **File dist/index.html already exists. Overwrite?** `No`
        *(Do not overwrite your built file)*

5.  **Deploy**
    Push your `dist` folder to the web.
    ```cmd
    firebase deploy
    ```

6.  **Success!**
    The terminal will show a **Hosting URL** (e.g., `https://your-project.web.app`). Click it to view your live app.
