
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { Order } from "@/lib/types";

export default function RecentOrders({ userId }: { userId: string }) {
  const firestore = useFirestore();
  
  const recentOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
        collection(firestore, `users/${userId}/orders`),
        orderBy("orderDate", "desc"),
        limit(5)
    );
  }, [firestore, userId]);

  const { data: recentOrders, isLoading } = useCollection<Order>(recentOrdersQuery);

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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
        <CardDescription>Your latest pickups from Steamsburry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">LKR {order.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
