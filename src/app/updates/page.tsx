'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Star, Calendar, ChevronRight } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * UpdatesPage
 * An immersive updates page aligned with the Steamsbury brand.
 * Uses system-wide PublicHeader and Footer for consistent navigation.
 */

const updates = [
  {
    id: 1,
    title: "The Lavender Haze Latte",
    date: "July 15, 2024",
    tag: "Seasonal",
    color: "bg-purple-500",
    content: "Discover the floral and sweet notes of our latest creation, available for a limited time only. It's the perfect summer refreshment!",
    icon: <Star className="w-5 h-5 text-white" />,
    image: PlaceHolderImages.find(p => p.id === 'latte')
  },
  {
    id: 2,
    title: "Local Artist Gallery",
    date: "July 05, 2024",
    tag: "Community",
    color: "bg-amber-500",
    content: "We're excited to showcase the amazing talent from our community. Come enjoy a coffee and some beautiful art in-house.",
    icon: <Bell className="w-5 h-5 text-white" />,
    image: PlaceHolderImages.find(p => p.id === 'gallery-interior-1')
  },
  {
    id: 3,
    title: "Double Points Mondays",
    date: "June 28, 2024",
    tag: "Loyalty",
    color: "bg-emerald-500",
    content: "We're making Mondays a little brighter. All loyalty members now earn double the points on all purchases every single Monday.",
    icon: <Calendar className="w-5 h-5 text-white" />,
    image: PlaceHolderImages.find(p => p.id === 'espresso')
  }
];

export default function UpdatesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a110a] selection:bg-primary selection:text-white">
      {/* System Standard Header */}
      <PublicHeader />
      
      <main className="flex-1 pt-32 pb-20">
        <section className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white mb-6 tracking-tight">
              Freshly <span className="text-primary italic">Roasted</span> Updates
            </h1>
            <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto font-body">
              Stay in the loop with the latest seasonal brews, community happenings, and exclusive member perks from Steamsbury.
            </p>
          </motion.div>

          <div className="relative space-y-16">
            {/* The Animated Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-stone-800 to-transparent md:left-1/2 md:-translate-x-px"></div>

            {updates.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`relative flex flex-col md:flex-row items-center justify-between w-full gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Center Timeline Node */}
                <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full border-4 border-[#1a110a] -translate-x-1/2 z-10 shadow-[0_0_20px_rgba(217,119,6,0.6)] hidden md:block"></div>

                {/* Content Card */}
                <div className="ml-16 md:ml-0 md:w-[45%] w-full">
                  <div className="bg-stone-900/40 backdrop-blur-sm p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-all duration-500 group shadow-2xl overflow-hidden">
                    {/* Mobile Only Image */}
                    <div className="md:hidden relative w-full aspect-video mb-6 rounded-2xl overflow-hidden">
                        {item.image && (
                            <Image 
                                src={item.image.imageUrl} 
                                alt={item.image.description} 
                                fill 
                                className="object-cover"
                                data-ai-hint={item.image.imageHint}
                            />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-2xl ${item.color} shadow-lg transition-transform group-hover:scale-110 duration-500`}>
                        {item.icon}
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-1">
                          {item.tag}
                        </span>
                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest leading-none">
                          {item.date}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-2xl font-headline font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-stone-400 text-sm leading-relaxed mb-6 font-body">
                      {item.content}
                    </p>
                    <button className="flex items-center gap-2 text-primary text-sm font-bold hover:gap-4 transition-all duration-300">
                      Read Full Story <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Desktop Only Image Card */}
                <div className="hidden md:block w-[45%] aspect-video relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
                    {item.image && (
                        <Image 
                            src={item.image.imageUrl} 
                            alt={item.image.description} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            data-ai-hint={item.image.imageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      
      {/* System Standard Footer */}
      <Footer />
    </div>
  );
}
