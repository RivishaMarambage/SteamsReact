
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, LoyaltyLevel, MenuItem, UserProfile } from "@/lib/types";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Percent, MailWarning, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import BirthdayReward from "@/components/dashboard/BirthdayReward";
import Link from "next/link";

const WELCOME_OFFERS = [
    { order: 0, discount: 10, label: "First Order" },
    { order: 1, discount: 5, label: "Second Order" },
    { order: 2, discount: 15, label: "Third Order" },
];

function OffersPageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: authUser, isUserLoading: authLoading } = useUser();
    const today = new Date();
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

    const welcomeOffer = useMemo(() => {
        if (!userProfile || (userProfile.orderCount ?? 0) >= 3) {
            return null;
        }
        return WELCOME_OFFERS.find(offer => offer.order === (userProfile.orderCount ?? 0)) || null;
    }, [userProfile]);

    const handleOrderClick = (offerId: string, itemId: string) => {
        router.push(`/dashboard/order?addOffer=${offerId}&itemId=${itemId}`);
    };

    const currentLevel = useMemo(() => {
        if (!loyaltyLevels || !userProfile) return null;
        return loyaltyLevels.find(l => l.id === userProfile.loyaltyLevelId);
    }, [loyaltyLevels, userProfile]);

    const myActiveOffers = useMemo(() => {
        if (!dailyOffers || !userProfile?.loyaltyLevelId || !menuItems) return [];
    
        const results: any[] = [];

        dailyOffers.forEach(offer => {
            const isOfferActive = todayString >= offer.offerStartDate && todayString <= offer.offerEndDate;
            if (!isOfferActive) return;

            const tierDiscountValue = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
            if (tierDiscountValue <= 0) return;

            const isPercentage = (offer.discountType as string) === 'percentage' || (offer.discountType as string) === 'percent';

            offer.menuItemIds?.forEach(itemId => {
                const menuItem = menuItems.find(item => item.id === itemId);
                if (!menuItem) return;

                results.push({
                    ...offer,
                    menuItem,
                    tierDiscountValue,
                    isPercentage
                });
            });
        });

        return results;
    }, [dailyOffers, userProfile, menuItems, todayString]);


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
                    <Card className="bg-blue-500/10 border-blue-500/20 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Percent className="w-24 h-24 rotate-12" />
                        </div>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2 text-blue-600">
                                <Sparkles className="w-5 h-5 fill-current" /> {welcomeOffer.label} Reward
                            </CardTitle>
                            <CardDescription>Exclusive offer for your first few visits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <p className="text-4xl font-black font-headline text-blue-700">{welcomeOffer.discount}% OFF</p>
                                <p className="text-sm font-medium text-blue-600/80 uppercase tracking-widest mt-1">Automatically applied to your cart</p>
                             </div>
                             
                             {userProfile.emailVerified ? (
                                 <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl border border-green-100 text-sm font-bold animate-in zoom-in-95">
                                    <CheckCircle2 className="w-4 h-4" /> Email Verified • Offer Active
                                 </div>
                             ) : (
                                 <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-amber-700 text-sm font-bold">
                                        <MailWarning className="w-4 h-4" /> Verification Required
                                    </div>
                                    <p className="text-xs text-amber-600 leading-relaxed">
                                        Please verify your email address in your profile to unlock this {welcomeOffer.discount}% discount.
                                    </p>
                                    <Button asChild variant="outline" size="sm" className="w-full rounded-full border-amber-300 text-amber-700 hover:bg-amber-100">
                                        <Link href="/dashboard/profile">Go to Profile <ArrowRight className="ml-2 w-3 h-3" /></Link>
                                    </Button>
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                )}
                 <BirthdayReward user={userProfile} />
            </div>

            {/* Daily Offers */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Daily Offers</CardTitle>
                    <CardDescription suppressHydrationWarning>
                        Here are the special deals available today for your {currentLevel ? <span className="font-bold capitalize">{currentLevel.name}</span> : ''} tier.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {myActiveOffers.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {myActiveOffers.map((offer, idx) => {
                                const isPercentage = offer.isPercentage;
                                const discountText = isPercentage
                                    ? `${offer.tierDiscountValue}% off`
                                    : `LKR ${offer.tierDiscountValue.toFixed(2)} off`;
                                
                                const originalPrice = offer.menuItem.price;
                                const discountedPrice = isPercentage 
                                    ? originalPrice - (originalPrice * offer.tierDiscountValue / 100)
                                    : originalPrice - offer.tierDiscountValue;

                                return (
                                    <Card key={`${offer.id}-${offer.menuItem.id}-${idx}`} className={cn("overflow-hidden", "border-primary")}>
                                        <CardHeader className="flex-col sm:flex-row gap-4 items-start p-4">
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
                                            <Button size="sm" onClick={() => handleOrderClick(offer.id, offer.menuItem.id)} disabled={offer.menuItem.isOutOfStock}>
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
