# Application Architecture Overview

This document provides an overview of the backend architecture for the Steamsbury loyalty application. The system is built entirely on the **Firebase platform**, leveraging its integrated services to provide a scalable and secure "serverless" backend.

The architecture can be broken down into the following key components:

### 1. Frontend & Hosting

*   **Framework**: The application is a [Next.js](https://nextjs.org/) app, utilizing React Server Components and Client Components for a modern, performant user experience.
*   **Hosting**: The entire Next.js application is deployed and served using [**Firebase App Hosting**](https://firebase.google.com/docs/hosting). This provides a secure, fast, and globally distributed CDN for the frontend assets.

### 2. Database (Data Storage)

*   **Service**: [**Cloud Firestore**](https://firebase.google.com/docs/firestore) is used as the primary database. It's a flexible, scalable NoSQL document database that stores all application data.
*   **Data Model**: The structure of the data is defined in `docs/backend.json`. This file acts as a blueprint for all data entities, such as `UserProfile`, `Order`, `MenuItem`, etc.
*   **Interaction**: The Next.js application communicates directly with Firestore using the **Firebase client-side SDK**. Data is fetched in real-time within React components using custom hooks like `useDoc` and `useCollection`.

### 3. Authentication (User Management)

*   **Service**: [**Firebase Authentication**](https://firebase.google.com/docs/auth) handles all user identity and access management.
*   **Providers**: The app is configured to support sign-in via Email/Password and Google Sign-In, as defined in `docs/backend.json`.
*   **Integration**: When a user signs up or logs in, Firebase Authentication creates a user record. This record's unique ID (`uid`) is used as the key for the user's profile document in the `/users/{userId}` collection in Firestore, linking the authentication record to the database record.

### 4. Security & Authorization

*   **Service**: [**Firestore Security Rules**](https://firebase.google.com/docs/firestore/security/get-started) are the backbone of the application's security model.
*   **Implementation**: The rules are defined in the `firestore.rules` file. These rules live on the Firebase servers and are automatically enforced for every read, write, update, and delete operation.
*   **Logic**: The rules ensure that:
    *   Users can only read or write their own data (e.g., a customer can only see their own orders).
    *   Specific roles (like `staff` or `admin`, stored in the user's profile) are granted broader permissions (e.g., an `admin` can edit the menu).

### 5. Server-Side Logic (Business Logic)

*   **Service**: [**Cloud Functions for Firebase**](https://firebase.google.com/docs/functions) is the designated service for running custom backend code in response to events or HTTP requests.
*   **Usage**: While much of the app's logic is handled by security rules and direct client-to-database interaction, Cloud Functions are essential for more complex operations that require elevated privileges or interaction with third-party APIs.
*   **Example**: The conceptual guide for social media verification (`src/lib/social-verification-guide.md`) outlines a perfect use case for Cloud Functions: securely handling API keys and OAuth flows, which cannot be done on the client.

---

## Diagrammatic Flow

```
[User's Browser] <--> [Next.js App (Firebase Hosting)]
       |
       | (Firebase SDK)
       |
       +----------------> [Firebase Authentication] (Handles Login/Signup)
       |
       +----------------> [Cloud Firestore] (Reads/Writes Data)
                           ^
                           | (Rules are enforced here)
                           |
                         [firestore.rules]
```

This serverless architecture minimizes the need for managing traditional backend servers, allowing for rapid development and automatic scaling provided by Google's infrastructure.
