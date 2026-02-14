'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CraftedCoffeeSection() {
    return (
        <section className="relative w-full min-h-[80vh] bg-[#0f0a06] overflow-hidden flex items-center py-20">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1a110a] via-[#0f0a06] to-black opacity-90" />
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[#d97706]/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-[#d97706]/5 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d97706]/10 border border-[#d97706]/20 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-[#d97706] animate-pulse" />
                        <span className="text-[#d97706] text-xs font-bold tracking-[0.2em] uppercase">Premium Selection</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-headline font-bold text-white leading-[1.1] tracking-tight">
                        Crafted for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] via-[#fbbf24] to-[#d97706] animate-gradient-x">
                            Coffee Lovers
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                        Experience the art of brewing with our signature blends.
                        Sourced from the finest estates, roasted to perfection, and poured with passion.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 relative z-20">
                        <Button asChild size="lg" className="h-14 px-8 rounded-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold tracking-wide shadow-[0_0_30px_-5px_rgba(217,119,6,0.4)] transition-all hover:scale-105 active:scale-95 text-lg border-none">
                            <Link href="/menu" className="flex items-center gap-2">
                                Explore Our Menu <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full border-white/10 bg-transparent hover:bg-white/5 text-white/80 hover:text-white backdrop-blur-sm transition-all text-lg hover:text-opacity-100">
                            <Link href="/about">Our Story</Link>
                        </Button>
                    </div>

                    {/* Stats / Trust Indicators */}
                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 md:gap-12 opacity-80">
                        <div className="text-center lg:text-left">
                            <p className="text-3xl font-headline font-bold text-white">100%</p>
                            <p className="text-xs text-[#d97706] uppercase tracking-wider">Arabica Beans</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center lg:text-left">
                            <p className="text-3xl font-headline font-bold text-white">24h</p>
                            <p className="text-xs text-[#d97706] uppercase tracking-wider">Fresh Roast</p>
                        </div>
                    </div>
                </div>

                {/* Right Visuals */}
                <div className="relative order-1 lg:order-2 flex justify-center items-center py-10 lg:py-0">
                    {/* Main Circle Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#d97706]/20 to-transparent rounded-full blur-[80px] scale-75 animate-pulse" />

                    <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] transition-transform duration-700 hover:scale-105 group perspective-1000">
                        {/* Coffee Cup Placeholder - Replace with actual transparent PNG if available */}
                        <div className="absolute inset-0 z-10 drop-shadow-2xl">
                            <Image
                                src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop"
                                alt="Luxury Coffee"
                                width={600}
                                height={600}
                                className="w-full h-full object-cover rounded-full mask-image-radial border-4 border-[#d97706]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        {/* Steam Effects (CSS Animation) */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-40 z-0 opacity-0 group-hover:opacity-60 transition-opacity duration-1000">
                            <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white blur-[10px] rounded-full animate-[steam_2s_ease-out_infinite]" />
                            <div className="absolute bottom-4 left-1/3 w-6 h-6 bg-white blur-[15px] rounded-full animate-[steam_2.5s_ease-out_infinite_0.5s]" />
                            <div className="absolute bottom-2 left-2/3 w-5 h-5 bg-white blur-[12px] rounded-full animate-[steam_3s_ease-out_infinite_1s]" />
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute top-10 right-0 md:-right-10 z-20 animate-[float_4s_ease-in-out_infinite]">
                            <div className="glass-card bg-black/40 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl flex items-center gap-3 shadow-xl transform rotate-6 hover:rotate-0 transition-transform duration-300">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#d97706]/20 flex items-center justify-center text-[#d97706]">
                                    <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Rich Aroma</p>
                                    <p className="text-white/50 text-xs">Premium Grade</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-0 md:-left-10 z-20 animate-[float_5s_ease-in-out_infinite_1s]">
                            <div className="glass-card bg-black/40 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl flex items-center gap-3 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                    <span className="font-serif text-lg italic">Aa</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">100% Arabica</p>
                                    <p className="text-white/50 text-xs">Single Origin</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-40px) scale(2); opacity: 0; }
        }
        .mask-image-radial {
          mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
        }
      `}</style>
        </section>
    );
}
