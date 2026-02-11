'use client';

import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewsBanner() {
    return (
        <div className="w-full bg-[#1a110a] border-t border-b border-white/5 py-6">
            <div className="container mx-auto px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-[#d97706] text-white p-2 rounded-full">
                        <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-white font-headline font-bold uppercase text-sm tracking-tight hidden sm:block">
                        Latest: Experience our new Ethiopian Yirgacheffe harvest.
                    </p>
                    <p className="text-white font-headline font-bold uppercase text-xs sm:hidden">
                        New Arrival: Ethiopian Harvest
                    </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-white/5 font-bold uppercase text-xs">
                    <Link href="/updates" className="flex items-center gap-1">
                        Details <ChevronRight className="w-4 h-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
