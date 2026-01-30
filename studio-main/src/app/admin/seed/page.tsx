'use client';

import { Button } from "@/components/ui/button";
import { MOCK_MENU_ITEMS } from "@/lib/mock-menu-data";
import { useFirestore } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useState } from "react";
import { nanoid } from "nanoid";

export default function SeedPage() {
    const firestore = useFirestore();
    const [status, setStatus] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (!firestore) return;

        setLoading(true);
        setStatus("Starting seed...");

        try {
            const batch = writeBatch(firestore);

            // Seed Categories
            const categories = [
                { id: 'cat_hot_coffee', name: 'Hot Coffee', type: 'Beverages' },
                { id: 'cat_cold_brews', name: 'Cold Brews', type: 'Beverages' },
                { id: 'cat_teas', name: 'Teas', type: 'Beverages' },
                { id: 'cat_mocktails', name: 'Mocktails', type: 'Beverages' },
                { id: 'cat_bakery', name: 'Bakery', type: 'Food' },
            ];

            categories.forEach(cat => {
                const docRef = doc(firestore, 'categories', cat.id);
                batch.set(docRef, cat);
            });

            // Seed Menu Items
            MOCK_MENU_ITEMS.forEach(item => {
                // Determine category ID based on subCategory name
                let catId = '';
                if (item.subCategory === 'Hot Coffee') catId = 'cat_hot_coffee';
                else if (item.subCategory === 'Cold Brews') catId = 'cat_cold_brews';
                else if (item.subCategory === 'Teas') catId = 'cat_teas';
                else if (item.subCategory === 'Mocktails') catId = 'cat_mocktails';
                else if (item.subCategory === 'Bakery') catId = 'cat_bakery';
                else catId = 'cat_other';

                // We'll regenerate IDs to ensure they don't collide if run multiple times, or we could use the mock IDs.
                // Using mock IDs is fine for seeding.
                const docRef = doc(firestore, 'menu_items', item.id);

                batch.set(docRef, {
                    ...item,
                    categoryId: catId,
                    // Ensure these fields exist as per type definition
                    isOutOfStock: false,
                    addonGroups: []
                });
            });

            // Seed Loyalty Levels
            const loyaltyLevels = [
                { id: 'level_member', name: 'Member', minimumPoints: 0 },
                { id: 'level_bronze', name: 'Bronze', minimumPoints: 500 },
                { id: 'level_gold', name: 'Gold', minimumPoints: 2000 },
                { id: 'level_platinum', name: 'Platinum', minimumPoints: 5000 },
            ];

            loyaltyLevels.forEach(level => {
                const docRef = doc(firestore, 'loyalty_levels', level.id);
                batch.set(docRef, level);
            });

            await batch.commit();
            setStatus("Database seeded successfully! You can now visit /menu.");
        } catch (error) {
            console.error("Error seeding database:", error);
            setStatus("Error seeding database check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-10">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
            <p className="mb-6">Click the button below to populate simple firestore data (Categories & Menu Items) from the mock library.</p>

            <Button onClick={handleSeed} disabled={loading}>
                {loading ? "Seeding..." : "Seed Database"}
            </Button>

            {status && (
                <p className="mt-4 p-4 bg-gray-100 rounded text-sm font-mono border">
                    {status}
                </p>
            )}
        </div>
    );
}
