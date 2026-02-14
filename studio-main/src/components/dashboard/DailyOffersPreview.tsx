

'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
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
            const isOfferActive = isWithinInterval(today, {
                start: parseISO(offer.offerStartDate),
                end: parseISO(offer.offerEndDate),
            });

            if (!isOfferActive) return null;

            // Check if user has already redeemed this offer today
            if (redeemedToday[offer.id] === todayString) {
                return null;
            }

            const menuItem = menuItems.find(item => item.id === offer.menuItemId);
            if (!menuItem) return null;

            const userLoyaltyId = userProfile.loyaltyLevelId;
            const userTierDiscount = offer.tierDiscounts?.[userLoyaltyId] || 0;

            // Only include the offer if there's a specific discount for the user's tier.
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
                hasDiscount: true, // Will always be true because of the filter above
            };
        }).filter((o): o is NonNullable<typeof o> => o !== null);
    }, [dailyOffers, menuItems, userProfile, today, todayString]);


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
        <Card className="shadow-xl border-dashed border-2 border-[#d97706]/30 bg-gradient-to-br from-[#fff7ed] to-white relative overflow-hidden group hover:border-[#d97706]/50 transition-all duration-300">
            {/* Decorative background icon */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#d97706]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute top-4 right-4 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity duration-300">
                <Tag className="w-24 h-24 text-[#d97706]" />
            </div>

            <CardHeader className="relative z-10">
                <CardTitle className="font-headline flex items-center gap-3 text-[#2c1810] text-2xl">
                    <div className="p-2 bg-[#d97706]/10 rounded-full">
                        <Tag className="w-5 h-5 text-[#d97706]" />
                    </div>
                    Today's Special Offers For You
                </CardTitle>
                <CardDescription className="text-[#6b584b] font-medium ml-1">Exclusive deals based on your loyalty tier!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                {activeAndApplicableOffers.map(offer => {
                    return (
                        <div key={offer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/60 backdrop-blur-sm border border-[#d97706]/10 rounded-xl hover:shadow-md transition-all duration-300 hover:bg-white">
                            <div>
                                <h4 className="font-bold text-[#2c1810] text-lg">{offer.title} - {offer.menuItem.name}</h4>
                                <p className="text-sm text-[#6b584b] mt-1">
                                    Your price today:
                                    <span className="text-sm font-normal text-muted-foreground line-through mx-2 decoration-red-500/50">LKR {offer.originalPrice.toFixed(2)}</span>
                                    <span className="font-black text-[#d97706] text-lg">LKR {offer.displayPrice.toFixed(2)}</span>
                                </p>
                                <p className="text-xs text-[#6b584b]/80 capitalize mt-1 font-medium bg-[#d97706]/5 inline-block px-2 py-0.5 rounded-full">Valid for {offer.orderType} orders</p>
                            </div>
                            <Button asChild className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white font-bold shadow-lg shadow-[#d97706]/20 transition-all duration-300 hover:scale-105 active:scale-95">
                                <Link href={`/dashboard/order?addOffer=${offer.id}`}>Order Now</Link>
                            </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}
