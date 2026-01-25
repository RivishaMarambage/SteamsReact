'use client';

import { Button } from "@/components/ui/button";
import { Coffee, Flame, BookOpen, Snowflake, Croissant, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuFiltersProps {
    activeCategory: string;
    onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
    { id: 'All', label: 'All', icon: BookOpen },
    { id: 'Food', label: 'Hot Coffee', icon: Flame },
    { id: 'Cold Brews', label: 'Cold Brews', icon: Snowflake },
    { id: 'Teas', label: 'Teas', icon: Coffee },
    { id: 'Bakery', label: 'Bakery', icon: Croissant },
    { id: 'Make Your Own', label: 'Make Your Own Coffee', icon: Sparkles },
];

export default function MenuFilters({ activeCategory, onSelectCategory }: MenuFiltersProps) {
    return (
        <section className="bg-[#f2efe9] py-8 sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-6 overflow-x-auto no-scrollbar">
                <div className="flex space-x-4 min-w-max pb-2 md:pb-0 justify-start md:justify-center">
                    {CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.id;
                        const isSpecial = category.id === 'Make Your Own';

                        return (
                            <Button
                                key={category.id}
                                onClick={() => onSelectCategory(category.id)}
                                variant="ghost"
                                className={cn(
                                    "rounded-full px-6 h-12 text-sm font-bold flex items-center gap-2 transition-all duration-300 border",
                                    isActive
                                        ? (isSpecial ? "bg-gradient-to-r from-[#d97706] to-[#f59e0b] border-transparent text-white shadow-md hover:opacity-90" : "bg-[#d97706] text-white border-[#d97706] hover:bg-[#b45309] hover:border-[#b45309]")
                                        : "bg-white text-[#211811] border-[#211811] hover:bg-white hover:border-[#d97706] hover:text-[#d97706]"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-current")} />
                                {category.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
