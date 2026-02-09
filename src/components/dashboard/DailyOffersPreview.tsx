
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";

export default function DailyOffersPreview({ userProfile }: { userProfile: UserProfile | null }) {
    const firestore = useFirestore();
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    
    const dailyOffersQuery = useMemoFirebase(() => firestore 
        ? query(
            collection(firestore, 'daily_offers'), 
            where('offerStartDate', '<=', todayString)
          ) 
        : null, 
    [firestore, todayString]);

    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
    
    const isLoading = offersLoading || menuLoading;
    
    const activeAndApplicableOffers = useMemo(() => {
        if (!dailyOffers || !menuItems || !userProfile?.loyaltyLevelId) {
            return [];
        }
        
        const redeemedToday = userProfile.dailyOffersRedeemed || {};

        return dailyOffers.map(offer => {
            const isOfferActive = todayString >= offer.offerStartDate && todayString <= offer.offerEndDate;

            if (!isOfferActive) return null;
            
            // Check if user has already redeemed this offer today (one-time use logic)
            if (redeemedToday[offer.id] === todayString) {
                return null;
            }

            const menuItem = menuItems.find(item => item.id === offer.menuItemId);
            if (!menuItem) return null;

            const userLoyaltyId = userProfile.loyaltyLevelId;
            const userTierDiscount = offer.tierDiscounts?.[userLoyaltyId] || 0;
            
            if (userTierDiscount <= 0) {
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
                hasDiscount: true,
            };
        }).filter((o): o is NonNullable<typeof o> => o !== null);
    }, [dailyOffers, menuItems, userProfile, todayString]);


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
        return null;
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
                                <Link href={`/dashboard/order?addOffer=${offer.id}`}>Order Now</Link>
                           </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}
