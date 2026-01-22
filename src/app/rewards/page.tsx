
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicHeader from '@/components/layout/PublicHeader';

export default function RewardsPage() {
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll<HTMLElement>('.reveal');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          if (!element.classList.contains('active')) {
            element.classList.add('active');
            const fill = element.querySelector<HTMLElement>('.gauge-fill');
            if (fill) {
              const targetWidth = fill.style.width;
              if (targetWidth) {
                fill.style.width = '0%';
                setTimeout(() => {
                  fill.style.width = targetWidth;
                }, 100);
              }
            }
          }
        }
      });
    };

    window.addEventListener('scroll', reveal);
    reveal(); 

    return () => window.removeEventListener('scroll', reveal);
  }, []);

  return (
    <div className="antialiased font-body text-gray-200 bg-charcoal overflow-x-hidden">
      <PublicHeader />
      <div className="steam-container">
        <div className="cloud" style={{ top: '-10%', left: '-10%' }}></div>
        <div className="cloud" style={{ top: '60%', left: '80%', animationDelay: '-5s' }}></div>
      </div>

      <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="z-10">
          <h1 className="text-5xl md:text-8xl font-bold mb-4 tracking-tight uppercase font-headline">
            The <span className="gold-gradient italic">Steamsbury</span> Club
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Loyalty & Rewards redefined. An exclusive journey designed for our most dedicated patrons.
          </p>
          <div className="mt-10 animate-bounce">
            <a href="#about" className="text-brass">
              <ArrowDown className="w-10 h-10 mx-auto" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </header>
      
      <main>
        <section id="about" className="py-24 px-6 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="reveal">
                    <h2 className="text-4xl font-bold mb-6 font-headline">What are <span className="text-brass">Steam Points?</span></h2>
                    <p className="text-gray-400 mb-6 text-lg">
                        Steam Points are the official currency of our club. Each point is a direct reflection of your loyalty, carrying a tangible value to enhance your future experiences.
                    </p>
                    <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border-l-4 border-brass">
                        <span className="text-5xl font-bold text-brass">LKR 1</span>
                        <span className="text-xl text-gray-300">= 1 Steam Point</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div className="glass-card p-6 rounded-xl reveal" style={{ transitionDelay: '0.2s' }}>
                        <h3 className="text-brass font-bold mb-2 font-headline">Redeemable Rewards</h3>
                        <p className="text-sm text-gray-400">Unlock Bronze tier or higher to pay with points on any purchase.</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl reveal" style={{ transitionDelay: '0.4s' }}>
                        <h3 className="text-brass font-bold mb-2 font-headline">Tier Protection</h3>
                        <p className="text-sm text-gray-400">Spending points never lowers your status. Tiers are for life.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-24 bg-black/30">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16 font-headline">The Path to <span className="gold-gradient">Privilege</span></h2>
                <div className="grid md:grid-cols-4 gap-8 relative">
                    <div className="text-center reveal" style={{ transitionDelay: '0.1s' }}>
                        <div className="w-16 h-16 bg-brass text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(212,175,55,0.4)]">1</div>
                        <h3 className="font-semibold mb-2 font-headline">Visit & Sign Up</h3>
                        <p className="text-sm text-gray-500">In-store or online via our digital portal.</p>
                    </div>
                    <div className="text-center reveal" style={{ transitionDelay: '0.3s' }}>
                        <div className="w-16 h-16 bg-brass text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(212,175,55,0.4)]">2</div>
                        <h3 className="font-semibold mb-2 font-headline">Register</h3>
                        <p className="text-sm text-gray-500">A simple form to get your journey started.</p>
                    </div>
                    <div className="text-center reveal" style={{ transitionDelay: '0.5s' }}>
                        <div className="w-16 h-16 bg-brass text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(212,175,55,0.4)]">3</div>
                        <h3 className="font-semibold mb-2 font-headline">Get Your ID</h3>
                        <p className="text-sm text-gray-500">Instant digital card or premium physical card.</p>
                    </div>
                    <div className="text-center reveal" style={{ transitionDelay: '0.7s' }}>
                        <div className="w-16 h-16 bg-brass text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(212,175,55,0.4)]">4</div>
                        <h3 className="font-semibold mb-2 font-headline">Earn</h3>
                        <p className="text-sm text-gray-500">Points start accumulating from your first LKR.</p>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-24 px-6 max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center font-headline">Earning Power</h2>
            <div className="overflow-x-auto glass-card rounded-2xl">
                <table className="w-full text-left">
                    <thead className="bg-white/10 text-brass uppercase text-sm tracking-widest">
                        <tr>
                            <th className="p-6">Bill Value (LKR)</th>
                            <th className="p-6">Steam Points Earned</th>
                            <th className="p-6">Return Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/5 transition">
                            <td className="p-6">0 – 999</td>
                            <td className="p-6">1 point per LKR 400</td>
                            <td className="p-6 text-gray-500">~0.25%</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition">
                            <td className="p-6">1,000 – 4,999</td>
                            <td className="p-6 font-bold">1 point per LKR 200</td>
                            <td className="p-6 text-gray-500">~0.50%</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition">
                            <td className="p-6 text-brass">5,000 – 9,999</td>
                            <td className="p-6 font-bold">1 point per LKR 100</td>
                            <td className="p-6 text-gray-500">~1.00%</td>
                        </tr>
                        <tr className="bg-brass/10 border-l-4 border-brass">
                            <td className="p-6 font-bold">10,000+</td>
                            <td className="p-6 font-bold">2 points per LKR 100</td>
                            <td className="p-6 font-bold">~2.00%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section className="py-24 bg-black/50 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16 font-headline">Loyalty Status</h2>
                <div className="space-y-12">
                    <div className="reveal">
                        <div className="flex justify-between mb-2 items-end">
                            <span className="text-xl font-bold tracking-widest">MEMBER</span>
                            <span className="text-gray-500 text-sm">0 – 99 pts</span>
                        </div>
                        <div className="gauge-bar"><div className="gauge-fill" style={{ width: '20%' }}></div></div>
                    </div>
                    <div className="reveal" style={{ transitionDelay: '0.1s' }}>
                        <div className="flex justify-between mb-2 items-end">
                            <span className="text-xl font-bold text-[#cd7f32] tracking-widest">BRONZE</span>
                            <span className="text-gray-500 text-sm">100 – 499 pts</span>
                        </div>
                        <div className="gauge-bar"><div className="gauge-fill" style={{ width: '40%' }}></div></div>
                    </div>
                    <div className="reveal" style={{ transitionDelay: '0.15s' }}>
                        <div className="flex justify-between mb-2 items-end">
                            <span className="text-xl font-bold text-gray-400 tracking-widest">SILVER</span>
                            <span className="text-gray-500 text-sm">500 – 1,999 pts</span>
                        </div>
                        <div className="gauge-bar"><div className="gauge-fill" style={{ width: '60%' }}></div></div>
                    </div>
                    <div className="reveal" style={{ transitionDelay: '0.2s' }}>
                        <div className="flex justify-between mb-2 items-end">
                            <span className="text-xl font-bold text-brass tracking-widest">GOLD</span>
                            <span className="text-gray-500 text-sm">2,000 – 4,999 pts</span>
                        </div>
                        <div className="gauge-bar"><div className="gauge-fill" style={{ width: '75%' }}></div></div>
                    </div>
                    <div className="reveal" style={{ transitionDelay: '0.3s' }}>
                        <div className="flex justify-between mb-2 items-end">
                            <span className="text-xl font-bold text-white tracking-widest">PLATINUM <span className="ml-2 text-xs bg-white text-black px-2 py-1 rounded">ULTIMATE</span></span>
                            <span className="text-gray-500 text-sm">5,000+ pts</span>
                        </div>
                        <div className="gauge-bar"><div className="gauge-fill" style={{ width: '100%', boxShadow: '0 0 15px white' }}></div></div>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-32 text-center relative">
            <div className="z-10 relative">
                <h2 className="text-5xl font-bold mb-8 font-headline">Ready to <span className="gold-gradient">Build Steam?</span></h2>
                <p className="text-gray-400 mb-10 max-w-xl mx-auto">
                    Join The Steamsbury Club today and turn your daily ritual into a journey of rewards.
                </p>
                 <Button asChild size="lg" className="bg-brass text-black font-bold py-4 px-12 rounded-full text-lg hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:bg-brass/90 h-auto">
                    <Link href="/signup/customer">JOIN THE CLUB TODAY</Link>
                </Button>
                <p className="mt-8 text-xs text-gray-600 uppercase tracking-widest">Terms & Conditions Apply</p>
            </div>
        </section>

      </main>
      <footer className="py-12 border-t border-white/5 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Steamsbury. All rights reserved. 
      </footer>
    </div>
  );
}
