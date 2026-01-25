'use client';

import { MenuItem } from "@/lib/types";
import { X, Plus, Minus, Check } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface MenuItemModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
}

// Mock Addons for display purposes (matches the screenshot)
const MOCK_ADDONS = [
    { id: 'extra', name: 'Extra Shot Espresso', price: 100 },
    { id: 'hazelnut', name: 'Hazelnut Syrup', price: 100 },
    { id: 'vanilla', name: 'Vanilla Syrup', price: 100 },
    { id: 'caramel', name: 'Caramel Sauce', price: 100 },
    { id: 'oat', name: 'Oat Milk', price: 150 },
];

export default function MenuItemModal({ item, isOpen, onClose }: MenuItemModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
    const [isClosing, setIsClosing] = useState(false);

    // Reset state when item changes
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setSelectedAddons(new Set());
            setIsClosing(false);
        }
    }, [isOpen, item]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    if (!isOpen || !item) return null;

    const toggleAddon = (id: string) => {
        const newSet = new Set(selectedAddons);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedAddons(newSet);
    };

    const calculateTotal = () => {
        let total = item.price;
        MOCK_ADDONS.forEach(addon => {
            if (selectedAddons.has(addon.id)) {
                total += addon.price;
            }
        });
        return total * quantity;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isClosing ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] transition-all duration-300 transform",
                    isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-black p-2 rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Hero Image */}
                <div className="relative h-64 w-full flex-shrink-0 bg-gray-100">
                    <Image
                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mb-6">
                        <span className="text-xs font-bold tracking-widest text-[#6b584b] uppercase mb-2 block">
                            {/* We can map category ID to name or use raw ID if needed. Assuming 'Food' -> Hot Coffee/etc based on context logic elsewhere, or just hardcode 'HOT COFFEE' for design match if data missing */}
                            {/* For now, let's use a generic mapping or just hardcode 'PREMIUM SELECTION' to look nice */}
                            PREMIUM SELECTION
                        </span>
                        <h2 className="text-3xl font-headline font-black text-[#211811] mb-2">{item.name}</h2>
                        <p className="text-[#6b584b] leading-relaxed">
                            {item.description || "Rich, intense experience paired with our signature service."}
                        </p>
                    </div>

                    {/* Add Ons Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-[#211811]">Add Ons</h3>
                            <span className="text-xs text-gray-400 font-medium">(Optional)</span>
                        </div>

                        <div className="space-y-3">
                            {MOCK_ADDONS.map(addon => (
                                <div
                                    key={addon.id}
                                    onClick={() => toggleAddon(addon.id)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                        selectedAddons.has(addon.id)
                                            ? "border-[#d97706] bg-[#fff7ed]"
                                            : "border-[#e5e5e5] hover:border-[#d97706]/50"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                                            selectedAddons.has(addon.id) ? "bg-[#d97706] border-[#d97706]" : "border-[#d1d5db]"
                                        )}>
                                            {selectedAddons.has(addon.id) && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={cn("font-medium", selectedAddons.has(addon.id) ? "text-[#d97706]" : "text-[#211811]")}>
                                            {addon.name}
                                        </span>
                                    </div>
                                    <span className="font-bold text-[#d97706] text-sm">+ Rs {addon.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[#f2efe9] bg-white flex items-center justify-between gap-4">
                    {/* Quantity */}
                    <div className="flex items-center bg-[#f3f4f6] rounded-full px-2 h-12 flex-shrink-0">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-full flex items-center justify-center text-black hover:text-[#d97706]"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-full flex items-center justify-center text-black hover:text-[#d97706]"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        className="flex-1 bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-lg h-12 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        Add to Cart - Rs {calculateTotal()}
                    </Button>
                </div>

            </div>
        </div>
    );
}
