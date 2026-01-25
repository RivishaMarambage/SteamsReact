
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyOffer, MenuItem } from "@/lib/types";
import { collection, query, where, limit } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "../ui/badge";
import Link from "next/link";

function OffersHighlightContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');

    const dailyOffersQuery = useMemoFirebase(() => firestore
        ? query(
            collection(firestore, 'daily_offers'),
            where('offerStartDate', '<=', todayString),
            limit(3) // Let's show up to 3 offers on the home page
        )
        : null,
        [firestore, todayString]);

    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);

    const isLoading = offersLoading || menuLoading;

    const activeOffers = useMemo(() => {
        if (!dailyOffers || !menuItems) {
            return [];
        }

        return dailyOffers.map(offer => {
            const isOfferActive = isWithinInterval(today, {
                start: parseISO(offer.offerStartDate),
                end: parseISO(offer.offerEndDate),
            });

            if (!isOfferActive) return null;

            const menuItem = menuItems.find(item => item.id === offer.menuItemId);
            if (!menuItem) return null;

            return {
                ...offer,
                menuItem,
            };
        }).filter((o): o is NonNullable<typeof o> => o !== null);
    }, [dailyOffers, menuItems, today]);

    if (isLoading) {
        return (
            <section className="bg-background py-16 lg:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-headline font-bold sm:text-4xl">Special Offers</h2>
                            <p className="text-muted-foreground mt-2 max-w-xl">Don't miss out on our limited-time deals.</p>
                        </div>
                        <Skeleton className="h-10 w-36 hidden md:block" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </section>
        )
    }

    if (activeOffers.length === 0) {
        return null; // Don't show the section if there are no active offers
    }


    return (
        <section className="bg-white py-20 lg:py-24 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-4 border-black/20" />
                <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border-4 border-black/20" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-[#d97706]/10 text-[#d97706] text-sm font-bold tracking-wider mb-4 border border-[#d97706]/20">
                            LIMITED TIME DEALS
                        </div>
                        <h2 className="text-4xl font-headline font-black lg:text-5xl tracking-tight text-[#211811]">
                            Exclusive Rewards
                        </h2>
                        <p className="text-[#6b584b] mt-4 max-w-xl text-lg font-body leading-relaxed">
                            Unlock special savings with your membership. Hand-crafted deals for our most loyal patrons.
                        </p>
                    </div>
                    <Button asChild variant="link" className="hidden md:flex text-base font-bold text-[#d97706] hover:text-[#b45309] transition-colors p-0 underline-offset-4 hover:underline">
                        <Link href="/offers">View All Coupons <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeOffers.map(offer => {
                        const highestDiscountValue = Math.max(...Object.values(offer.tierDiscounts));
                        const discountText = offer.discountType === 'percentage'
                            ? `${highestDiscountValue}% OFF`
                            : `SAVE Rs ${highestDiscountValue}`;

                        return (
                            <div key={offer.id} className="group relative flex flex-col bg-[#211811] rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-[#211811]">
                                {/* Dashed Boarder Inner */}
                                <div className="absolute inset-2 border-2 border-dashed border-[#d97706]/30 rounded-lg pointer-events-none z-20" />

                                {/* Image Section */}
                                <div className="relative h-60 w-full overflow-hidden">
                                    <Image
                                        src={offer.menuItem.imageUrl || `https://picsum.photos/seed/${offer.menuItem.id}/600/400`}
                                        alt={offer.menuItem.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                        data-ai-hint="food item"
                                    />
                                    <div className="absolute inset-0 bg-[#211811]/20 mix-blend-multiply" />

                                    {/* Discount Badge - Stamp Style */}
                                    <div className="absolute top-4 right-4 z-30">
                                        <div className="bg-white text-[#211811] h-16 w-16 rounded-full flex items-center justify-center font-black font-headline text-center leading-none text-sm shadow-lg border-2 border-[#d97706] rotate-12 group-hover:rotate-0 transition-transform duration-300">
                                            {discountText}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 relative text-[#f2efe9] flex-grow flex flex-col items-center text-center">
                                    <div className="mb-2 uppercase tracking-widest text-xs text-[#d97706] font-bold">
                                        Coupon Code: {offer.code || 'STEAM24'}
                                    </div>
                                    <h3 className="font-headline font-bold text-2xl mb-2">{offer.title}</h3>
                                    <p className="text-white/60 text-sm font-body line-clamp-2 mb-6 max-w-[80%]">
                                        {offer.menuItem.name}: {offer.description || "Valid for a limited time only at all locations."}
                                    </p>

                                    <div className="mt-auto w-full pt-4 border-t border-white/10 border-dashed">
                                        <Button asChild className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold rounded-lg h-12 shadow-lg transition-transform active:scale-95">
                                            <Link href="/offers">Claim Now</Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Decorative Cutouts */}
                                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full z-10" />
                                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full z-10" />
                            </div>
                        )
                    })}
                </div>
                <Button asChild variant="link" className="flex md:hidden mt-10 mx-auto text-base font-bold text-[#d97706]">
                    <Link href="/offers">View All Coupons <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
        </section>
    );
}


export default function OffersHighlight() {
    return <OffersHighlightContent />;
}
