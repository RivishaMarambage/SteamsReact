'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Bell, Star, Calendar, ArrowRight, ChevronRight } from 'lucide-react';

/**
 * UpdatesPage
 * A self-contained, immersive updates page with a dark coffee theme.
 * Resolves path errors by including core UI components locally.
 */

// --- Mock Components for Internal Logic ---

const Header = () => (
  <header className="w-full py-6 px-8 flex justify-between items-center bg-[#1a110a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-[#6F4E37] rounded-full flex items-center justify-center">
        <Coffee className="text-white w-6 h-6" />
      </div>
      <span className="text-white font-bold text-xl tracking-tight">STEAMSBURRY</span>
    </div>
    <nav className="hidden md:flex gap-8 text-stone-300 text-sm font-medium">
      <a href="#" className="hover:text-white transition-colors">Menu</a>
      <a href="#" className="hover:text-white transition-colors">Locations</a>
      <a href="#" className="text-white border-b-2 border-[#6F4E37]">Updates</a>
    </nav>
    <button className="bg-[#6F4E37] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#5d412e] transition-colors">
      Order Now
    </button>
  </header>
);

const Footer = () => (
  <footer className="bg-[#0f0a06] py-12 px-8 border-t border-white/5 mt-20">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      <div>
        <h3 className="text-white font-bold mb-4">Steamsburry Coffee Roasters</h3>
        <p className="text-stone-500 text-sm leading-relaxed">
          Crafting the perfect cup since 2012. Our beans are ethically sourced and roasted in small batches.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-stone-300 font-semibold mb-2 text-sm">Links</h4>
        <a href="#" className="text-stone-500 hover:text-[#6F4E37] text-sm transition-colors">Sustainability</a>
        <a href="#" className="text-stone-500 hover:text-[#6F4E37] text-sm transition-colors">Careers</a>
        <a href="#" className="text-stone-500 hover:text-[#6F4E37] text-sm transition-colors">Privacy Policy</a>
      </div>
      <div>
        <h4 className="text-stone-300 font-semibold mb-2 text-sm">Newsletter</h4>
        <div className="flex gap-2">
          <input 
            type="email" 
            placeholder="Your email" 
            className="bg-[#1a110a] border border-stone-800 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-[#6F4E37]"
          />
          <button className="bg-stone-800 text-white p-2 rounded-lg hover:bg-stone-700 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div className="text-center mt-12 pt-8 border-t border-white/5 text-stone-600 text-xs">
      © 2024 Steamsburry Coffee Roasters. All rights reserved.
    </div>
  </footer>
);

const UpdatesTimeline = () => {
  const updates = [
    {
      id: 1,
      title: "The Lavender Haze Latte",
      date: "July 15, 2024",
      tag: "Seasonal",
      color: "bg-purple-500",
      content: "Discover the floral and sweet notes of our latest creation, available for a limited time only. It's the perfect summer refreshment!",
      icon: <Star className="w-5 h-5 text-white" />
    },
    {
      id: 2,
      title: "Local Artist Gallery",
      date: "July 05, 2024",
      tag: "Community",
      color: "bg-amber-500",
      content: "We're excited to showcase the amazing talent from our community. Come enjoy a coffee and some beautiful art in-house.",
      icon: <Bell className="w-5 h-5 text-white" />
    },
    {
      id: 3,
      title: "Double Points Mondays",
      date: "June 28, 2024",
      tag: "Loyalty",
      color: "bg-emerald-500",
      content: "We're making Mondays a little brighter. All loyalty members now earn double the points on all purchases every single Monday.",
      icon: <Calendar className="w-5 h-5 text-white" />
    }
  ];

  return (
    <section className="max-w-4xl mx-auto py-16 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">Freshly Roasted Updates</h1>
        <p className="text-stone-400 text-lg">Stay in the loop with the latest from Steamsburry.</p>
      </motion.div>

      <div className="relative space-y-12">
        {/* The Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#6F4E37] via-stone-800 to-transparent md:left-1/2 md:-translate-x-px"></div>

        {updates.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative flex items-center justify-between w-full mb-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
          >
            {/* Center Dot */}
            <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-[#6F4E37] rounded-full border-4 border-[#1a110a] -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(111,78,55,0.5)]"></div>

            {/* Content Card */}
            <div className="ml-20 md:ml-0 md:w-[45%]">
              <div className="bg-[#2a1d14] p-6 rounded-3xl border border-white/5 hover:border-[#6F4E37]/30 transition-all group shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${item.color} shadow-lg`}>
                    {item.icon}
                  </div>
                  <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">{item.date}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#d4a373] transition-colors">{item.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed mb-4">{item.content}</p>
                <button className="flex items-center gap-2 text-[#6F4E37] text-sm font-bold hover:gap-3 transition-all">
                  Read Full Story <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Empty space for balance on desktop */}
            <div className="hidden md:block w-[45%]"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// --- Main Page Component ---

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a110a] selection:bg-[#6F4E37] selection:text-white">
      <Header />
      
      <main className="flex-1">
        <UpdatesTimeline />
      </main>
      
      <Footer />
    </div>
  );
}
