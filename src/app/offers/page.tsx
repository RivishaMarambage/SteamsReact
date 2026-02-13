
'use client';

import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Clock, Tag, ArrowRight, Gift, ShoppingBag, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, MenuItem } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format, parseISO } from 'date-fns';
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["All Offers", "Limited Time", "Drinks", "Loyalty Rewards"];

function OffersPageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: authUser } = useUser();
    const todayString = format(new Date(), 'yyyy-MM-dd');

    const dailyOffersQuery = useMemoFirebase(() => firestore
        ? query(
            collection(firestore, 'daily_offers'),
            where('offerStartDate', '<=', todayString)
        )
        : null,
        [firestore, todayString]);

    const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>('menu_items');

    const isLoading = offersLoading || menuLoading;

    const groupedOffers = useMemo(() => {
        if (!dailyOffers || !menuItems) return [];

        return dailyOffers
            .filter(offer => todayString >= offer.offerStartDate && todayString <= offer.offerEndDate)
            .map(offer => {
                const applicableItems = (offer.menuItemIds || [])
                    .map(id => menuItems.find(m => m.id === id))
                    .filter(Boolean) as MenuItem[];
                
                const highestDiscount = Math.max(...Object.values(offer.tierDiscounts || { default: 0 }));
                const isPercentage = offer.discountType === 'percentage';

                return {
                    ...offer,
                    applicableItems,
                    highestDiscount,
                    isPercentage
                };
            })
            .filter(o => o.applicableItems.length > 0);
    }, [dailyOffers, menuItems, todayString]);

    const handleOfferClick = (offerId: string, firstItemId: string) => {
        if (authUser) {
            router.push(`/dashboard/order?addOffer=${offerId}&itemId=${firstItemId}`);
        } else {
            router.push('/login/customer');
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
                    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
                    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-dvh bg-[#f2efe9]">
            <PublicHeader />
            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative h-[450px] w-full flex items-center justify-center overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                        alt="Coffee Background"
                        fill
                        className="object-cover brightness-[0.6]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f2efe9]"></div>

                    <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center h-full justify-center">
                        <div className="max-w-3xl space-y-6">
                            <Badge className="bg-[#d97706] text-white px-6 py-1.5 rounded-full border-0 text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Perks</Badge>
                            <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-[1.1] uppercase tracking-tighter">
                                Brewing <span className="text-[#f59e0b]">Value</span><br />Every Day
                            </h1>
                            <p className="text-white/90 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
                                Join the Steamsbury Inner Circle to unlock personalized rewards, seasonal discounts, and member-only treats.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main Campaigns Grid */}
                <section className="py-20 -mt-20 relative z-10">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {groupedOffers.map((campaign) => (
                                <div key={campaign.id} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col border border-white/20 group">
                                    <div className="relative h-72 overflow-hidden">
                                        <Image
                                            src={campaign.applicableItems[0]?.imageUrl || `https://picsum.photos/seed/${campaign.id}/600/400`}
                                            alt={campaign.title}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                                        <div className="absolute top-8 left-8">
                                            <div className="bg-[#f59e0b] text-[#1a110a] px-6 py-2.5 rounded-full shadow-2xl flex flex-col items-center justify-center min-w-[100px]">
                                                <span className="text-2xl font-black font-headline leading-none">
                                                    {campaign.isPercentage ? `${campaign.highestDiscount}%` : `LKR ${campaign.highestDiscount}`}
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-widest mt-1">OFF</span>
                                            </div>
                                        </div>
                                        <Badge className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md text-[#1a110a] px-4 py-1.5 border-0 rounded-full font-black text-[9px] uppercase tracking-widest">
                                            {campaign.orderType}
                                        </Badge>
                                    </div>

                                    <div className="p-10 flex-grow flex flex-col space-y-6">
                                        <div>
                                            <h3 className="text-3xl font-headline font-black text-[#1a110a] mb-2 uppercase tracking-tight">{campaign.title}</h3>
                                            <div className="flex items-center gap-2 text-[#6b584b] text-[10px] font-black uppercase tracking-widest opacity-60">
                                                <Clock className="w-3.5 h-3.5" />
                                                Ends {format(parseISO(campaign.offerEndDate), 'MMMM dd')}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-6 rounded-[2rem] space-y-3">
                                            <p className="text-[10px] font-black text-[#d97706] uppercase tracking-[0.2em] mb-1">Applicable Items</p>
                                            <ul className="space-y-2">
                                                {campaign.applicableItems.slice(0, 3).map(item => (
                                                    <li key={item.id} className="flex items-center gap-2 text-sm font-bold text-[#2c1810]">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                                        <span className="truncate">{item.name}</span>
                                                    </li>
                                                ))}
                                                {campaign.applicableItems.length > 3 && (
                                                    <li className="text-[10px] font-black text-[#6b584b]/50 uppercase tracking-widest pt-1">
                                                        + {campaign.applicableItems.length - 3} more items...
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <Button 
                                            onClick={() => handleOfferClick(campaign.id, campaign.applicableItems[0].id)}
                                            className="w-full h-16 rounded-full bg-[#2c1810] hover:bg-[#d97706] text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl group/btn"
                                        >
                                            {authUser ? 'Claim this Offer' : 'Sign in to Claim'}
                                            <ChevronRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {groupedOffers.length === 0 && (
                                <div className="col-span-full py-32 text-center space-y-6">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                                        <Tag className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-xl font-bold text-[#6b584b]">No active promotions at the moment.</p>
                                    <Button asChild variant="link" className="text-primary font-black uppercase tracking-[0.2em] text-xs">
                                        <Link href="/menu">Browse Full Menu</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Inner Circle CTA */}
                <section className="container mx-auto px-4 md:px-6 mb-32">
                    <div className="bg-[#211811] rounded-[4rem] p-12 md:p-24 relative overflow-hidden text-white shadow-3xl">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d97706]/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="space-y-8 max-w-2xl text-center lg:text-left">
                                <h2 className="text-5xl md:text-7xl font-headline font-black leading-[0.9] uppercase tracking-tighter">
                                    Never miss a <span className="text-[#d97706]">deal.</span>
                                </h2>
                                <p className="text-white/60 text-lg md:text-xl font-medium leading-relaxed">
                                    Members get instant notifications when new seasonal offers drop. Start earning points on every purchase today.
                                </p>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                    {['Early Access', 'Birthday Freebies', 'Double Point Days'].map(tag => (
                                        <div key={tag} className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">{tag}</div>
                                    ))}
                                </div>
                            </div>

                            <Button asChild className="h-20 px-16 rounded-full bg-[#f59e0b] hover:bg-white text-[#1a110a] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-0">
                                <Link href="/signup/customer">Join the Club</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default OffersPageContent;
