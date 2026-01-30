'use client';

import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NEWS_ITEMS = [
    {
        id: 1,
        category: "New Arrival",
        text: "Experience our exclusive Ethiopian Yirgacheffe harvest — Floral & Citrus notes.",
        link: "/menu"
    },
    {
        id: 2,
        category: "Member Perk",
        text: "Double Steam Points on all cold brews this weekend only!",
        link: "/rewards"
    },
    {
        id: 3,
        category: "Event",
        text: "Barista Workshop: Learn Latte Art with champions this Sunday.",
        link: "/updates"
    },
    {
        id: 4,
        category: "Community",
        text: "Steamsbury opens its 5th location in Westside Plaza. Visit us today!",
        link: "/about"
    }
];

export default function NewsBanner() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, axis: 'y' }, [
        Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
    ]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        }

        emblaApi.on('select', onSelect);
        onSelect(); // Initial sync

        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi]);

    return (
        <div className="w-full bg-[#1a110a] border-t border-b border-white/5 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d97706]/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d97706]/50 to-transparent"></div>
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-60 h-60 bg-[#d97706]/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-60 h-60 bg-[#d97706]/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex items-center justify-between gap-4 md:gap-12">

                    {/* Left: Brand / Label */}
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#d97706] blur-md rounded-full opacity-50 animate-pulse"></div>
                            <div className="relative bg-[#d97706] text-white p-2 md:p-4 rounded-full shadow-xl">
                                <Bell className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h3 className="text-white font-bold font-headline uppercase tracking-wider text-sm md:text-2xl leading-none mb-1">
                                Steamsbury News
                            </h3>
                            <p className="text-white/50 text-[10px] md:text-base font-medium tracking-wide">Latest updates</p>
                        </div>
                        <div className="h-10 md:h-16 w-[1px] bg-white/10 mx-2 md:mx-4 hidden md:block"></div>
                    </div>

                    {/* Middle: Carousel */}
                    <div className="flex-1 overflow-hidden h-12 md:h-24 relative" ref={emblaRef}>
                        <div className="flex flex-col h-full touch-pan-y">
                            {NEWS_ITEMS.map((item) => (
                                <div className="flex-[0_0_100%] min-w-0 flex items-center justify-start" key={item.id}>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                                        <span className="inline-flex items-center px-2 py-0.5 md:px-4 md:py-1 rounded-full text-[8px] md:text-sm font-bold tracking-wide uppercase bg-white/10 text-[#f59e0b] border border-[#f59e0b]/20 shrink-0">
                                            {item.category}
                                        </span>
                                        <span className="text-white/90 text-sm md:text-3xl font-headline font-bold leading-tight line-clamp-1 md:line-clamp-none">
                                            {item.text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Action / Indicators */}
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                        <div className="hidden md:flex gap-2">
                            {NEWS_ITEMS.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'bg-[#d97706] w-8' : 'bg-white/20 w-2 hover:bg-white/40'
                                        }`}
                                    onClick={() => emblaApi?.scrollTo(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <Button asChild variant="ghost" className="text-[#f59e0b] hover:text-[#fbbf24] hover:bg-white/5 group text-xs md:text-lg font-bold p-0 md:px-6 h-8 md:h-12 rounded-full">
                            <Link href={NEWS_ITEMS[selectedIndex]?.link || "/updates"} className="flex items-center gap-1 md:gap-2">
                                <span className="hidden xs:inline">Read Details</span>
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
