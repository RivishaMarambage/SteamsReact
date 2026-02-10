'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ShoppingCart, Clock, Hash } from "lucide-react";
import AudioNotifier from "../AudioNotifier";
import { useToast } from "@/hooks/use-toast";

export default function RecentOrders({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [previousOrderStatus, setPreviousOrderStatus] = useState<Record<string, Order['status']>>({});
  const [playStatusChangeSound, setPlayStatusChangeSound] = useState(false);
  
  const recentOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
        collection(firestore, `users/${userId}/orders`),
        orderBy("orderDate", "desc"),
        limit(5)
    );
  }, [firestore, userId]);

  const { data: recentOrders, isLoading } = useCollection<Order>(recentOrdersQuery);

 useEffect(() => {
    if (!recentOrdersQuery) return;
    const unsubscribe = onSnapshot(recentOrdersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedOrder = change.doc.data() as Order;
          const previousStatus = previousOrderStatus[change.doc.id];
          if (previousStatus && updatedOrder.status !== previousStatus) {
            if (updatedOrder.status === 'Ready for Pickup' || updatedOrder.status === 'Rejected') {
              setPlayStatusChangeSound(true);
            }
          }
        }
      });

      const newStatusHistory: Record<string, Order['status']> = {};
      snapshot.docs.forEach(doc => {
        const order = doc.data() as Order;
        newStatusHistory[doc.id] = order.status;
      });
      setPreviousOrderStatus(newStatusHistory);

    });
    return () => unsubscribe();
  }, [recentOrdersQuery, previousOrderStatus]);

  useEffect(() => {
    if (playStatusChangeSound) {
      const timer = setTimeout(() => setPlayStatusChangeSound(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [playStatusChangeSound]);


  const getStatusVariant = (status?: Order['status']) => {
    switch (status) {
      case 'Placed': return 'secondary';
      case 'Processing': return 'outline';
      case 'Ready for Pickup': return 'default'; 
      case 'Completed': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleReorder = (order: Order) => {
    const reorderData = order.orderItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        addons: item.addons.map(a => ({
            id: a.addonId,
            name: a.addonName,
            price: a.addonPrice
        })),
        totalPrice: item.totalPrice,
        appliedDailyOfferId: item.appliedDailyOfferId
    }));
    
    localStorage.setItem('reorder_items', JSON.stringify(reorderData));
    toast({
        title: "Reorder Initiated",
        description: "Items from your previous order are being added to your cart.",
    });
    router.push('/dashboard/order');
  };

  if (isLoading) {
      return (
         <Card className="shadow-lg rounded-[2rem] border-none bg-white">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="font-headline text-xl">Recent Orders</CardTitle>
              <CardDescription className="text-sm">Fetching your history...</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <div className="space-y-2">
                <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
                <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
              </div>
            </CardContent>
          </Card>
      )
  }

  if (!recentOrders || recentOrders.length === 0) {
    return (
       <Card className="shadow-lg rounded-[2rem] border-none bg-white">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="font-headline text-xl text-[#2c1810]">Recent Orders</CardTitle>
            <CardDescription className="text-sm text-[#6b584b]">No orders yet. Ready for your first brew?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 flex flex-col items-center py-12">
            <div className="bg-[#d97706]/5 p-6 rounded-full mb-4">
                <ShoppingCart className="size-8 text-[#d97706] opacity-40" />
            </div>
            <Button asChild variant="outline" className="rounded-full border-2 border-[#d97706] text-[#d97706] hover:bg-[#d97706] hover:text-white font-bold h-10 px-6">
                <a href="/dashboard/order">Browse Menu</a>
            </Button>
          </CardContent>
        </Card>
    )
  }

  return (
    <>
      <AudioNotifier
        shouldPlay={playStatusChangeSound}
        soundUrl="https://www.soundjay.com/button/sounds/button-3.mp3"
        resetCondition={recentOrders?.[0]?.status}
      />
      <Card className="shadow-lg rounded-[2rem] overflow-hidden border-none bg-white">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="font-headline text-xl md:text-2xl uppercase tracking-tight text-[#2c1810]">Recent Orders</CardTitle>
          <CardDescription className="text-sm text-[#6b584b]">Track your active and previous orders.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-8 md:pt-0">
          <div className="w-full overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
                <Table className="min-w-full">
                    <TableHeader className="bg-transparent border-b border-[#2c1810]/5">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] md:text-xs font-black text-[#6b584b] h-10 px-6">Order</TableHead>
                        <TableHead className="text-[10px] md:text-xs font-black text-[#6b584b] h-10 px-6">Items</TableHead>
                        <TableHead className="text-[10px] md:text-xs font-black text-[#6b584b] h-10 px-6">Status</TableHead>
                        <TableHead className="text-[10px] md:text-xs font-black text-[#6b584b] h-10 px-6">Total</TableHead>
                        <TableHead className="text-right text-[10px] md:text-xs font-black text-[#6b584b] h-10 px-6">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {recentOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-[#d97706]/5 transition-colors border-b border-[#2c1810]/5 last:border-0">
                        <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-[#2c1810]">
                                <Hash className="size-3 text-[#d97706]" />
                                {order.id.substring(0, 7).toUpperCase()}
                            </div>
                            <div className="text-[9px] md:text-[10px] text-[#6b584b] flex items-center gap-1 mt-1 font-medium">
                                <Clock className="size-3" />
                                {order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Pending'}
                            </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                            <div className="flex flex-col gap-0.5 max-w-[120px] md:max-w-none">
                                {order.orderItems?.map((item, index) => (
                                    <div key={index} className="text-[10px] md:text-xs text-[#6b584b] truncate">
                                        <span className="font-black text-[#2c1810]">{item.quantity}x</span> {item.menuItemName}
                                    </div>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                            <Badge variant={getStatusVariant(order.status)} className="text-[8px] md:text-[9px] font-black px-2 py-0.5 border-none uppercase tracking-widest">
                                {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                            <span className="font-black text-xs md:text-sm text-[#2c1810]">LKR {order.totalAmount.toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 md:h-10 md:w-auto md:px-4 rounded-full text-[#d97706] hover:bg-[#d97706] hover:text-white transition-all group" 
                                onClick={() => handleReorder(order)}
                            >
                                <RotateCcw className="h-4 w-4 md:mr-2 transition-transform group-hover:rotate-180 duration-500" /> 
                                <span className="hidden md:inline font-bold">Reorder</span>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
