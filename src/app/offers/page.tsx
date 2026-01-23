
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, MenuItem } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

function OffersPageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: authUser } = useUser();
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

    const handleOrderClick = (offerId: string) => {
        if (authUser) {
            router.push(`/dashboard/order?addOffer=${offerId}`);
        } else {
            router.push('/login/customer');
        }
    };

    if (isLoading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeOffers.map(offer => {
                // Determine the highest possible discount to show as a teaser
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
                            <div className="absolute bottom-0 left-0 p-4">
                                <h3 className="text-2xl font-headline font-bold text-white">{offer.title}</h3>
                                <p className="text-white/90">{offer.menuItem.name}</p>
                            </div>
                            <div className="absolute top-2 right-2">
                                <Badge variant="destructive" className="text-base">
                                    <Tag className="mr-2" /> {discountText}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle>{offer.menuItem.name}</CardTitle>
                            <CardDescription>{offer.menuItem.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">This offer is exclusive to our loyalty members. Log in to see your personalized discount!</p>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-4">
                            <div className="text-center">
                                <span className="text-lg font-bold text-primary">From LKR {offer.menuItem.price.toFixed(2)}</span>
                            </div>
                            <Button size="lg" onClick={() => handleOrderClick(offer.id)} disabled={offer.menuItem.isOutOfStock}>
                                {offer.menuItem.isOutOfStock ? "Unavailable" : (authUser ? 'Order Now & Claim Offer' : 'Login to Claim Offer')}
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}

            {activeOffers.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <p className="text-lg text-muted-foreground">There are no special offers available at the moment. Check back soon!</p>
                </div>
            )}
        </div>
    );
}


export default function OffersPage() {
    return (
        <PublicPageLayout title="Special Offers">
           <OffersPageContent />
        </PublicPageLayout>
    )
}