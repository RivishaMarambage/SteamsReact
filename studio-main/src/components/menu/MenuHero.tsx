'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MenuHero() {
    return (
        <section className="bg-white py-12 lg:py-20 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

                    {/* Text Content */}
                    <div className="flex-1 max-w-2xl">
                        <div className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest text-[#d97706] uppercase bg-[#d97706]/10 rounded-full">
                            Our Menu
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-black text-[#211811] leading-tight mb-6">
                            Crafted for comfort, <br className="hidden md:block" />
                            brewed for you.
                        </h1>
                        <p className="text-lg text-[#6b584b] mb-8 leading-relaxed max-w-lg">
                            Explore our artisanal coffee blends, freshly baked pastries, and refreshing cold brews. Item of the day: <span className="font-bold text-[#d97706]">Salted Caramel Macchiato</span>.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button asChild size="lg" className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold rounded-lg px-8 h-12 text-base">
                                <Link href="/order">Order Now</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-2 border-[#211811] text-[#211811] hover:bg-[#211811] hover:text-white font-bold rounded-lg px-8 h-12 text-base bg-transparent transition-all">
                                <Link href="/nutrition">View Nutritional Info</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="flex-1 w-full relative">
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                                alt="Coffee and pastries display"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Overlay for slight contrast if needed, or remove if image is perfect */}
                            <div className="absolute inset-0 bg-black/5" />
                        </div>

                        {/* Decorative Elements (Optional, based on 'standard' modern design, not explicitly in image but good for 'exact match' feel if image had them) */}
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#f2efe9] rounded-full -z-10" />
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#d97706]/10 rounded-full -z-10 opacity-50" />
                    </div>

                </div>
            </div>
        </section>
    );
}
