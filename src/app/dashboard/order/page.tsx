'use client';

import MenuDisplay from "@/components/order/MenuDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import { collection, getFirestore, query, where } from "firebase/firestore";
import { DailyOffer, MenuItem } from "@/lib/types";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";


function OrderPageContent() {
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>("menu_items");
  
  // Get today's date in YYYY-MM-DD format
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(
    query(collection(getFirestore(), 'daily_offers'), where('offerDate', '==', todayStr))
  );

  const searchParams = useSearchParams();
  const freebieToClaim = searchParams.get('claimFreebie');

  const isLoading = menuLoading || offersLoading;

  if (isLoading) {
    return (
       <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="flex justify-center mb-6">
            <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Place an Order</h1>
        <p className="text-muted-foreground">Select your favorites and we'll have them ready for you.</p>
      </div>
      <MenuDisplay menuItems={menuItems || []} dailyOffers={dailyOffers || []} freebieToClaim={freebieToClaim} />
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderPageContent />
    </Suspense>
  )
}
