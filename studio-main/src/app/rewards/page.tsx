'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, Crown, Star, Gift, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { LoyaltyLevel } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function RewardsPage() {
    const firestore = useFirestore();

    const loyaltyLevelsQuery = useMemoFirebase(() => {
        if (firestore) {
            return query(collection(firestore, "loyalty_levels"), orderBy("minimumPoints"));
        }
        return null;
    }, [firestore]);

    const { data: loyaltyTiersFromDB, isLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

    const loyaltyTiers = React.useMemo(() => {
        // Use DB data if available, otherwise use fallback data
        const defaultTiers = [
            { id: 'level_member', name: 'Member', minimumPoints: 0 },
            { id: 'level_bronze', name: 'Bronze', minimumPoints: 500 },
            { id: 'level_gold', name: 'Gold', minimumPoints: 2000 },
            { id: 'level_platinum', name: 'Platinum', minimumPoints: 5000 },
        ];

        const tierData = loyaltyTiersFromDB || defaultTiers;

        return tierData.map((level, idx) => {
            let perks = ["Earn points on purchases"];
            const nameLower = level.name.toLowerCase();
            if (nameLower.includes('bronze')) perks = ["Earn 1pt / 200 LKR", "Pay with Points"];
            else if (nameLower.includes('gold')) perks = ["Earn 1pt / 100 LKR", "Priority Service"];
            else if (nameLower.includes('platinum')) perks = ["2x Points", "Free Birthday Drink", "Personal Barista"];
            else perks = ["Earn 1pt / 400 LKR", "Digital Card"];

            return {
                id: level.id,
                name: level.name,
                price: `${level.minimumPoints} pts`,
                perks: perks,
            };
        });
    }, [loyaltyTiersFromDB]);

    return (
        <div className="min-h-screen bg-[#1a110a] text-white font-body overflow-x-hidden selection:bg-[#d97706] selection:text-white">
            <PublicHeader />

            {/* 1. Immersive Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Cinematic Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop"
                        alt="Coffee Texture"
                        fill
                        className="object-cover opacity-40 scale-105 animate-pulse-slow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a110a]/80 via-[#1a110a]/50 to-[#1a110a]" />
                </div>

                <div className="relative z-10 container mx-auto px-4 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                        <Crown className="w-4 h-4 text-[#d97706]" />
                        <span className="text-xs font-bold tracking-[0.2em] text-[#d97706] uppercase">The Inner Circle</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-headline font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-6 drop-shadow-2xl">
                        THE <br />
                        <span className="gold-gradient italic pr-4">Steamsbury</span> <br />
                        CLUB
                    </h1>

                    <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                        More than just coffee. It's a journey of taste, status, and exclusive rewards.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Button asChild size="lg" className="rounded-full h-16 px-10 bg-[#d97706] hover:bg-[#b45309] text-white text-lg font-bold shadow-[0_0_40px_rgba(217,119,6,0.3)] hover:shadow-[0_0_60px_rgba(217,119,6,0.5)] transition-all duration-500 hover:scale-105">
                            <Link href="/signup/customer">Join the Club</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full h-16 px-10 border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all duration-300">
                            <Link href="#tiers">View Benefits</Link>
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/30">
                    <ArrowDown className="w-8 h-8" />
                </div>
            </section>

            {/* Continuous Background Wrapper */}
            <div className="relative bg-gradient-to-b from-[#1a110a] via-[#2c1810] to-[#1a110a] overflow-hidden">
                {/* Continuous Pattern */}
                <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* Floating Fun Icons - Distributed across the height */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[5%] left-[5%] text-[#d97706]/20 animate-bounce duration-[3000ms]"><Sparkles className="w-12 h-12" /></div>
                    <div className="absolute top-[15%] right-[10%] text-[#d97706]/20 animate-bounce duration-[4000ms] delay-700"><Crown className="w-16 h-16 rotate-12" /></div>
                    <div className="absolute top-[25%] left-[15%] text-[#d97706]/20 animate-pulse duration-[5000ms]"><Star className="w-8 h-8" /></div>
                    <div className="absolute top-[35%] right-[20%] text-[#d97706]/20 animate-bounce duration-[3500ms] delay-300"><Gift className="w-10 h-10 -rotate-12" /></div>

                    <div className="absolute top-[50%] left-[10%] text-[#d97706]/20 animate-spin-slow duration-[10000ms] opacity-50"><Star className="w-20 h-20" /></div>
                    <div className="absolute top-[65%] right-[5%] text-[#d97706]/20 animate-bounce duration-[4500ms]"><Crown className="w-12 h-12 -rotate-6" /></div>
                    <div className="absolute top-[80%] left-[20%] text-[#d97706]/20 animate-pulse duration-[4000ms]"><Sparkles className="w-16 h-16" /></div>
                </div>

                {/* 2. What are Steams Points? */}
                <section className="py-32 relative z-10">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="glass-card rounded-[3rem] p-8 md:p-16 overflow-hidden relative">
                            {/* Decorative background glow */}
                            <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-[#d97706]/30 to-transparent rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-[#d97706]/20 to-transparent rounded-full blur-[120px] pointer-events-none" />

                            <div className="relative z-10 text-center mb-16">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d97706]/10 border border-[#d97706]/20 mb-6">
                                    <Sparkles className="w-5 h-5 text-[#d97706]" />
                                    <span className="text-sm font-bold tracking-wider text-[#d97706] uppercase">Currency of Coffee Lovers</span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-headline font-black mb-6">
                                    What are <span className="gold-gradient">Steams Points</span>?
                                </h2>
                                <p className="text-white/60 text-xl max-w-3xl mx-auto leading-relaxed">
                                    Steams Points are your golden tickets to exclusive rewards, premium benefits, and elevated coffee experiences.
                                    Every purchase transforms into points that unlock a world of perks.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 mb-12 relative z-10">
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#d97706]/30 transition-all duration-300 group">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-xl bg-[#d97706]/20 flex items-center justify-center border border-[#d97706]/30 group-hover:scale-110 transition-transform duration-300">
                                            <TrendingUp className="w-7 h-7 text-[#d97706]" />
                                        </div>
                                        <h3 className="text-2xl font-headline font-bold mb-2">How to Earn</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3"><Star className="w-5 h-5 text-[#d97706] mt-0.5 flex-shrink-0" /><span className="text-white/70">Earn points on every purchase</span></li>
                                        <li className="flex items-start gap-3"><Star className="w-5 h-5 text-[#d97706] mt-0.5 flex-shrink-0" /><span className="text-white/70">Higher tiers earn points faster</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#d97706]/30 transition-all duration-300 group">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-xl bg-[#d97706]/20 flex items-center justify-center border border-[#d97706]/30 group-hover:scale-110 transition-transform duration-300">
                                            <Gift className="w-7 h-7 text-[#d97706]" />
                                        </div>
                                        <h3 className="text-2xl font-headline font-bold mb-2">How to Redeem</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3"><Star className="w-5 h-5 text-[#d97706] mt-0.5 flex-shrink-0" /><span className="text-white/70">Pay with points for any item</span></li>
                                        <li className="flex items-start gap-3"><Star className="w-5 h-5 text-[#d97706] mt-0.5 flex-shrink-0" /><span className="text-white/70">Unlock exclusive secret menu items</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Why Join The Steamsbury Club Section */}
                <section className="py-32 relative z-10">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-headline font-black mb-4 bg-gradient-to-r from-white via-white to-[#d97706] bg-clip-text text-transparent">
                                Why Join The Steamsbury Club?
                            </h2>
                            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">Three simple reasons to make every sip count.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every rupee spent. Points never expire.", color: "text-amber-400", glow: "bg-amber-500/20", borderColor: "border-amber-500/30" },
                                { icon: Gift, title: "Redeem Rewards", desc: "Use points to pay for your favorite drinks, food, or merchandise.", color: "text-rose-400", glow: "bg-rose-500/20", borderColor: "border-rose-500/30" },
                                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades.", color: "text-emerald-400", glow: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "glass-card p-8 rounded-3xl group relative overflow-hidden cursor-pointer transition-all duration-700 border border-white/5",
                                        "hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#d97706]/20"
                                    )}
                                >
                                    {/* Animated Glow Effect */}
                                    <div className={cn(
                                        "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] transition-all duration-700",
                                        "group-hover:blur-[80px] group-hover:scale-[2] group-hover:opacity-100",
                                        item.glow
                                    )} />

                                    {/* Large Background Icon */}
                                    <div className={cn(
                                        "absolute top-0 right-0 p-6 opacity-10 transition-all duration-700",
                                        "group-hover:opacity-25 group-hover:scale-110 group-hover:rotate-12",
                                        item.color
                                    )}>
                                        <item.icon className="w-24 h-24" />
                                    </div>

                                    {/* Icon Container with Pulse Animation */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 relative z-10 transition-all duration-500",
                                        "border group-hover:border-white/30 group-hover:scale-110 group-hover:rotate-6",
                                        "group-hover:shadow-lg",
                                        item.borderColor,
                                        item.color
                                    )}>
                                        <item.icon className="w-7 h-7 transition-transform duration-500 group-hover:scale-110" />
                                        {/* Pulse Ring */}
                                        <div className={cn(
                                            "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                            "animate-ping",
                                            item.borderColor
                                        )} />
                                    </div>

                                    <h3 className="text-xl font-bold font-headline mb-3 relative z-10 transition-colors duration-300 group-hover:text-white">
                                        {item.title}
                                    </h3>
                                    <p className="text-white/60 leading-relaxed relative z-10 text-sm transition-colors duration-300 group-hover:text-white/80">
                                        {item.desc}
                                    </p>

                                    {/* Interactive Arrow Indicator */}
                                    <div className={cn(
                                        "absolute bottom-4 right-4 opacity-0 transition-all duration-500",
                                        "group-hover:opacity-100 group-hover:translate-x-0 translate-x-2",
                                        item.color
                                    )}>
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. The Path to Privilege */}
                <section id="tiers" className="py-32 relative z-10">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-24">
                            <span className="text-[#d97706] font-bold tracking-widest uppercase mb-4 block">The Ladder</span>
                            <h2 className="text-4xl md:text-6xl font-headline font-black">Path to <span className="gold-gradient">Privilege</span></h2>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <Skeleton className="h-[400px] w-full rounded-3xl bg-white/5" />
                                <Skeleton className="h-[400px] w-full rounded-3xl bg-white/5" />
                                <Skeleton className="h-[400px] w-full rounded-3xl bg-white/5" />
                                <Skeleton className="h-[400px] w-full rounded-3xl bg-white/5" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {loyaltyTiers?.map((tier, idx) => (
                                    <div key={tier.id} className="relative group">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl z-10 transition-transform duration-300 group-hover:scale-110 mb-8 font-black text-xl backdrop-blur-md bg-black/40",
                                                tier.name.toLowerCase().includes('member') ? 'text-stone-400 border-stone-500' :
                                                    tier.name.toLowerCase().includes('bronze') ? 'text-[#cd7f32] border-[#cd7f32]' :
                                                        tier.name.toLowerCase().includes('gold') ? 'text-[#ffd700] border-[#ffd700]' :
                                                            tier.name.toLowerCase().includes('platinum') ? 'text-indigo-400 border-indigo-400' :
                                                                'text-white border-white'
                                            )}>
                                                {idx + 1}
                                            </div>

                                            <div className="glass-card w-full p-8 rounded-3xl text-center min-h-[300px] flex flex-col items-center border-t-4 border-t-current bg-black/20"
                                                style={{
                                                    borderColor:
                                                        tier.name.toLowerCase().includes('member') ? '#78716c' :
                                                            tier.name.toLowerCase().includes('bronze') ? '#cd7f32' :
                                                                tier.name.toLowerCase().includes('gold') ? '#ffd700' :
                                                                    tier.name.toLowerCase().includes('platinum') ? '#818cf8' :
                                                                        '#ffffff'
                                                }}>
                                                <h3 className="text-3xl font-headline font-black mb-2">{tier.name}</h3>
                                                <p className="text-[#d97706] font-bold mb-6 font-mono text-sm">{tier.price}</p>
                                                <ul className="space-y-3 text-white/70 text-sm">
                                                    {tier.perks.map((perk, pIdx) => (
                                                        <li key={pIdx} className="flex items-center gap-2">
                                                            <Sparkles className="w-3 h-3 text-[#d97706]" /> {perk}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 5. Maximize Earning Power */}
                <section className="py-32 relative z-10">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="glass-card rounded-[3rem] p-8 md:p-16 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#d97706]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

                            <div className="flex flex-col lg:flex-row gap-16 items-start">
                                <div className="flex-1 space-y-6 relative z-10">
                                    <h2 className="text-4xl md:text-5xl font-headline font-black leading-tight">
                                        Maximize Your <br />
                                        <span className="text-[#d97706]">Earning Power</span>
                                    </h2>
                                    <p className="text-white/60 text-lg leading-relaxed">
                                        The more you enjoy, the faster you ascend. Our progressive earning structure ensures your loyalty is rewarded exponentially.
                                    </p>
                                    <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-[#d97706]/10 border border-[#d97706]/20 mt-4">
                                        <TrendingUp className="w-8 h-8 text-[#d97706]" />
                                        <div>
                                            <div className="font-bold text-white">Compound Rewards</div>
                                            <div className="text-xs text-white/50">Details subject to change</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full bg-black/40 rounded-3xl p-2 border border-white/5 backdrop-blur-md">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/40">
                                            <tr>
                                                <th className="p-6">Spend</th>
                                                <th className="p-6">Earnings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-mono">
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="p-6 text-white/80">0 – 999</td>
                                                <td className="p-6 font-bold text-[#d97706]">0.25%</td>
                                            </tr>
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="p-6 text-white/80">1k – 5k</td>
                                                <td className="p-6 font-bold text-[#d97706]">0.50%</td>
                                            </tr>
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="p-6 text-white/80">5k – 10k</td>
                                                <td className="p-6 font-bold text-[#d97706]">1.00%</td>
                                            </tr>
                                            <tr className="bg-[#d97706]/10 hover:bg-[#d97706]/20 transition-colors">
                                                <td className="p-6 font-bold text-white">10k+</td>
                                                <td className="p-6 font-bold text-[#d97706] text-lg">2.00%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. CTA Footer */}
                <section className="py-32 text-center relative z-10">
                    <div className="relative z-10 container mx-auto px-4">
                        <h2 className="text-5xl md:text-7xl font-headline font-black mb-8 tracking-tighter">
                            Ready to <span className="text-[#d97706]">Ascend?</span>
                        </h2>
                        <Button asChild size="lg" className="rounded-full h-20 px-12 bg-white text-black hover:bg-white/90 text-xl font-bold transition-transform hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <Link href="/signup/customer">Create Free Account</Link>
                        </Button>
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
}
