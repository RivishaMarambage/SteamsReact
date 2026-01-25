'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight, Calendar, Star, Flame, Utensils } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type ItemBadge = {
    text: string;
    icon?: any;
    variant?: 'accent' | 'default' | 'secondary';
};

type FeaturedItem =
    | {
        type: 'item';
        name: string;
        description: string;
        price: number;
        rating: number;
        badge: ItemBadge;
        imageUrl: string;
        imageHint: string;
    }
    | {
        type: 'event';
        name: string;
        description: string;
        badges: ItemBadge[];
        time: string;
        imageUrl: string;
        imageHint: string;
    };

const featuredItemsData: FeaturedItem[] = [
    {
        type: 'item',
        name: 'House Blend',
        description: 'Taste our customer favorite blends, from our signature dark roast to our creamy caramel macchiato.',
        price: 800,
        rating: 4,
        badge: { text: 'Best Seller', icon: Star },
        imageUrl: 'https://images.unsplash.com/photo-1511920183353-3c9c93dae237?q=80&w=1887&auto=format&fit=crop',
        imageHint: 'latte art'
    },
    {
        type: 'item',
        name: 'Pumpkin Spice Latte',
        description: 'Embrace the season with our pumpkin spice latte and maple pecan pastries. Warm spices for cool days.',
        price: 800,
        rating: 5,
        badge: { text: 'Limited Time', icon: Flame },
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1887&auto=format&fit=crop',
        imageHint: 'cinnamon coffee'
    },
    {
        type: 'event',
        name: 'Acoustic Nights',
        description: 'Join us for live acoustic music sessions every Friday evening. Good vibes, great coffee, and local talent.',
        badges: [
            { text: 'Free Entry', variant: 'accent' },
            { text: 'This Friday', icon: Calendar }
        ],
        time: '7:00 PM - 10:00 PM',
        imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2070&auto=format&fit=crop',
        imageHint: 'outdoor concert'
    }
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5 text-yellow-500">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-current" : "fill-transparent stroke-current")} />
            ))}
        </div>
    )
}

export default function HighlightsSection() {
    return (
        <section className="bg-[#f2efe9] text-card-foreground py-20 lg:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-4xl font-headline font-black lg:text-5xl tracking-tight text-black">Highlights & Favorites</h2>
                        <p className="text-[#6b584b] mt-3 max-w-xl text-lg font-body">Explore our community favorites, seasonal delights, and upcoming events. Handpicked for you.</p>
                    </div>
                    <Button asChild variant="link" className="hidden md:flex text-base font-bold text-black hover:text-[#d97706] transition-colors p-0">
                        <Link href="/menu">View Full Menu <Utensils className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredItemsData.map((item, index) => (
                        <Card key={index} className="flex flex-col overflow-hidden border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white rounded-2xl group cursor-pointer">
                            <div className="relative h-72 w-full overflow-hidden">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    data-ai-hint={item.imageHint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                {item.type === 'item' && (
                                    <>
                                        <Badge className="absolute bottom-4 left-4 bg-black text-white px-3 py-1.5 rounded-full border-none font-medium flex items-center gap-1.5 shadow-lg">
                                            {item.badge.icon && <item.badge.icon className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />}
                                            {item.badge.text}
                                        </Badge>
                                        <Badge className="absolute top-4 right-4 bg-white text-black px-4 py-1.5 rounded-full font-bold shadow-lg border-none text-sm">
                                            Rs {item.price}
                                        </Badge>
                                    </>
                                )}
                                {item.type === 'event' && (
                                    <>
                                        {item.badges.map(badge => (
                                            badge.text === 'Free Entry' ? (
                                                <Badge key={badge.text} className="absolute top-4 right-4 bg-[#f97316] text-white px-4 py-1.5 rounded-full font-bold shadow-lg border-none text-sm">
                                                    {badge.text}
                                                </Badge>
                                            ) : (
                                                <Badge key={badge.text} className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border-none font-medium flex items-center gap-1.5 shadow-lg">
                                                    {badge.icon && <badge.icon className="h-3.5 w-3.5 text-[#f97316]" />}
                                                    {badge.text}
                                                </Badge>
                                            )
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="mb-2">
                                    <h3 className="font-headline font-bold text-2xl text-black mb-1">{item.name}</h3>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-[#6b584b] text-base leading-relaxed line-clamp-3 font-body">{item.description}</p>
                                </div>
                                <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#f0ebe6]">
                                    {item.type === 'item' ? (
                                        <StarRating rating={item.rating} />
                                    ) : (
                                        <p className="text-sm font-medium text-[#6b584b] flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-[#f97316]"></span>
                                            {item.time}
                                        </p>
                                    )}
                                    {item.type === 'event' && (
                                        <Button className="rounded-full bg-[#e5e5e5] text-black hover:bg-[#d4d4d4] font-bold h-8 px-4 text-xs">RSVP</Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <Button asChild variant="link" className="flex md:hidden mt-8 mx-auto text-base font-bold text-black">
                    <Link href="/menu">View Full Menu <Utensils className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
        </section>
    )
}
