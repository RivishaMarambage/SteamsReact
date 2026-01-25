'use client';

import { MenuItem } from "@/lib/types";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface MenuCardProps {
    item: MenuItem;
    onSelect?: (item: MenuItem) => void;
}

export default function MenuCard({ item, onSelect }: MenuCardProps) {
    // Mock data for design matching since these aren't in the type yet
    const calories = Math.floor(Math.random() * (450 - 50 + 1) + 50);
    const isVeg = true; // Most coffee/pastries are veg, simplistic assumption for design

    return (
        <div
            className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#d97706]/10 flex flex-col h-full relative cursor-pointer"
            onClick={() => onSelect?.(item)}
        >
            {/* Image Container */}
            <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#f8f5f2]">
                <Image
                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/500/400`}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Badges - Top Left */}
                <div className="absolute top-3 left-3 z-10">
                    <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                        <span className="text-[#d97706] font-bold text-xs uppercase">
                            {isVeg ? "V" : "GF"}
                        </span>
                    </div>
                </div>

                {/* Add Button - Overlapping Image Bottom Right */}
                <button
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#e67e22] text-white flex items-center justify-center shadow-lg hover:bg-[#d35400] transition-colors z-20 hover:scale-110 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(item);
                    }}
                >
                    <Plus className="w-6 h-6 stroke-[3px]" />
                </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-headline font-bold text-xl text-[#211811] leading-tight group-hover:text-[#d97706] transition-colors">
                        {item.name}
                    </h3>
                    <span className="font-bold text-[#e67e22] whitespace-nowrap text-lg">
                        Rs {item.price}
                    </span>
                </div>

                <p className="text-[#9ca3af] text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                    {item.description || "Rich, intense, and full-bodied single shot made from our signature dark roast."}
                </p>

                <div className="mt-auto pt-2">
                    <span className="inline-block bg-[#f3f4f6] text-[#6b7280] text-xs font-bold px-3 py-1 rounded-md">
                        {calories}kcal
                    </span>
                </div>
            </div>
        </div>
    );
}
