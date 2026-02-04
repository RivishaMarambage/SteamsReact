'use client';

import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Clock, Tag, ArrowRight, Gift, ShoppingBag, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { DailyOffer, MenuItem } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All Offers", "Limited Time", "Drinks", "Loyalty Rewards"];

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

    const [activeCategory, setActiveCategory] = useState("All Offers");

    // In a real scenario, you'd filter activeOffers based on categories if available in the data
    const filteredOffers = activeOffers;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-96 w-full rounded-3xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-dvh bg-[#f2efe9]">
            <PublicHeader />
            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop"
                        alt="Coffee Background"
                        fill
                        className="object-cover brightness-[0.7]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                    <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-start justify-center h-full">
                        <div className="max-w-xl space-y-6">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#d97706] text-white text-xs font-bold tracking-wider uppercase">
                                Deal of the Month
                            </span>
                            <h1 className="text-5xl md:text-6xl font-headline font-bold text-white leading-[1.1]">
                                Autumn Warmth:<br />
                                10% Off When You<br />
                                Sign Up
                            </h1>
                            <p className="text-white/80 text-lg leading-relaxed max-w-md">
                                Enjoy exclusive savings on coffee, pastries, and seasonal favorites. Sign up today and save instantly. Limited time offer!
                            </p>
                            <Button size="lg" className="rounded-full px-8 bg-[#d97706] hover:bg-[#b45309] text-white border-none font-bold text-base h-12 shadow-lg hover:shadow-[#d97706]/20 transition-all">
                                <Link href="/menu" className="flex items-center">
                                    Order Now <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Promotions Section */}
                <section className="py-16 md:py-20">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <h2 className="text-3xl font-headline font-bold text-[#1a110a]">Current Promotions</h2>

                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "px-6 py-2 rounded-full text-sm font-bold transition-all border",
                                            activeCategory === cat
                                                ? "bg-[#d97706] text-white border-[#d97706] shadow-md"
                                                : "bg-white text-[#6b584b] border-transparent hover:bg-white/80 hover:shadow-sm"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredOffers.map((offer) => {
                                const highestDiscountValue = Math.max(...Object.values(offer.tierDiscounts));
                                const discountText = offer.discountType === 'percentage'
                                    ? `Up to ${highestDiscountValue}% off`
                                    : `Save up to LKR ${highestDiscountValue.toFixed(2)}`;

                                return (
                                    <div key={offer.id} className={cn("bg-[#eae7e1] rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-white/40", offer.menuItem.isOutOfStock && "opacity-60")}>
                                        <div className="relative h-64 overflow-hidden">
                                            <Image
                                                src={offer.menuItem.imageUrl || `https://picsum.photos/seed/${offer.menuItem.id}/600/400`}
                                                alt={offer.menuItem.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                                            <div className="absolute top-4 left-4 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-lg bg-white text-black">
                                                {discountText}
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <h3 className="text-2xl font-headline font-bold text-[#1a110a] mb-2">{offer.title}</h3>
                                            <p className="text-[#6b584b] text-base leading-relaxed mb-4 min-h-[3rem]">
                                                {offer.menuItem.name} - {offer.menuItem.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-6 border-t border-[#d6d3cc]">
                                                <div className="flex items-center gap-2 text-xs font-bold text-[#6b584b] uppercase tracking-wide">
                                                    <Clock className="w-4 h-4" />
                                                    Valid until {format(parseISO(offer.offerEndDate), 'MMM dd')}
                                                </div>

                                                <button
                                                    onClick={() => handleOrderClick(offer.id)}
                                                    disabled={offer.menuItem.isOutOfStock}
                                                    className="text-[#d97706] font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {offer.menuItem.isOutOfStock ? "Unavailable" : (authUser ? 'Claim Offer' : 'Login to Claim')} <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {filteredOffers.length === 0 && (
                                <div className="col-span-full py-12 text-center text-[#6b584b]">
                                    <p className="text-lg">No active offers available at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Inner Circle Rewards Banner */}
                <section className="container mx-auto px-4 md:px-6 mb-20">
                    <div className="bg-[#211811] rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-white">
                        {/* Background Patterns */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d97706]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d97706]/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="space-y-8 max-w-2xl">
                                <div className="flex items-center gap-2 text-[#d97706] font-bold tracking-widest text-xs uppercase mb-2">
                                    <Tag className="w-4 h-4" />
                                    Inner Circle Rewards
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold leading-none">
                                    Sip your way to <span className="text-[#d97706]">free coffee.</span>
                                </h2>
                                <p className="text-white/60 text-lg md:text-xl max-w-xl">
                                    Join the Daily Grind Inner Circle today. Earn beans with every purchase, unlock exclusive member-only offers, and get a free drink just for signing up.
                                </p>

                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <Gift className="w-5 h-5 text-[#d97706]" />
                                        <span className="font-bold text-sm">Free Birthday Drink</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <ShoppingBag className="w-5 h-5 text-[#d97706]" />
                                        <span className="font-bold text-sm">Order Ahead</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <Calendar className="w-5 h-5 text-[#d97706]" />
                                        <span className="font-bold text-sm">Exclusive Events</span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0">
                                <Link href="/signup/customer">
                                    <Button size="lg" className="h-16 px-10 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-black hover:text-white font-bold text-lg shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105">
                                        Join for Free
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default OffersPageContent;