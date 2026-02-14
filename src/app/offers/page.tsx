
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
            <div className="flex flex-col min-h-dvh bg-[#1c120e]">
                <PublicHeader />
                <div className="container mx-auto px-4 md:px-6 py-32">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-[500px] w-full rounded-[3rem] bg-white/5" />
                        <Skeleton className="h-[500px] w-full rounded-[3rem] bg-white/5 hidden md:block" />
                        <Skeleton className="h-[500px] w-full rounded-[3rem] bg-white/5 hidden lg:block" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-dvh bg-[#1c120e] text-white relative overflow-x-hidden">
            {/* Ambient Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#d97706]/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#d97706]/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
            </div>

            <PublicHeader />
            <main className="flex-1 pt-20 relative z-10">
                {/* Hero Section */}
                <section className="relative h-[450px] md:h-[500px] w-full flex items-center justify-center overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                        alt="Coffee Background"
                        fill
                        className="object-cover brightness-[0.7]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#1c120e]"></div>

                    <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center h-full justify-center pt-10">
                        <div className="max-w-4xl space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-1000">
                            <Badge className="bg-[#d97706]/20 text-[#d97706] border border-[#d97706]/50 px-4 md:px-6 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">Exclusive Perks</Badge>
                            <h1 className="text-4xl md:text-8xl font-headline font-black text-white leading-[0.9] uppercase tracking-tighter drop-shadow-2xl">
                                Brewing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] via-[#fbbf24] to-[#d97706] animate-gradient-x">Value</span><br />Every Day
                            </h1>
                            <p className="text-white/80 text-base md:text-xl font-medium max-w-xl mx-auto leading-relaxed drop-shadow-md px-4">
                                Join the Steamsbury Inner Circle to unlock personalized rewards, seasonal discounts, and member-only treats.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main Campaigns Grid */}
                <section className="py-12 md:py-20 -mt-8 md:-mt-12 relative z-20">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                            {groupedOffers.map((campaign) => (
                                <div key={campaign.id} className="glass-card bg-white/10 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-[#d97706]/30 transition-all duration-500 flex flex-col border border-white/20 group hover:-translate-y-2">
                                    <div className="relative h-56 md:h-72 overflow-hidden">
                                        <Image
                                            src={campaign.applicableItems[0]?.imageUrl || `https://picsum.photos/seed/${campaign.id}/600/400`}
                                            alt={campaign.title}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                                        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                                            <div className="bg-[#f59e0b] text-[#1a110a] px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-lg border border-white/20 flex flex-col items-center justify-center min-w-[80px] md:min-w-[90px]">
                                                <span className="text-xl md:text-2xl font-black font-headline leading-none">
                                                    {campaign.isPercentage ? `${campaign.highestDiscount}%` : `LKR ${campaign.highestDiscount}`}
                                                </span>
                                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-80">OFF</span>
                                            </div>
                                        </div>
                                        <Badge className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-black/60 backdrop-blur-md text-white border border-white/10 px-3 py-1 md:px-4 md:py-1.5 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest hover:bg-black/80">
                                            {campaign.orderType}
                                        </Badge>
                                    </div>

                                    <div className="p-5 md:p-8 flex-grow flex flex-col space-y-4 md:space-y-6">
                                        <div>
                                            <h3 className="text-xl md:text-3xl font-headline font-black text-white mb-2 md:mb-3 uppercase tracking-tight leading-none">{campaign.title}</h3>
                                            <div className="flex items-center gap-2 text-white/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#d97706]" />
                                                Ends {format(parseISO(campaign.offerEndDate), 'MMMM dd')}
                                            </div>
                                        </div>

                                        <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] space-y-2 md:space-y-3">
                                            <p className="text-[9px] md:text-[10px] font-black text-[#d97706] uppercase tracking-[0.2em] mb-1 md:mb-2 flex items-center gap-2">
                                                <Tag className="w-3 h-3" /> Applicable Items
                                            </p>
                                            <ul className="space-y-2 md:space-y-2.5">
                                                {campaign.applicableItems.slice(0, 3).map(item => (
                                                    <li key={item.id} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-medium text-white/90">
                                                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#d97706] shrink-0" />
                                                        <span className="truncate">{item.name}</span>
                                                    </li>
                                                ))}
                                                {campaign.applicableItems.length > 3 && (
                                                    <li className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest pt-1 md:pt-2 pl-6 md:pl-7">
                                                        + {campaign.applicableItems.length - 3} more items...
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <Button
                                            onClick={() => handleOfferClick(campaign.id, campaign.applicableItems[0].id)}
                                            className="w-full h-12 md:h-14 rounded-full bg-white text-[#0f0a06] hover:bg-[#d97706] hover:text-white font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-lg hover:shadow-[#d97706]/40 group/btn border-0 mt-auto"
                                        >
                                            {authUser ? 'Claim this Offer' : 'Sign in to Claim'}
                                            <ArrowRight className="ml-2 w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {groupedOffers.length === 0 && (
                                <div className="col-span-full py-32 text-center space-y-6 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/5">
                                        <Tag className="w-10 h-10 text-white/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-headline font-bold text-white">No Offers Right Now</h3>
                                        <p className="text-white/50 text-sm max-w-md mx-auto">Check back correctly for seasonal promotions and limited-time deals.</p>
                                    </div>
                                    <Button asChild variant="link" className="text-[#d97706] hover:text-white font-black uppercase tracking-[0.2em] text-xs">
                                        <Link href="/menu">Browse Full Menu</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Inner Circle CTA */}
                <section className="container mx-auto px-4 md:px-6 mb-32 relative z-10">
                    <div className="bg-gradient-to-br from-[#1a110a] to-[#0f0a06] rounded-[4rem] p-12 md:p-24 relative overflow-hidden text-white shadow-2xl border border-white/5 group">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d97706]/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 group-hover:bg-[#d97706]/20 transition-colors duration-1000" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="space-y-8 max-w-2xl text-center lg:text-left">
                                <h2 className="text-5xl md:text-7xl font-headline font-black leading-[0.9] uppercase tracking-tighter">
                                    Never miss a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#fbbf24]">deal.</span>
                                </h2>
                                <p className="text-white/60 text-lg md:text-xl font-medium leading-relaxed">
                                    Members get instant notifications when new seasonal offers drop. Start earning points on every purchase today.
                                </p>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                    {['Early Access', 'Birthday Freebies', 'Double Point Days'].map(tag => (
                                        <div key={tag} className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors cursor-default">{tag}</div>
                                    ))}
                                </div>
                            </div>

                            <Button asChild className="h-20 px-16 rounded-full bg-[#d97706] hover:bg-white text-white hover:text-[#0f0a06] font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_40px_-10px_rgba(217,119,6,0.5)] transition-all transform hover:scale-105 active:scale-95 border-0">
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
