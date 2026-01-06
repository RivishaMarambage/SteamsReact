
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile, LoyaltyLevel } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export default function DailyOffersPreview({ userProfile }: { userProfile: UserProfile | null }) {
    const firestore = useFirestore();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Correctly query for offers that are active today.
    // An offer is active if its start date is on or before today AND its end date is on or after today.
    const dailyOffersQuery = useMemoFirebase(() => firestore 
        ? query(
            collection(firestore, 'daily_offers'), 
            where('offerStartDate', '<=', today)
          ) 
        : null, 
    [firestore, today]);

    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
    
    const isLoading = offersLoading || menuLoading;
    
    const activeAndApplicableOffers = useMemo(() => {
        if (!dailyOffers || !menuItems || !userProfile?.loyaltyLevelId) {
            return [];
        }
        
        const todayDate = new Date();

        return dailyOffers.map(offer => {
            // Client-side check for end date, as Firestore can't query on two different range fields.
            const isOfferActive = isWithinInterval(todayDate, {
                start: parseISO(offer.offerStartDate),
                end: parseISO(offer.offerEndDate),
            });

            if (!isOfferActive) return null;

            const menuItem = menuItems.find(item => item.id === offer.menuItemId);
            if (!menuItem) return null;

            const userLoyaltyId = userProfile.loyaltyLevelId;
            const userTierDiscount = offer.tierDiscounts?.[userLoyaltyId];
            
            // A discount is applicable if it's explicitly defined for the user's tier and is a valid number greater than 0.
            if (typeof userTierDiscount !== 'number' || userTierDiscount <= 0) {
                return null;
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
                displayPrice,
            };
        }).filter((o): o is NonNullable<typeof o> => o !== null);
    }, [dailyOffers, menuItems, userProfile]);


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

    if (!userProfile || activeAndApplicableOffers.length === 0) {
        return null; // Don't show the card if there are no applicable offers
    }

    return (
        <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-primary"><Tag/> Today's Special Offers For You</CardTitle>
                <CardDescription>Exclusive deals based on your loyalty tier!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeAndApplicableOffers.map(offer => {
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
