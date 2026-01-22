'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight, Calendar, Star, Flame, SlidersHorizontal } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

// I will hardcode the items for now to match the design.
// A better approach would be to have a 'featured' flag in Firestore.
const featuredItemsData = [
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
        <section className="bg-card text-card-foreground py-16 lg:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-headline font-bold sm:text-4xl">Highlights & Favorites</h2>
                        <p className="text-muted-foreground mt-2 max-w-xl">Explore our community favorites, seasonal delights, and upcoming events. Handpicked for you.</p>
                    </div>
                    <Button asChild variant="link" className="hidden md:flex text-base">
                        <Link href="/menu">View Full Menu <SlidersHorizontal className="ml-2" /></Link>
                    </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredItemsData.map((item, index) => (
                        <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-background">
                            <div className="relative h-64 w-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={item.imageHint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                {item.type === 'item' && (
                                    <>
                                        <Badge className="absolute top-3 left-3 bg-black/50 border-none text-white">
                                            {item.badge.icon && <item.badge.icon className="mr-2 h-4 w-4" />}
                                            {item.badge.text}
                                        </Badge>
                                         <Badge className="absolute top-3 right-3 text-sm">
                                            Rs {item.price}
                                        </Badge>
                                    </>
                                )}
                                {item.type === 'event' && (
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                        {item.badges.map(badge => (
                                             <Badge key={badge.text} variant={badge.variant === 'accent' ? 'default' : 'secondary'} className={cn(badge.variant === 'accent' && 'bg-accent text-accent-foreground')}>
                                                {badge.icon && <badge.icon className="mr-2 h-4 w-4" />}
                                                {badge.text}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground text-sm">{item.description}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center">
                                {item.type === 'item' ? (
                                    <StarRating rating={item.rating} />
                                ) : (
                                    <p className="text-sm text-muted-foreground">{item.time}</p>
                                )}
                                {item.type === 'event' && (
                                     <Button variant="outline" size="sm">RSVP</Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 <Button asChild variant="link" className="flex md:hidden mt-8 mx-auto text-base">
                    <Link href="/menu">View Full Menu <SlidersHorizontal className="ml-2" /></Link>
                </Button>
            </div>
        </section>
    )
}
