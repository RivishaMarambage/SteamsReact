'use client';

import React from 'react';

export default function HighlightsSection() {
  return (
    <section className="bg-[#1a110a] py-24 border-t border-white/5">
      <div className="container mx-auto px-4 text-center">
        <p className="text-stone-500 font-bold uppercase tracking-[0.2em] text-xs">Our Story</p>
        <h2 className="text-4xl font-headline font-bold text-white mt-4 uppercase">Artisan Roastery & Tea Tradition</h2>
        <div className="mt-8 max-w-3xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </section>
  );
}
