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
import { RotateCcw, ShoppingCart } from "lucide-react";
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

  const handleReorder = (order: Order) => {
    const reorderData = order.orderItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        addons: item.addons.map(a => ({
            id: a.addonId,
            name: a.addonName,
            price: a.addonPrice
        })),
        totalPrice: item.totalPrice // this is unit price in our schema
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
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
              <CardDescription>Your latest pickups from Steamsbury.</CardDescription>
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
            <CardDescription>Your latest pickups from Steamsbury.</CardDescription>
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
          <CardDescription>Your latest pickups from Steamsbury.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.id.substring(0, 7).toLocaleUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">{order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Date not available'}</div>
                  </TableCell>
                   <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                          {order.orderItems?.map((item, index) => (
                              <div key={index}>
                                  <span className="font-semibold">{item.quantity}x {item.menuItemName}</span>
                                  {item.addons && item.addons.length > 0 && (
                                      <div className="pl-2 text-muted-foreground">
                                          {item.addons.map(addon => `+ ${addon.addonName}`).join(', ')}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>LKR {order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2" 
                        onClick={() => handleReorder(order)}
                    >
                        <RotateCcw className="h-3 w-3" /> Reorder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}