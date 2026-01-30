'use client';

import { MenuItem, Category } from "@/lib/types";
import { useState, useMemo } from "react";
import MenuFilters from "./MenuFilters";
import MenuCard from "./MenuCard";
import { Flame, CupSoda, Coffee, Croissant, Sparkles, Utensils } from "lucide-react";
import CoffeeBuilder from "./CoffeeBuilder";
import MenuItemModal from "./MenuItemModal";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuGrid() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const firestore = useFirestore();

    // Fetch Categories
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

    // Fetch Menu Items
    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: itemsLoading } = useCollection<MenuItem>(menuItemsQuery);

    const isLoading = categoriesLoading || itemsLoading;

    // Group items by category for "All" view
    const categorizedItems = useMemo(() => {
        if (!categories || !menuItems) return [];

        // Filter items based on active category (which is an ID or 'All')
        // If activeCategory is 'All', we show all groups.
        // If activeCategory is specific, we only show that group.

        // First map categories to their items
        const groups = categories.map(cat => {
            const items = menuItems.filter(item => item.categoryId === cat.id);
            return {
                id: cat.id,
                name: cat.name,
                type: cat.type,
                items: items
            };
        }).filter(group => group.items.length > 0);

        // Filter groups if a specific category is selected
        if (activeCategory !== 'All' && activeCategory !== 'Make Your Own') {
            return groups.filter(g => g.id === activeCategory);
        }

        return groups;

    }, [activeCategory, categories, menuItems]);

    // get category icon helper
    const getCategoryIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('coffee') || lower.includes('hot')) return <span className="text-3xl">🔥</span>;
        if (lower.includes('tea')) return <span className="text-3xl">🍵</span>;
        if (lower.includes('cold') || lower.includes('ice') || lower.includes('beverage') || lower.includes('mocktail')) return <span className="text-3xl">🥤</span>;
        if (lower.includes('bakery') || lower.includes('snack') || lower.includes('food')) return <span className="text-3xl">🥐</span>;
        return <span className="text-3xl">🍴</span>;
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f2efe9] min-h-screen">
            {/* Pass categories to filters if needed, or implement dynamic filters */}
            {/* For now, assuming MenuFilters uses its own hardcoded list or we should update it to dynamic categories too.  
                Let's assume we pass dynamic categories to a modified MenuFilters or keep it simple.
                The current MenuFilters likely has hardcoded 'All', 'Hot Coffee', etc. 
                Ideally we should pass the categories to it.
            */}
            {/* Attempting to use MenuFilters with mapped categories if it supports it, 
               otherwise passing category names as strings if generic enough, 
               or just mapping 'All' and category IDs.
               
               Checking MenuGrid logic, it passes `activeCategory` (string) and `onSelect`.
            */}

            <div className="container mx-auto px-4 md:px-6 py-8 overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-4">
                    <button
                        onClick={() => setActiveCategory('All')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === 'All' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-[#6b584b] border-transparent hover:bg-white/80'}`}
                    >
                        All
                    </button>
                    {categories?.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === cat.id ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-[#6b584b] border-transparent hover:bg-white/80'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveCategory('Make Your Own')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === 'Make Your Own' ? 'bg-[#211811] text-white border-[#211811]' : 'bg-white text-[#211811] border-transparent hover:bg-white/80'}`}
                    >
                        Make Your Own
                    </button>
                </div>
            </div>


            <div className="container mx-auto px-4 md:px-6 py-12 pb-40 lg:pb-32 space-y-16">

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
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex-shrink-0">
                                    {getCategoryIcon(categoryGroup.name)}
                                </div>
                                <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-[#211811]">
                                    {categoryGroup.name}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
