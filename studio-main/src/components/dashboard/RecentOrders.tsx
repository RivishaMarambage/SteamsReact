
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { useState, useEffect } from "react";
import AudioNotifier from "../AudioNotifier";

export default function RecentOrders({ userId }: { userId: string }) {
  const firestore = useFirestore();
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

      // Update the status history after processing changes
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
      case 'Placed':
        return 'secondary';
      case 'Processing':
        return 'outline';
      case 'Ready for Pickup':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
          <CardDescription>Your latest pickups from Steamsburry.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    )
  }

  if (!recentOrders || recentOrders.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
          <CardDescription>Your latest pickups from Steamsburry.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
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
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl overflow-hidden relative transition-all duration-300 hover:shadow-2xl hover:shadow-[#d97706]/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2c1810]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="relative z-10 border-b border-[#2c1810]/5 pb-6">
          <CardTitle className="font-headline text-2xl text-[#2c1810]">Recent Orders</CardTitle>
          <CardDescription className="text-[#6b584b]">Your latest pickups from Steamsburry.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          <Table>
            <TableHeader className="bg-[#2c1810]/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-bold text-[#2c1810] pl-6">Order</TableHead>
                <TableHead className="font-bold text-[#2c1810]">Items</TableHead>
                <TableHead className="font-bold text-[#2c1810]">Status</TableHead>
                <TableHead className="font-bold text-[#2c1810] text-right pr-6">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-[#d97706]/5 transition-colors border-b border-[#2c1810]/5 last:border-0 group cursor-pointer">
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-[#2c1810] group-hover:text-[#d97706] transition-colors">{order.id.substring(0, 7).toLocaleUpperCase()}</div>
                    <div className="text-xs text-[#6b584b] font-medium">{order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Date not available'}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1.5 text-sm">
                      {order.orderItems?.map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="font-bold text-[#2c1810] text-xs h-5 w-5 rounded-full bg-[#d97706]/10 flex items-center justify-center shrink-0">{item.quantity}</span>
                          <div>
                            <span className="font-medium text-[#2c1810]">{item.menuItemName}</span>
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-xs text-[#6b584b] mt-0.5">
                                {item.addons.map(addon => `+ ${addon.addonName}`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={getStatusVariant(order.status)} className="shadow-sm">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4 font-bold text-[#2c1810]">LKR {order.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
