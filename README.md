# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Folder Structure

Here is an overview of the project's folder structure:

\`\`\`
/
├── public/                 # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                # Next.js App Router: Pages and layouts
│   │   ├── (auth)/         # Route group for auth pages
│   │   ├── dashboard/      # Protected dashboard routes
│   │   │   ├── admin/      # Admin-specific dashboard pages
│   │   │   ├── staff/      # Staff-specific dashboard pages
│   │   │   └── ...         # Customer dashboard pages
│   │   ├── api/            # API routes (if any)
│   │   ├── globals.css     # Global styles and Tailwind directives
│   │   ├── layout.tsx      # Root layout for the entire application
│   │   └── page.tsx        # The main landing page
│   ├── components/         # Reusable React components
│   │   ├── ui/             # ShadCN UI components (Button, Card, etc.)
│   │   ├── auth/           # Authentication-related components
│   │   ├── layout/         # Layout components (header, sidebar)
│   │   └── ...             # Other shared or specific components
│   ├── firebase/           # Firebase configuration and hooks
│   │   ├── firestore/      # Custom hooks for Firestore (useDoc, useCollection)
│   │   ├── client-provider.tsx # Client-side Firebase provider
│   │   ├── config.ts       # Firebase project configuration
│   │   ├── index.ts        # Main export file for Firebase utilities
│   │   └── provider.tsx    # Core Firebase context provider
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Shared libraries, types, and utilities
│   │   ├── data.ts         # Mock data and constants
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── utils.ts        # Utility functions (e.g., cn for classnames)
│   └── ai/                 # Genkit AI flows and configuration
│       └── genkit.ts       # Genkit initialization
├── package.json            # Project dependencies and scripts
└── tailwind.config.ts      # Tailwind CSS configuration
\`\`\`

To get started, take a look at src/app/page.tsx.
