'use client';

import MenuDisplay from "@/components/order/MenuDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import { collection, getFirestore } from "firebase/firestore";


export default function OrderPage() {
  const { data: menuItems, isLoading } = useCollection("menu_items");

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
      <MenuDisplay menuItems={menuItems || []} />
    </div>
  );
}
