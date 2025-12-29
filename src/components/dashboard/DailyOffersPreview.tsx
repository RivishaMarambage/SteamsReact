
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile, LoyaltyLevel } from "@/lib/types";
import { collection, query, where, doc } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export default function DailyOffersPreview() {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const today = new Date();
    
    // Firestore queries can't do date range checks on different fields.
    // So we fetch offers where the start date is today or earlier.
    const dailyOffersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'daily_offers'), where('offerStartDate', '<=', format(today, 'yyyy-MM-dd'))) : null, [firestore, today]);
    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);

    const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels")) : null, [firestore]);
    const { data: loyaltyLevels, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

    const isLoading = offersLoading || menuLoading || profileLoading || areLevelsLoading;
    
    const filteredOffers = dailyOffers?.map(offer => {
        const menuItem = menuItems?.find(item => item.id === offer.menuItemId);
        if (!menuItem || !userProfile?.loyaltyLevelId) return null;

        // Client-side check for the end date
        const isOfferActive = isWithinInterval(today, {
            start: parseISO(offer.offerStartDate),
            end: parseISO(offer.offerEndDate),
        });

        if (!isOfferActive) return null;

        const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId];
        if (userTierDiscount === undefined || userTierDiscount <= 0) {
            return null; // No discount for this user's tier
        }
        
        const originalPrice = menuItem.price;
        let displayPrice;
        if (offer.discountType === 'percentage') {
            displayPrice = originalPrice - (originalPrice * userTierDiscount / 100);
        } else { // fixed
            displayPrice = originalPrice - userTierDiscount;
        }
        displayPrice = Math.max(0, displayPrice);

        return {
            ...offer,
            menuItem,
            originalPrice,
            displayPrice
        }
    }).filter((o): o is NonNullable<typeof o> => o !== null);


    if (isLoading) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3 mt-2" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!filteredOffers || filteredOffers.length === 0) {
        return null; // Don't show the card if there are no applicable offers
    }

    return (
        <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-primary"><Tag/> Today's Special Offers For You</CardTitle>
                <CardDescription>Exclusive deals based on your loyalty tier!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {filteredOffers.map(offer => {
                    return (
                        <div key={offer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-background rounded-lg">
                           <div>
                                <h4 className="font-semibold">{offer.title} - {offer.menuItem.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your price today: 
                                    <span className="text-sm font-normal text-muted-foreground line-through mx-2">LKR {offer.originalPrice.toFixed(2)}</span>
                                    <span className="font-bold text-primary">LKR {offer.displayPrice.toFixed(2)}</span>
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">Valid for {offer.orderType} orders.</p>
                           </div>
                           <Button asChild>
                                <Link href="/dashboard/order">Order Now</Link>
                           </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}
