# Guide to Implementing Social Media Verification

You're taking on a challenging but powerful feature! Verifying social media actions (like follows or reviews) requires a secure backend component to handle authentication and API calls. This guide provides a high-level overview of the steps involved.

**This is a complex task that goes beyond simple client-side code.** The current app uses client-side logic, but this feature requires a backend.

## Core Architecture

1.  **Backend Environment**: You'll need a secure server to store API keys and manage user authentication tokens. **Cloud Functions for Firebase** is an excellent choice for this.
2.  **Developer Accounts**: For each platform you want to integrate (Google, Facebook, etc.), you must create a developer account to get API credentials (Client ID and Client Secret).
3.  **OAuth 2.0 Flow**: This is the standard protocol for this kind of verification. The flow generally looks like this:
    a. **User Consent**: The user clicks a "Connect with [Platform]" button in your app.
    b. **Redirect to Platform**: Your app redirects the user to the platform's login and consent screen.
    c. **Grant Permission**: The user logs in and grants your app permission to access their information.
    d. **Authorization Code**: The platform redirects back to your app with a temporary `authorization code`.
    e. **Token Exchange**: Your **backend (Cloud Function)** securely sends this `code` along with your secret API credentials to the platform.
    f. **Access Token**: The platform returns an `access token`. Your backend must securely store this token, associating it with the user's profile.
4.  **API Verification**: Your backend can now use the `access token` to make API calls to the platform to check for the desired action (e.g., check for a review).
5.  **Award Points**: If the action is verified, your backend updates the user's document in Firestore to award the points.

---

## Conceptual Example: Verifying a Google Review

This is a simplified example. **Note**: The Google My Business API has strict limitations, and directly verifying *who* left a review is often not possible due to user privacy. This is for illustrative purposes.

### 1. Client-Side (React Component)

You would add a button to your `WalletPage`.

```jsx
// In src/app/dashboard/wallet/page.tsx

// This function would redirect the user to your backend endpoint
const handleConnectGoogle = () => {
  // The user's ID is needed to link the token later
  const userId = authUser?.uid;
  // This would be a Cloud Function URL
  window.location.href = `https://your-cloud-function-region-project.cloudfunctions.net/googleAuthStart?userId=${userId}`;
};

<Button onClick={handleConnectGoogle}>
  Connect Google to Verify Review
</Button>
```

### 2. Backend (Cloud Function - e.g., `googleAuth.ts`)

You would need several Cloud Functions.

**Function 1: `googleAuthStart` (HTTP Trigger)**
-   Generates the Google OAuth consent URL.
-   Redirects the user to that URL.

```typescript
//
// THIS IS CONCEPTUAL PSEUDO-CODE
//
import {google} from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://your-cloud-function-region-project.cloudfunctions.net/googleAuthCallback" // Redirect URI
);

export const googleAuthStart = https.onRequest((request, response) => {
  // You'd need to store the userId to link the account later
  const userId = request.query.userId;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/business.manage'], // Example scope
    state: userId, // Pass the user ID through the state
  });
  response.redirect(url);
});
```

**Function 2: `googleAuthCallback` (HTTP Trigger)**
-   Handles the redirect back from Google.
-   Exchanges the `authorization code` for an `access token`.
-   Saves the token securely, linked to the `userId`.

```typescript
//
// THIS IS CONCEPTUAL PSEUDO-CODE
//
export const googleAuthCallback = https.onRequest(async (request, response) => {
  const code = request.query.code;
  const userId = request.query.state; // Retrieve the user ID

  const {tokens} = await oauth2Client.getToken(code);
  
  // Securely save tokens (e.g., in a separate, restricted Firestore collection)
  // IMPORTANT: This collection MUST have strict security rules.
  await firestore.collection('user_tokens').doc(userId).set({
    google: tokens,
  });

  // Redirect user back to the wallet page
  response.redirect('/dashboard/wallet?status=google-linked');
});
```

**Function 3: `verifyReview` (Callable Function)**
-   The client calls this function to trigger the check.
-   The function retrieves the user's stored token, calls the Google API, and updates Firestore.

```typescript
//
// THIS IS CONCEPTUAL PSEUDO-CODE
//
export const verifyGoogleReview = https.onCall(async (data, context) => {
  const userId = context.auth.uid;

  // 1. Get user's stored token
  const tokenDoc = await firestore.collection('user_tokens').doc(userId).get();
  const tokens = tokenDoc.data().google;

  // 2. Refresh client and call Google API
  oauth2Client.setCredentials(tokens);
  // ... code to call Google My Business API ...
  // const hasReviewed = await checkGoogleApiForReview(oauth2Client);

  // 3. If verified, update Firestore
  if (hasReviewed) {
    await firestore.collection('users').doc(userId).update({ hasLeftReview: true });
    // ... code to award points ...
    return { success: true };
  } else {
    return { success: false, message: "No review found." };
  }
});
```

## Important Considerations

*   **Security**: Never expose your API Client Secrets or user access tokens on the client-side. They **must** be handled by a secure backend.
*   **Privacy & API Limits**: Most platforms have very strict privacy policies. Verifying an action like "following a page" is often impossible because platforms don't want to expose user activity. You must carefully read the API documentation for each platform to see what is possible.
*   **Cost**: Using Cloud Functions and external APIs can incur costs.

This is a significant project, but hopefully, this guide gives you a clear roadmap of the required steps. Good luck!
