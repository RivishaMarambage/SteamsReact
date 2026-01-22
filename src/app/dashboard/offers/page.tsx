'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, LoyaltyLevel, MenuItem, UserProfile } from "@/lib/types";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Percent } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import BirthdayReward from "@/components/dashboard/BirthdayReward";

const WELCOME_OFFERS = [
    { order: 0, discount: 10 }, // 1st order (orderCount is 0)
    { order: 1, discount: 5 },  // 2nd order (orderCount is 1)
    { order: 2, discount: 15 }, // 3rd order (orderCount is 2)
];

function OffersPageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: authUser, isUserLoading: authLoading } = useUser();
    const today = useMemo(() => new Date(), []);
    const todayString = format(today, 'yyyy-MM-dd');

    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);

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

    const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'loyalty_levels'), orderBy('minimumPoints')) : null, [firestore]);
    const { data: loyaltyLevels, isLoading: levelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

    const isLoading = authLoading || profileLoading || offersLoading || menuLoading || levelsLoading;

    const activeOffers = useMemo(() => {
        if (!dailyOffers) return [];
        return dailyOffers.filter(offer =>
            isWithinInterval(today, {
                start: parseISO(offer.offerStartDate),
                end: parseISO(offer.offerEndDate),
            })
        );
    }, [dailyOffers, today]);

    const welcomeOffer = useMemo(() => {
        if (!userProfile || (userProfile.orderCount ?? 0) >= 3 || !userProfile.emailVerified) {
            return null;
        }
        return WELCOME_OFFERS.find(offer => offer.order === (userProfile.orderCount ?? 0)) || null;
    }, [userProfile]);

    const handleOrderClick = (offerId: string) => {
        router.push(`/dashboard/order?addOffer=${offerId}`);
    };

    const currentLevel = useMemo(() => {
        if (!loyaltyLevels || !userProfile) return null;
        return loyaltyLevels.find(l => l.id === userProfile.loyaltyLevelId);
    }, [loyaltyLevels, userProfile]);

    const myActiveOffers = useMemo(() => {
        if (!activeOffers || !userProfile?.loyaltyLevelId || !menuItems) return [];
    
        return activeOffers.map(offer => {
            const tierDiscountValue = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
            if (tierDiscountValue <= 0) return null;
            
            const menuItem = menuItems.find(item => item.id === offer.menuItemId);
            if (!menuItem) return null;
    
            return {
                ...offer,
                menuItem,
                tierDiscountValue,
            };
        }).filter((o): o is NonNullable<typeof o> => !!o);

    }, [activeOffers, userProfile, menuItems]);


    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-10 w-1/3" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }
    
    if (!userProfile) {
        return <p>Please log in to view offers.</p>
    }

    return (
        <div className="space-y-8">
            {/* Welcome & Birthday Offers */}
            <div className="grid md:grid-cols-2 gap-8">
                {welcomeOffer && (
                    <Card className="bg-blue-500/10 border-blue-500/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2 text-blue-600"><Percent /> Welcome Offer!</CardTitle>
                            <CardDescription>A special discount for one of your first three orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-2xl font-bold">{welcomeOffer.discount}% off your next order</p>
                             <p className="text-sm text-muted-foreground">This discount will be automatically applied at checkout.</p>
                        </CardContent>
                    </Card>
                )}
                 <BirthdayReward user={userProfile} />
            </div>

            {/* Daily Offers */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Daily Offers</CardTitle>
                    <CardDescription>
                        Here are the special deals available today for your {currentLevel ? <span className="font-bold capitalize">{currentLevel.name}</span> : ''} tier.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {myActiveOffers.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {myActiveOffers.map(offer => {
                                const discountText = offer.discountType === 'percentage'
                                    ? `${offer.tierDiscountValue}% off`
                                    : `LKR ${offer.tierDiscountValue.toFixed(2)} off`;
                                
                                const originalPrice = offer.menuItem.price;
                                const discountedPrice = offer.discountType === 'percentage' 
                                    ? originalPrice - (originalPrice * offer.tierDiscountValue / 100)
                                    : originalPrice - offer.tierDiscountValue;

                                return (
                                    <Card key={offer.id} className={cn("overflow-hidden", "border-primary")}>
                                        <CardHeader className="flex-row gap-4 items-start p-4">
                                             <Image
                                                src={offer.menuItem.imageUrl || `https://picsum.photos/seed/${offer.menuItem.id}/100/100`}
                                                alt={offer.menuItem.name}
                                                width={80}
                                                height={80}
                                                className="rounded-md object-cover w-20 h-20"
                                                data-ai-hint="food item"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <Badge variant={'default'}>
                                                        {discountText}
                                                    </Badge>
                                                    <Badge variant="outline" className="capitalize">{offer.orderType}</Badge>
                                                </div>
                                                <h4 className="font-semibold">{offer.title}</h4>
                                                <p className="text-sm text-muted-foreground">{offer.menuItem.name}</p>
                                            </div>
                                        </CardHeader>
                                        <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground line-through mr-2">LKR {originalPrice.toFixed(2)}</span>
                                                <span className="font-bold text-lg">LKR {Math.max(0, discountedPrice).toFixed(2)}</span>
                                            </div>
                                            <Button size="sm" onClick={() => handleOrderClick(offer.id)} disabled={offer.menuItem.isOutOfStock}>
                                                {offer.menuItem.isOutOfStock ? "Unavailable" : "Order Now"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No special offers available for your tier today.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function OffersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Special Offers</h1>
        <p className="text-muted-foreground">
          Here are all the deals and discounts available to you right now.
        </p>
      </div>
      <OffersPageContent />
    </div>
  );
}
