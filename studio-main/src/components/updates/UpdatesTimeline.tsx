'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, ArrowRight, Sparkles, Star } from 'lucide-react';

const UPDATES_DATA = [
    {
        id: 1,
        title: "The Lavender Haze Latte Arrives",
        date: "July 15, 2024",
        excerpt: "Discover the floral and sweet notes of our latest creation, available for a limited time only. It's the perfect summer refreshment!",
        imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1900&auto=format&fit=crop",
        category: "New Arrival",
        color: "text-purple-400",
        glow: "shadow-purple-500/20"
    },
    {
        id: 2,
        title: "Supporting Local Artists",
        date: "July 5, 2024",
        excerpt: "We're excited to showcase the amazing talent from our community in our new in-house gallery wall. Come enjoy a coffee and some beautiful art.",
        imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=1900&auto=format&fit=crop",
        category: "Community",
        color: "text-blue-400",
        glow: "shadow-blue-500/20"
    },
    {
        id: 3,
        title: "Double Points Mondays",
        date: "June 28, 2024",
        excerpt: "We're making Mondays a little brighter. All loyalty members will now earn double the points on all purchases every Monday.",
        imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1900&auto=format&fit=crop",
        category: "Loyalty",
        color: "text-[#d97706]",
        glow: "shadow-orange-500/20"
    },
    {
        id: 4,
        title: "Summer Music Sessions",
        date: "June 20, 2024",
        excerpt: "Join us every Friday evening for live acoustic sessions on our patio. The perfect way to unwind after a long week.",
        imageUrl: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=1900&auto=format&fit=crop",
        category: "Events",
        color: "text-green-400",
        glow: "shadow-green-500/20"
    }
];

export default function UpdatesTimeline() {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observerRef.current?.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach((el) => {
            observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    return (
        <section className="bg-[#1a110a] min-h-screen text-white overflow-hidden relative pb-32">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[#2c1810] to-[#1a110a] -z-10"></div>
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#d97706]/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1a110a] rounded-full blur-[120px] -z-10"></div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

            <div className="container mx-auto px-4 md:px-6 pt-32 lg:pt-40 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 reveal">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest text-[#d97706] mb-6 uppercase">
                        <Sparkles className="w-4 h-4" />
                        What's New
                    </div>
                    <h1 className="text-5xl md:text-7xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-8 leading-[1.1]">
                        Stories from the Roastery
                    </h1>
                    <p className="text-xl text-white/60 font-light leading-relaxed">
                        Stay up to date with our latest creations, community events, and steamy announcements.
                    </p>
                </div>

                {/* Timeline / Grid */}
                <div className="relative">
                    {/* Vertical Line (Desktop) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#d97706] via-white/10 to-transparent -translate-x-1/2 hidden lg:block"></div>

                    <div className="space-y-20 lg:space-y-0 relative">
                        {UPDATES_DATA.map((item, index) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative reveal",
                                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                                )}
                            >
                                {/* Center Node (Desktop) */}
                                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a110a] border-2 border-[#d97706] rounded-full z-20 hidden lg:block shadow-[0_0_15px_#d97706]">
                                    <div className="absolute inset-0 bg-[#d97706] rounded-full animate-ping opacity-20"></div>
                                </div>

                                {/* Content Side */}
                                <div className="flex-1 w-full lg:w-1/2">
                                    <div className={cn(
                                        "relative group cursor-pointer",
                                        "hover:-translate-y-2 transition-transform duration-500 ease-out"
                                    )}>
                                        {/* Image Card */}
                                        <div className="relative aspect-[16/9] w-full lg:aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>

                                            {/* Floating Badge */}
                                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                <span className="bg-black/60 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border border-white/10 uppercase">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Side */}
                                <div className="flex-1 w-full lg:w-1/2 text-center lg:text-left">
                                    <div className={cn(
                                        "max-w-lg mx-auto lg:mx-0",
                                        index % 2 === 0 ? "lg:mr-auto" : "lg:ml-auto"
                                    )}>
                                        <div className="flex items-center gap-3 justify-center lg:justify-start text-[#d97706] mb-4 font-bold tracking-widest text-sm uppercase">
                                            <Calendar className="w-4 h-4" />
                                            {item.date}
                                        </div>
                                        <h2 className={cn("text-3xl md:text-5xl font-headline font-bold mb-6 leading-tight", item.color)}>
                                            {item.title}
                                        </h2>
                                        <p className="text-white/60 text-lg leading-relaxed mb-8">
                                            {item.excerpt}
                                        </p>
                                        <Button asChild variant="link" className={cn("text-white p-0 h-auto text-lg hover:no-underline group", item.color)}>
                                            <Link href="#" className="flex items-center gap-2">
                                                Read Full Story
                                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-40 text-center reveal">
                    <p className="text-white/40 text-sm tracking-[0.2em] uppercase">End of updates</p>
                    <div className="h-20 w-[1px] bg-gradient-to-b from-white/20 to-transparent mx-auto mt-8"></div>
                </div>
            </div>
        </section>
    );
}
