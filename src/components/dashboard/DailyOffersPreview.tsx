'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
            <Card className="shadow-lg border-0 bg-muted/20">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3 mt-2" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-10 w-full rounded-xl" />
                </CardContent>
            </Card>
        )
    }

    if (!userProfile || activeAndApplicableOffers.length === 0) {
        return null;
    }

    return (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                        <Sparkles className="h-4 w-4 fill-current" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Member Exclusives</span>
                </div>
                <CardTitle className="font-headline text-2xl sm:text-3xl text-[#2c1810]">Today's Special Offers</CardTitle>
                <CardDescription className="font-medium text-[#6b584b]">Handpicked deals for your loyalty tier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeAndApplicableOffers.map(offer => {
                    return (
                        <div key={offer.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-primary/10 shadow-sm hover:shadow-md transition-all group">
                           <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-muted overflow-hidden relative shadow-inner">
                                    <Image 
                                        src={offer.menuItem.imageUrl || `https://picsum.photos/seed/${offer.menuItem.id}/100/100`}
                                        alt={offer.menuItem.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#2c1810] group-hover:text-primary transition-colors">{offer.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-bold text-muted-foreground line-through opacity-60">LKR {offer.originalPrice.toFixed(2)}</span>
                                        <span className="text-sm font-black text-primary tracking-tighter">LKR {offer.displayPrice.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-[#6b584b] uppercase tracking-widest mt-1 opacity-70">
                                        {offer.orderType} only
                                    </p>
                                </div>
                           </div>
                           <Button asChild className="rounded-full px-8 h-12 bg-[#2c1810] hover:bg-primary transition-all shadow-lg hover:shadow-primary/20">
                                <Link href={`/dashboard/order?addOffer=${offer.id}`} className="flex items-center gap-2">
                                    Claim Reward <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                           </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}