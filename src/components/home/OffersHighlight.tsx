'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, ArrowRight, Sparkles } from 'lucide-react';

export default function OffersHighlight() {
  const highlightOffers = [
    {
      title: "Morning Perk",
      desc: "50% off your second cup before 10 AM.",
      tag: "Limited Time",
      color: "from-[#d97706] to-[#f59e0b]"
    },
    {
      title: "Member Exclusive",
      desc: "Double points on all specialty lattes this weekend.",
      tag: "Club Offer",
      color: "from-stone-800 to-stone-900"
    },
    {
      title: "Sweet Pairing",
      desc: "Free croissant with any Platinum drip coffee.",
      tag: "Seasonal",
      color: "from-primary to-orange-600"
    }
  ];

  return (
    <section className="bg-stone-100 py-24 lg:py-40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-headline font-black text-[#2c1810] uppercase italic tracking-tighter">
              Featured <span className="text-primary not-italic">Offers</span>
            </h2>
            <p className="text-[#6b584b] text-lg font-medium max-w-xl leading-tight">
              Hand-picked deals to make your Steamsbury journey even more delightful.
            </p>
          </div>
          <Button asChild variant="link" className="text-primary font-black uppercase tracking-widest group p-0">
            <Link href="/offers" className="flex items-center gap-2">
              View All Offers <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlightOffers.map((offer, idx) => (
            <Card 
              key={idx} 
              className="relative border-none overflow-hidden rounded-[2.5rem] shadow-xl group hover:-translate-y-2 transition-all duration-500"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${offer.color} opacity-90`} />
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Tag className="w-24 h-24 rotate-12" />
              </div>
              
              <CardHeader className="relative z-10 pt-10 pb-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest mb-4">
                  {offer.tag}
                </span>
                <CardTitle className="text-3xl font-headline font-black text-white uppercase italic leading-none">
                  {offer.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 pb-10">
                <p className="text-white/80 text-lg leading-tight font-medium mb-8">
                  {offer.desc}
                </p>
                <Button asChild className="rounded-full bg-white text-black hover:bg-black hover:text-white transition-all font-black text-xs uppercase tracking-widest shadow-lg">
                  <Link href="/menu">Claim Offer</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
