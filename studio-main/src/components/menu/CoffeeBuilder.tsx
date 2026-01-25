'use client';

import { useState } from 'react';
import { Sparkles, ShoppingCart, Coffee, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Configuration Data
const BASES = [
    { id: 'espresso', name: 'Espresso Shot', price: 400 },
    { id: 'double', name: 'Double Espresso', price: 600 },
    { id: 'coldbrew', name: 'Cold Brew', price: 500 },
    { id: 'americano', name: 'Americano', price: 450 },
];

const MILK_OPTIONS = [
    { id: 'whole', name: 'Whole Milk', price: 100 },
    { id: 'oat', name: 'Oat Milk', price: 150 },
    { id: 'almond', name: 'Almond Milk', price: 150 },
];

const SYRUP_OPTIONS = [
    { id: 'vanilla', name: 'Vanilla Syrup', price: 100 },
    { id: 'caramel', name: 'Caramel Syrup', price: 100 },
    { id: 'hazelnut', name: 'Hazelnut Syrup', price: 100 },
    { id: 'mocha', name: 'Mocha Syrup', price: 100 },
];

const TOPPING_OPTIONS = [
    { id: 'extra', name: 'Extra Shot', price: 200 },
    { id: 'cream', name: 'Whipped Cream', price: 100 },
    { id: 'cinnamon', name: 'Cinnamon', price: 50 },
    { id: 'ice', name: 'Ice', price: 0 },
];

export default function CoffeeBuilder() {
    const [selectedBase, setSelectedBase] = useState<string>('espresso');
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

    const handleBaseSelect = (id: string) => {
        setSelectedBase(id);
    };

    const toggleAddon = (id: string) => {
        const newAddons = new Set(selectedAddons);
        if (newAddons.has(id)) {
            newAddons.delete(id);
        } else {
            newAddons.add(id);
        }
        setSelectedAddons(newAddons);
    };

    const calculateTotal = () => {
        const basePrice = BASES.find(b => b.id === selectedBase)?.price || 0;
        let addonsPrice = 0;

        // Helper to sum addons from all lists
        [...MILK_OPTIONS, ...SYRUP_OPTIONS, ...TOPPING_OPTIONS].forEach(addon => {
            if (selectedAddons.has(addon.id)) {
                addonsPrice += addon.price;
            }
        });

        return basePrice + addonsPrice;
    };

    const total = calculateTotal();

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-8 h-8 text-[#d97706] fill-current" />
                <h2 className="text-4xl font-headline font-black text-[#211811]">Make Your Own Coffee</h2>
            </div>

            {/* Builder Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#f2efe9]">

                {/* Orange Banner Header */}
                <div className="bg-[#e67e22] py-8 text-center text-white">
                    <h3 className="text-3xl font-headline font-bold mb-2">Build Your Perfect Cup</h3>
                    <p className="opacity-90 font-medium">Start with a base and customize with your favorite add-ons</p>
                </div>

                <div className="p-8 md:p-12 space-y-12">

                    {/* Section 1: Choose Your Base */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 text-[#d97706]">
                            <Coffee className="w-6 h-6" />
                            <h4 className="text-xl font-bold text-[#211811]">Choose Your Base</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {BASES.map((base) => (
                                <button
                                    key={base.id}
                                    onClick={() => handleBaseSelect(base.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-6 px-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg",
                                        selectedBase === base.id
                                            ? "border-[#d97706] bg-[#fff7ed] text-[#d97706]"
                                            : "border-[#e5e5e5] hover:border-[#d97706]/50 text-[#6b584b]"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg mb-1", selectedBase === base.id ? "text-[#211811]" : "")}>{base.name}</span>
                                    <span className={cn("font-bold", selectedBase === base.id ? "text-[#d97706]" : "text-[#e67e22]")}>Rs {base.price}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <hr className="border-[#f2efe9]" />

                    {/* Section 2: Customize Your Drink */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 text-[#d97706]">
                            <SlidersHorizontal className="w-6 h-6" />
                            <h4 className="text-xl font-bold text-[#211811]">Customize Your Drink</h4>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Column 1: Milk & Toppings */}
                            <div className="space-y-4">
                                <div className="bg-[#fcfbf9] p-6 rounded-2xl border border-[#f2efe9]">
                                    {MILK_OPTIONS.map(option => (
                                        <div key={option.id} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => toggleAddon(option.id)}
                                                    className={cn(
                                                        "w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                        selectedAddons.has(option.id) ? "bg-[#d97706] border-[#d97706]" : "border-[#d1d5db]"
                                                    )}
                                                >
                                                    {selectedAddons.has(option.id) && <Sparkles className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="font-bold text-[#211811]">{option.name}</span>
                                            </div>
                                            <span className="font-bold text-[#e67e22] text-sm">+Rs {option.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: Syrups */}
                            <div className="space-y-4">
                                <div className="bg-[#fcfbf9] p-6 rounded-2xl border border-[#f2efe9]">
                                    {SYRUP_OPTIONS.map(option => (
                                        <div key={option.id} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => toggleAddon(option.id)}
                                                    className={cn(
                                                        "w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                        selectedAddons.has(option.id) ? "bg-[#d97706] border-[#d97706]" : "border-[#d1d5db]"
                                                    )}
                                                >
                                                    {selectedAddons.has(option.id) && <Sparkles className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="font-bold text-[#211811]">{option.name}</span>
                                            </div>
                                            <span className="font-bold text-[#e67e22] text-sm">+Rs {option.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Full Width: Extra Toppings */}
                            <div className="md:col-span-2">
                                <div className="bg-[#fcfbf9] p-6 rounded-2xl border border-[#f2efe9]">
                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                                        {TOPPING_OPTIONS.map(option => (
                                            <div key={option.id} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => toggleAddon(option.id)}
                                                        className={cn(
                                                            "w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                            selectedAddons.has(option.id) ? "bg-[#d97706] border-[#d97706]" : "border-[#d1d5db]"
                                                        )}
                                                    >
                                                        {selectedAddons.has(option.id) && <Sparkles className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="font-bold text-[#211811]">{option.name}</span>
                                                </div>
                                                <span className="font-bold text-[#e67e22] text-sm">{option.price === 0 ? 'Free' : `+Rs ${option.price}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Footer: Price & Add to Cart */}
                    <div className="mt-8 pt-8 border-t-2 border-dashed border-[#e67e22]/20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="block text-sm font-bold text-[#6b584b] uppercase tracking-wider mb-1">Your Custom Coffee</span>
                            <div className="text-4xl font-headline font-black text-[#e67e22]">Rs {total}</div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full md:w-auto rounded-full h-14 px-10 bg-[#e67e22] hover:bg-[#d35400] text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                        >
                            <ShoppingCart className="mr-2 h-6 w-6" /> Add to Cart
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
