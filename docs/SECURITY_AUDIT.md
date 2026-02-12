# Security Audit & Vulnerability Assessment

This document provides a summary of the security architecture for the Steamsbury application and identifies areas where production-grade enhancements have been applied or are required.

## 1. Executive Summary
The application has been hardened from a basic prototype to an **Advanced MVP**. While core business logic (point awarding) remains on the client-side for architectural consistency, **Firestore Security Rules** have been implemented to mitigate unauthorized role escalation and arbitrary data modification.

## 2. Identified Vulnerabilities & Mitigations

### [MEDIUM] Client-Side Point Awarding & State Synchronization
- **Risk**: A user could manually trigger Firestore updates to award themselves points.
- **Status**: **PARTIALLY MITIGATED**.
- **Mitigation**: Firestore rules now verify that user profiles cannot have their `role` or `loyaltyLevelId` escalated by the owner. Point transactions are now restricted to `create-only`, preventing manipulation of the audit trail.
- **Production Fix**: Transition to **Firebase Cloud Functions** for all balance-altering logic.

### [LOW] Orphaned Auth Records
- **Risk**: Deleting a user in the Admin Dashboard removes the Firestore document but leaves the Auth record.
- **Status**: **MONITORED**.
- **Mitigation**: The Admin UI now includes a warning clarifying that "Delete" only removes database records.
- **Production Fix**: Implement a Server Action using `firebase-admin` to perform atomic deletions.

## 3. Implemented Security Controls

### Role-Based Access Control (RBAC)
- Strict enforcement of `customer`, `staff`, and `admin` roles.
- Admins are the only users capable of modifying roles or system-wide settings (menu, categories).

### Hardened Firestore Rules
- **Path-Based Ownership**: Standardized across `/users/{userId}`, `/users/{userId}/orders`, and `/users/{userId}/point_transactions`.
- **Key-Level Protection**: Owners are explicitly blocked from modifying restricted keys (`role`, `loyaltyLevelId`) via `affectedKeys()` validation.
- **Listing Protection**: Public listing of the `/users` collection is disabled. Only authorized staff can view the full directory.

## 4. Production Roadmap
1. **Enable App Check**: Protect backend services from unauthorized non-browser traffic.
2. **Move Mutations to Server**: Shift point balance logic from `OrderSuccess` to a secure Server Action or Cloud Function.
3. **Audit Logging**: Implement a dedicated `system_logs` collection to track administrative changes.