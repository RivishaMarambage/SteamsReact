
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, MenuItem, UserProfile } from "@/lib/types";
import { collection, query, where, doc } from "firebase/firestore";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export default function DailyOffersPreview() {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const dailyOffersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'daily_offers'), where('offerDate', '==', todayStr)) : null, [firestore, todayStr]);
    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

    const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'menu_items') : null, [firestore]);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);

    const isLoading = offersLoading || menuLoading || profileLoading;

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

    if (!dailyOffers || dailyOffers.length === 0) {
        return null; // Don't show the card if there are no offers today
    }

    return (
        <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-primary"><Tag/> Today's Special Offers</CardTitle>
                <CardDescription>Don't miss out on these exclusive deals for today!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {dailyOffers.map(offer => {
                    const menuItem = menuItems?.find(item => item.id === offer.menuItemId);
                    if (!menuItem) return null;

                    let displayPrice = menuItem.price;
                    const originalPrice = menuItem.price;
                    let isOfferApplied = false;
                    let discountValue: number | undefined;

                    if (offer.tierDiscounts) {
                        const userTierId = userProfile?.loyaltyLevelId;

                        if (userTierId && offer.tierDiscounts[userTierId] !== undefined) {
                            discountValue = offer.tierDiscounts[userTierId];
                        } else if (offer.tierDiscounts['member'] !== undefined) {
                            discountValue = offer.tierDiscounts['member'];
                        }
                    }

                    if (discountValue !== undefined) {
                        if (offer.discountType === 'percentage') {
                            displayPrice = originalPrice - (originalPrice * discountValue / 100);
                        } else { // fixed
                            displayPrice = originalPrice - discountValue;
                        }
                        isOfferApplied = true;
                    }
                    displayPrice = Math.max(0, displayPrice);

                    return (
                        <div key={offer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-background rounded-lg">
                           <div>
                                <h4 className="font-semibold">{offer.title} - {menuItem.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your price today: 
                                    {isOfferApplied && <span className="text-sm font-normal text-muted-foreground line-through mx-2">Rs. {originalPrice.toFixed(2)}</span>}
                                    <span className="font-bold text-primary">Rs. {displayPrice.toFixed(2)}</span>
                                </p>
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
