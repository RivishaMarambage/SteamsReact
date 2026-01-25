'use client';

import { MenuItem } from "@/lib/types";
import { useState, useMemo } from "react";
import MenuFilters from "./MenuFilters";
import MenuCard from "./MenuCard";
import { Flame, CupSoda, Coffee, Croissant, Sparkles } from "lucide-react";
import { MOCK_MENU_ITEMS } from "@/lib/mock-menu-data";
import CoffeeBuilder from "./CoffeeBuilder";
import MenuItemModal from "./MenuItemModal";

export default function MenuGrid() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    // Use mock items directly
    // In a real scenario, we might merge this with DB items or use DB items exclusively
    const menuItems: any[] = MOCK_MENU_ITEMS;

    // Group items by category for "All" view
    const categorizedItems = useMemo(() => {

        // Filter items based on active category
        const filteredItems = activeCategory === 'All'
            ? menuItems
            : menuItems.filter(item =>
                activeCategory === 'Make Your Own' ? false : // Handle special case separately if needed
                    item.subCategory === activeCategory || item.categoryId === activeCategory
            );

        // Group by subCategory for display
        const groups: { [key: string]: typeof menuItems } = {};

        filteredItems.forEach(item => {
            const key = item.subCategory || 'Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        // Sort groups specifically if needed, otherwise just Object.keys
        // Forcing specific order for 'All' view
        const orderedKeys = ['Hot Coffee', 'Cold Brews', 'Teas', 'Bakery'];
        const finalGroups = orderedKeys
            .filter(key => groups[key] && groups[key].length > 0)
            .map(key => ({
                id: key,
                name: key, // e.g. "Hot Coffee Classics" if we want to append "Classics"
                items: groups[key]
            }));

        return finalGroups;

    }, [activeCategory, menuItems]);

    return (
        <div className="bg-[#f2efe9] min-h-screen">
            <MenuFilters activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

            <div className="container mx-auto px-4 md:px-6 py-12 space-y-16">

                {/* Special Render for 'Make Your Own' */}
                {activeCategory === 'Make Your Own' ? (
                    <CoffeeBuilder />
                ) : categorizedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-muted-foreground">No items found for this category.</p>
                    </div>
                ) : (
                    categorizedItems.map((categoryGroup) => (
                        <section key={categoryGroup.id} id={categoryGroup.id} className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-8">
                                {/* Icons based on category name guess */}
                                {categoryGroup.name.toLowerCase().includes('coffee') && <Flame className="w-6 h-6 text-[#d97706]" />}
                                {categoryGroup.name.toLowerCase().includes('tea') && <Coffee className="w-6 h-6 text-[#d97706]" />}
                                {categoryGroup.name.toLowerCase().includes('cold') && <CupSoda className="w-6 h-6 text-[#d97706]" />}
                                {categoryGroup.name.toLowerCase().includes('bakery') && <Croissant className="w-6 h-6 text-[#d97706]" />}

                                <h2 className="text-3xl font-headline font-black tracking-tight text-[#211811]">
                                    {categoryGroup.name}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                                {categoryGroup.items.map(item => (
                                    <MenuCard
                                        key={item.id}
                                        item={item}
                                        onSelect={(item) => setSelectedItem(item)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {/* Item Details Modal */}
            <MenuItemModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
