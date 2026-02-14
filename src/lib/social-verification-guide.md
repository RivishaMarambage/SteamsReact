
# Guide to Implementing Real Social & Review Verification

In this prototype, we use "one-click" simulation buttons to award points. In a production environment, you must use secure backend integrations to verify these actions actually took place.

## 1. Refer a Friend
**How it works:**
The validation happens at the *signup* stage of the new user.
1. New User signs up and enters a `referralCode`.
2. A Cloud Function or Client logic queries the `users` collection where `referralCode == input`.
3. If found, it awards points to the owner of the code AND the new user.

**The Current Implementation:**
We've added a "Redeem a Code" box in the Wallet. It searches for the code in Firestore and awards points to both parties if the code is valid and hasn't been used by this user before.

## 2. Link Social Media
**How it works (Real-World):**
This requires **OAuth 2.0**.
1. Use Firebase Auth to link additional providers (e.g., `linkWithPopup(auth.currentUser, new FacebookAuthProvider())`).
2. Once the account is linked, Firebase Auth provides an Access Token.
3. Your backend (Cloud Function) uses this token to call the Meta Graph API to verify the user has followed your page.

**The Current Implementation:**
We simulate the "Successful Link" by awarding points when the button is clicked, assuming the OAuth flow was successful.

## 3. Leave a Google Review
**How it works (The Challenge):**
Google does not easily allow you to see *who* left a review via public API for privacy reasons. 
**Common solutions used by cafes:**
- **Screenshot Verification:** User uploads a screenshot. Staff verifies it in the Admin Dashboard.
- **Review Service:** Use a third-party service like *Trustpilot* or *Yotpo* which provides a webhook to your app when a user leaves a review.
- **Trust-Based Prototype:** Award points when the user clicks the "Go to Google" link, assuming they will follow through.

---

### Security Note
Always award points through a **Firestore Transaction** or **Cloud Function** to ensure the balance is updated atomically and cannot be "gamed" by repeating requests.
