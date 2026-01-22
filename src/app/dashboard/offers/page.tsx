'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, LoyaltyLevel, MenuItem, UserProfile } from "@/lib/types";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Gift, Percent, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
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
                    <CardTitle className="font-headline">Daily Offers</CardTitle>
                    <CardDescription>Special deals available today, personalized for each loyalty tier.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={userProfile.loyaltyLevelId || loyaltyLevels?.[0]?.id} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                            {loyaltyLevels?.filter(l => l.name.toLowerCase() !== 'standard').map(level => (
                                <TabsTrigger key={level.id} value={level.id} className="capitalize">{level.name}</TabsTrigger>
                            ))}
                        </TabsList>
                        {loyaltyLevels?.filter(l => l.name.toLowerCase() !== 'standard').map(level => (
                            <TabsContent key={level.id} value={level.id} className="mt-6">
                                {activeOffers.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {activeOffers.map(offer => {
                                            const menuItem = menuItems?.find(item => item.id === offer.menuItemId);
                                            if (!menuItem) return null;

                                            const tierDiscountValue = offer.tierDiscounts?.[level.id] || 0;
                                            if (tierDiscountValue <= 0) return null;

                                            const discountText = offer.discountType === 'percentage'
                                                ? `${tierDiscountValue}% off`
                                                : `LKR ${tierDiscountValue.toFixed(2)} off`;
                                            
                                            const originalPrice = menuItem.price;
                                            const discountedPrice = offer.discountType === 'percentage' 
                                                ? originalPrice - (originalPrice * tierDiscountValue / 100)
                                                : originalPrice - tierDiscountValue;

                                            return (
                                                <Card key={`${offer.id}-${level.id}`} className={cn("overflow-hidden", userProfile.loyaltyLevelId === level.id && "border-primary")}>
                                                    <CardHeader className="flex-row gap-4 items-start p-4">
                                                         <Image
                                                            src={menuItem.imageUrl || `https://picsum.photos/seed/${menuItem.id}/100/100`}
                                                            alt={menuItem.name}
                                                            width={80}
                                                            height={80}
                                                            className="rounded-md object-cover w-20 h-20"
                                                            data-ai-hint="food item"
                                                        />
                                                        <div className="flex-1">
                                                            <Badge variant={userProfile.loyaltyLevelId === level.id ? 'default' : 'secondary'}>
                                                                {discountText}
                                                            </Badge>
                                                            <h4 className="font-semibold mt-1">{offer.title}</h4>
                                                            <p className="text-sm text-muted-foreground">{menuItem.name}</p>
                                                        </div>
                                                    </CardHeader>
                                                    <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground line-through mr-2">LKR {originalPrice.toFixed(2)}</span>
                                                            <span className="font-bold text-lg">LKR {Math.max(0, discountedPrice).toFixed(2)}</span>
                                                        </div>
                                                        {userProfile.loyaltyLevelId === level.id && (
                                                            <Button size="sm" onClick={() => handleOrderClick(offer.id)} disabled={menuItem.isOutOfStock}>
                                                                {menuItem.isOutOfStock ? "Unavailable" : "Order Now"}
                                                            </Button>
                                                        )}
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                     <p className="text-center text-muted-foreground py-8">No special offers available for the {level.name} tier today.</p>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
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
