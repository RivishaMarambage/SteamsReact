'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MenuHero() {
    return (
        <section className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
            <Image
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                alt="Menu Header Background"
                fill
                className="object-cover brightness-[0.7]"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

            <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-start justify-center h-full">
                <div className="max-w-2xl space-y-6">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#d97706] text-white text-xs font-bold tracking-wider uppercase">
                        Our Features
                    </span>
                    <h1 className="text-5xl md:text-6xl font-headline font-bold text-white leading-[1.1]">
                        Crafted for comfort, <br />
                        brewed for you.
                    </h1>
                    <p className="text-white/80 text-lg leading-relaxed max-w-lg">
                        Explore our artisanal coffee blends, freshly baked pastries, and refreshing cold brews. Item of the day: <span className="font-bold text-[#f59e0b]">Salted Caramel Macchiato</span>.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button asChild size="lg" className="rounded-full px-8 bg-[#d97706] hover:bg-[#b45309] text-white border-none font-bold text-base h-12 shadow-lg hover:shadow-[#d97706]/20 transition-all">
                            <Link href="/dashboard/order">Order Now <ArrowRight className="ml-2 w-5 h-5" /></Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-2 border-white text-white hover:bg-white hover:text-black font-bold h-12 text-base bg-transparent transition-all">
                            <Link href="/nutrition">Nutrition Info</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
