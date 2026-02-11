'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export default function HighlightsSection() {
  const highlights = [
    {
      id: 'h1',
      title: 'Artisan Roastery',
      subtitle: 'Crafted with Precision',
      description: 'Our beans are sourced directly from sustainable farms and roasted in small batches to preserve unique flavor profiles.',
      image: PlaceHolderImages.find(p => p.id === 'sensory-4'),
      align: 'left'
    },
    {
      id: 'h2',
      title: 'Ceylon Tea Tradition',
      subtitle: 'A Taste of Home',
      description: 'Experience authentic Sri Lankan tea culture with our hand-picked selections, served with modern elegance.',
      image: PlaceHolderImages.find(p => p.id === 'about-main'),
      align: 'right'
    }
  ];

  return (
    <section className="bg-[#1a110a] py-24 lg:py-40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="space-y-32">
          {highlights.map((item, idx) => (
            <div 
              key={item.id} 
              className={cn(
                "flex flex-col lg:items-center gap-12 lg:gap-24",
                item.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'
              )}
            >
              {/* Text Side */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <span className="text-primary font-black text-xs uppercase tracking-[0.2em]">{item.subtitle}</span>
                  <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase italic tracking-tighter leading-[0.9]">
                    {item.title}
                  </h2>
                </div>
                <p className="text-stone-400 text-lg leading-relaxed max-w-xl font-body">
                  {item.description}
                </p>
                <div className="h-[2px] w-20 bg-primary/30" />
              </div>

              {/* Image Side */}
              <div className="flex-1">
                <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5">
                  <Image
                    src={item.image?.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    data-ai-hint={item.image?.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
