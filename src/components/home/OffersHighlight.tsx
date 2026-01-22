
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
        <section className="bg-background py-16 lg:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-headline font-bold sm:text-4xl">Special Offers</h2>
                        <p className="text-muted-foreground mt-2 max-w-xl">Don't miss out on our limited-time deals, available for our loyalty members.</p>
                    </div>
                    <Button asChild variant="link" className="hidden md:flex text-base">
                        <Link href="/offers">View All Offers <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeOffers.map(offer => {
                        const highestDiscountValue = Math.max(...Object.values(offer.tierDiscounts));
                        const discountText = offer.discountType === 'percentage'
                            ? `Up to ${highestDiscountValue}% off`
                            : `Save up to LKR ${highestDiscountValue.toFixed(2)}`;

                        return (
                            <Card key={offer.id} className={cn("flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300", offer.menuItem.isOutOfStock && "opacity-60")}>
                                <div className="relative w-full h-56">
                                    <Image
                                        src={offer.menuItem.imageUrl || `https://picsum.photos/seed/${offer.menuItem.id}/600/400`}
                                        alt={offer.menuItem.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="food item"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="destructive" className="text-base">
                                            <Tag className="mr-2" /> {discountText}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl">{offer.title}</CardTitle>
                                    <CardDescription>{offer.menuItem.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                     <p className="text-sm text-muted-foreground">This offer is exclusive to our loyalty members. Log in to see your personalized discount!</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href="/offers">Claim Offer</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
                 <Button asChild variant="link" className="flex md:hidden mt-8 mx-auto text-base">
                    <Link href="/offers">View All Offers <ArrowRight className="ml-2" /></Link>
                </Button>
            </div>
        </section>
    );
}


export default function OffersHighlight() {
    return <OffersHighlightContent />;
}
