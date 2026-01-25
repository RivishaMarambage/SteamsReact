'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, Crown, Star, Gift, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function RewardsPage() {
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
                    {/* Animated Particles/Clouds */}
                    <div className="steam-container opacity-30">
                        <div className="cloud" style={{ top: '-10%', left: '-10%' }}></div>
                        <div className="cloud" style={{ top: '60%', left: '80%', animationDelay: '-5s' }}></div>
                    </div>
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

                {/* 2. Glassmorphism Benefits Grid */}
                <section className="py-32 relative z-10 opacity-100">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-6xl font-headline font-black mb-6">Why Join?</h2>
                            <p className="text-white/50 text-xl max-w-xl mx-auto">Three simple reasons to make every sip count.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every rupee spent. Points never expire.", color: "text-amber-400", glow: "bg-amber-500/20" },
                                { icon: Gift, title: "Redeem Rewards", desc: "Use points to pay for your favorite drinks, food, or merchandise.", color: "text-rose-400", glow: "bg-rose-500/20" },
                                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades.", color: "text-emerald-400", glow: "bg-emerald-500/20" },
                            ].map((item, idx) => (
                                <div key={idx} className="glass-card p-10 rounded-3xl group relative overflow-hidden hover:-translate-y-2 transition-transform duration-500">
                                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] transition-all duration-500 group-hover:blur-[80px] group-hover:scale-150 ${item.glow}`} />

                                    <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${item.color}`}>
                                        <item.icon className="w-32 h-32 transform group-hover:rotate-12 transition-transform duration-700" />
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:border-white/20 transition-colors relative z-10 ${item.color}`}>
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-headline mb-4 relative z-10">{item.title}</h3>
                                    <p className="text-white/60 leading-relaxed relative z-10">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. The Path to Privilege */}
                <section id="tiers" className="py-32 relative z-10">
                    {/* Subtle separator line can remain if desired, or remove for seamlessness */}
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-24">
                            <span className="text-[#d97706] font-bold tracking-widest uppercase mb-4 block">The Ladder</span>
                            <h2 className="text-4xl md:text-6xl font-headline font-black">Path to <span className="gold-gradient">Privilege</span></h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { name: "Member", price: "Free", perks: ["Earn 1pt / 400 LKR", "Digital Card"], color: "bg-stone-700" },
                                { name: "Bronze", price: "100 pts", perks: ["Earn 1pt / 200 LKR", "Pay with Points"], color: "bg-amber-700" },
                                { name: "Gold", price: "5000 pts", perks: ["Earn 1pt / 100 LKR", "Priority Service"], color: "bg-yellow-600" },
                                { name: "Platinum", price: "10000 pts", perks: ["2x Points", "Free Birthday Drink", "Personal Barista"], color: "bg-indigo-900" },
                            ].map((tier, idx) => (
                                <div key={idx} className="relative group">
                                    {idx !== 3 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-1 bg-white/10 -z-10" />}

                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl z-10 transition-transform duration-300 group-hover:scale-110 mb-8 font-black text-xl backdrop-blur-md bg-black/40",
                                            tier.name === 'Member' ? 'text-stone-400 border-stone-500' :
                                                tier.name === 'Bronze' ? 'text-[#cd7f32] border-[#cd7f32]' :
                                                    tier.name === 'Gold' ? 'text-[#ffd700] border-[#ffd700]' :
                                                        'text-white border-white'
                                        )}>
                                            {idx + 1}
                                        </div>

                                        <div className="glass-card w-full p-8 rounded-3xl text-center min-h-[300px] flex flex-col items-center border-t-4 border-t-current bg-black/20" style={{ borderColor: tier.name === 'Member' ? '#78716c' : tier.name === 'Bronze' ? '#cd7f32' : tier.name === 'Gold' ? '#ffd700' : '#ffffff' }}>
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
                    </div>
                </section>

                {/* 4. Stats / Earning Table */}
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

                {/* 5. CTA Footer */}
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
