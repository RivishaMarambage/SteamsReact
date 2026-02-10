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
         <Card className="shadow-lg border-none bg-white">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Recent Orders</CardTitle>
              <CardDescription>Fetching your history...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
              </div>
            </CardContent>
          </Card>
      )
  }

  if (!recentOrders || recentOrders.length === 0) {
    return (
       <Card className="shadow-lg border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Recent Orders</CardTitle>
            <CardDescription>No orders yet. Ready for your first brew?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12">
            <div className="bg-muted p-6 rounded-full mb-4">
                <ShoppingCart className="size-8 text-muted-foreground opacity-40" />
            </div>
            <Button asChild variant="outline">
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
      <Card className="shadow-lg overflow-hidden border-none bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-xl md:text-2xl uppercase tracking-tight">Recent Orders</CardTitle>
          <CardDescription>Track your active and previous orders.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentOrders.map(order => (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <Hash className="size-3 text-primary" />
                            {order.id.substring(0, 7).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                            <Clock className="size-3" />
                            {order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Pending'}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[120px] md:max-w-none">
                            {order.orderItems?.map((item, index) => (
                                <div key={index} className="text-xs text-muted-foreground truncate">
                                    <span className="font-bold text-foreground">{item.quantity}x</span> {item.menuItemName}
                                </div>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="uppercase tracking-widest text-[9px] font-black">
                            {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <span className="font-bold">LKR {order.totalAmount.toFixed(0)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-primary hover:text-primary transition-all group" 
                            onClick={() => handleReorder(order)}
                        >
                            <RotateCcw className="h-4 w-4 md:mr-2 transition-transform group-hover:rotate-180" /> 
                            <span className="hidden md:inline">Reorder</span>
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