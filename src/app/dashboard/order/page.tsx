
'use client';

import MenuDisplay from "@/components/order/MenuDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { DailyOffer, MenuItem } from "@/lib/types";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";


function OrderPageContent() {
  const firestore = useFirestore();
  const today = useMemo(() => new Date(), []);
  
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
  
  const dailyOffersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'daily_offers'), where('offerStartDate', '<=', format(today, 'yyyy-MM-dd'))) : null, [firestore, today]);
  const { data: dailyOffers, isLoading: offersLoading } = useCollection<DailyOffer>(dailyOffersQuery);

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

function OrderPage() {
  return (
    <Suspense fallback={<div className="space-y-8">
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
      </div>}>
      <OrderPageContent />
    </Suspense>
  )
}

export default OrderPage;
