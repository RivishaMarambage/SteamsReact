'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function OffersHighlight() {
  return (
    <section className="bg-stone-100 py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-headline font-bold text-[#2c1810] uppercase tracking-tight">
              Featured <span className="text-primary">Offers</span>
            </h2>
            <p className="text-[#6b584b] mt-2 font-medium">Deals to make your journey even more delightful.</p>
          </div>
          <Button asChild variant="link" className="text-primary font-black uppercase tracking-widest p-0">
            <Link href="/offers" className="flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Minimal placeholders for offers */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-white rounded-[2rem] border border-stone-200 flex items-center justify-center p-8 text-center">
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-sm">Offer Preview {i}</p>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
