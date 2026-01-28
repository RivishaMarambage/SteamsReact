# System Architecture Overview

This document provides a high-level overview of the application's structure, covering both the organization of the code in the filesystem and the relationships between data entities in the Firestore database.

## 1. Folder Structure

The project uses a feature-oriented folder structure within a standard Next.js App Router setup. This keeps related code together and makes the system easier to navigate.

```
/
├── src/
│   ├── app/                # Next.js App Router: All pages and routes.
│   │   ├── dashboard/      # Protected routes for logged-in users.
│   │   │   ├── admin/      # Admin-specific pages (e.g., analytics, user management).
│   │   │   ├── staff/      # Staff-specific pages (e.g., order management).
│   │   │   └── ...         # Customer-specific pages (e.g., profile, order history).
│   │   ├── login/          # Login pages for different user roles.
│   │   ├── signup/         # Signup pages.
│   │   └── page.tsx        # The main public landing page.
│   │
│   ├── components/         # Reusable React components.
│   │   ├── ui/             # Core UI elements from ShadCN (Button, Card, etc.).
│   │   ├── auth/           # Components related to authentication forms.
│   │   ├── layout/         # Components for structuring pages (Header, Sidebar, Footer).
│   │   └── ...             # Other components, often grouped by feature.
│   │
│   ├── firebase/           # All Firebase configuration and integration code.
│   │   ├── firestore/      # Custom React hooks for Firestore (useDoc, useCollection).
│   │   ├── config.ts       # Firebase project configuration keys.
│   │   └── provider.tsx    # React Context provider for Firebase services.
│   │
│   ├── lib/                # Shared libraries, types, and utility functions.
│   │   ├── types.ts        # **[Very Important]** TypeScript definitions for all data entities.
│   │   ├── utils.ts        # General utility functions (e.g., `cn` for styling).
│   │   └── auth/           # Authentication-related helpers.
│   │
│   └── ai/                 # Backend logic using Genkit.
│       ├── flows/          # Secure, server-side business logic (e.g., payment processing).
│       └── genkit.ts       # Genkit initialization.
│
├── docs/                   # Project documentation.
│   ├── backend.json        # A machine-readable schema of all Firestore collections.
│   └── SYSTEM_ARCHITECTURE.md # This file.
│
└── firestore.rules         # **[Security Critical]** Rules that protect your database.
```

## 2. Data Relationships

The application's data model is designed around the relationships between users, menu items, and orders. The authoritative source for these models is `docs/backend.json`.

### Core Entities:

-   **UserProfile**: The central record for every person.
    -   It has a `role` (`customer`, `staff`, `admin`) that determines their permissions.
    -   It holds loyalty information like `loyaltyPoints` and `lifetimePoints`.
    -   It links to a `LoyaltyLevel`.

-   **Order**: Represents a customer's transaction.
    -   Belongs to one `UserProfile` via `customerId`.
    -   Contains a list of `OrderItems`, which detail what was purchased.

-   **MenuItem**: A product for sale (e.g., "Cappuccino", "Croissant").
    -   Belongs to one `Category`.
    -   Can have multiple `addonGroups` which define rules for customizations.

-   **Addon**: A specific customization (e.g., "Extra Shot", "Oat Milk").
    -   Belongs to one `AddonCategory` (e.g., "Syrups", "Milk Options").

### Supporting Entities:

-   **Category**: Organizes `MenuItems` into groups like "Coffee Classics" or "Pastries".
-   **LoyaltyLevel**: Defines the tiers of the loyalty program (e.g., Member, Bronze, Silver).
-   **DailyOffer**: Creates special, temporary discounts on specific `MenuItems` for different loyalty tiers.
-   **PointTransaction**: A log of every time a user earns or redeems points, providing a clear history.

### How They Connect (Example Flow):

1.  A **`UserProfile`** with the `customer` role places an **`Order`**.
2.  The **`Order`** consists of several **`OrderItem`**s.
3.  One **`OrderItem`** might be for a "Latte" **`MenuItem`**.
4.  The customer customizes it by selecting an "Oat Milk" **`Addon`**.
5.  This is allowed because the "Latte" `MenuItem` has an `addonGroup` for the "Milk Options" `AddonCategory`.
6.  The customer might use a **`DailyOffer`** that gives their **`LoyaltyLevel`** a discount on lattes.
7.  When the order is completed, the `pointsToEarn` are added to the user's `loyaltyPoints`, and a `PointTransaction` record is created.
