
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
import { RotateCcw, ShoppingCart, Clock } from "lucide-react";
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
        totalPrice: item.totalPrice
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
         <Card className="shadow-lg rounded-[2rem] sm:rounded-[2.5rem]">
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="font-headline text-xl sm:text-2xl">Recent Orders</CardTitle>
              <CardDescription className="text-sm">Your latest pickups from Steamsbury.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
              <p className="text-muted-foreground text-sm">Loading orders...</p>
            </CardContent>
          </Card>
      )
  }

  if (!recentOrders || recentOrders.length === 0) {
    return (
       <Card className="shadow-lg rounded-[2rem] sm:rounded-[2.5rem]">
          <CardHeader className="p-6 sm:p-8">
            <CardTitle className="font-headline text-xl sm:text-2xl">Recent Orders</CardTitle>
            <CardDescription className="text-sm">Your latest pickups from Steamsbury.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
            <p className="text-muted-foreground text-sm">You haven't placed any orders yet.</p>
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
      <Card className="shadow-lg rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="font-headline text-xl sm:text-2xl uppercase tracking-tight">Recent Orders</CardTitle>
          <CardDescription className="text-sm">Your latest pickups from Steamsbury.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-8 sm:pt-0">
          <div className="w-full overflow-x-auto px-6 sm:px-0 pb-6 sm:pb-0">
            <Table className="min-w-[600px] sm:min-w-full">
                <TableHeader>
                <TableRow>
                    <TableHead className="text-[10px] sm:text-xs">Order</TableHead>
                    <TableHead className="text-[10px] sm:text-xs">Items</TableHead>
                    <TableHead className="text-[10px] sm:text-xs">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs">Total</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="p-4 sm:p-6">
                        <div className="font-bold text-xs sm:text-sm whitespace-nowrap">#{order.id.substring(0, 7).toUpperCase()}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="size-3" />
                            {order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Date N/A'}
                        </div>
                    </TableCell>
                    <TableCell className="p-4 sm:p-6">
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs max-w-[150px] sm:max-w-none">
                            {order.orderItems?.map((item, index) => (
                                <div key={index} className="truncate">
                                    <span className="font-black">{item.quantity}x</span> {item.menuItemName}
                                </div>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="p-4 sm:p-6">
                        <Badge variant={getStatusVariant(order.status)} className="text-[9px] sm:text-[10px] px-2 py-0.5 whitespace-nowrap">
                            {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="p-4 sm:p-6 font-black text-xs sm:text-sm whitespace-nowrap">
                        LKR {order.totalAmount.toFixed(0)}
                    </TableCell>
                    <TableCell className="p-4 sm:p-6 text-right">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 rounded-full text-[10px] font-bold gap-1.5 px-3" 
                            onClick={() => handleReorder(order)}
                        >
                            <RotateCcw className="h-3 w-3" /> <span className="hidden xs:inline">Reorder</span>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
