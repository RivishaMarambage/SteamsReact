# Security Audit & Vulnerability Assessment (Prototype)

This document provides a summary of the security architecture for the Steamsbury application and identifies areas where production-grade enhancements are required.

## 1. Executive Summary
The application is currently in a **Prototype/MVP** state. While it utilizes industry-standard tools (Firebase Authentication, Firestore Security Rules, Next.js Server Actions), certain business logic is handled on the client-side for rapid development. This introduces specific vulnerabilities that must be addressed before a full public launch.

## 2. Identified Vulnerabilities & Risks

### [HIGH] Client-Side Point Awarding & State Synchronization
- **Location**: `src/app/dashboard/order-success/page.tsx`
- **Description**: Loyalty points are calculated and awarded directly from the browser after a successful redirect from the payment gateway.
- **Risk**: A sophisticated user could intercept the network request or manually trigger the Firestore update to award themselves points without completing a transaction.
- **Production Fix**: Implement **Firebase Cloud Functions** triggered by an HTTPS Webhook from the payment gateway. All point calculations and balance updates must occur in a secure, server-side environment.

### [MEDIUM] Incomplete User Deletion
- **Location**: `src/components/admin/UserManagementTable.tsx`
- **Description**: The "Delete User" function in the admin panel removes the Firestore document but does not delete the user's account from Firebase Authentication.
- **Risk**: Orphaned Auth records remain in the system, potentially allowing a user to log back in without a profile, leading to UI crashes or inconsistent states.
- **Production Fix**: Use the **Firebase Admin SDK** within a Server Action or Cloud Function to perform an atomic deletion of both the Auth record and the Firestore data.

### [LOW] Public Read Access on Menu Items
- **Location**: `firestore.rules`
- **Description**: The entire menu is publicly readable to allow guest browsing.
- **Risk**: Scrapers can easily download your entire price list and catalog.
- **Status**: Accepted risk for a public-facing cafe website to ensure SEO and ease of access.

## 3. Implemented Security Controls

### Role-Based Access Control (RBAC)
The application enforces strict role separation (`customer`, `staff`, `admin`). This is verified via Firestore rules by checking the `role` field in the user's private profile.

### Firestore Security Rules
- **Path-Based Ownership**: Users can only read and write to their own `/users/{userId}` and `/users/{userId}/orders` paths.
- **Protected Keys**: Rules prevent users from modifying their own `role` or `loyaltyLevelId` fields, even if they have "update" access to their profile.

### Secret Management
The `GENIE_API_KEY` is stored in server-side environment variables and is never transmitted to the client browser. All payment interactions occur via `src/ai/flows/payment-flow.ts` (Server Component).

## 4. Recommendations for Production
1. **Move all Mutations to Server Actions**: Ensure that critical logic (order status changes, point redemptions) is validated on the server before hitting the database.
2. **Enable App Check**: Use Firebase App Check to protect your backend services from unauthorized traffic and bots.
3. **Audit Log**: Maintain a dedicated `system_logs` collection to track administrative actions (role changes, menu edits) for accountability.
