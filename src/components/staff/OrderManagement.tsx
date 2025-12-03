'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Query all orders from the root 'orders' collection, ordered by date
  const ordersRef = collection(firestore, 'orders');
  const q = query(ordersRef, orderBy('orderDate', 'desc'));
  const { data: orders, isLoading } = useCollection(q);

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    // Reference to the order in the root /orders collection
    const rootOrderRef = doc(firestore, 'orders', order.id);
    // Reference to the order in the user's subcollection
    const userOrderRef = doc(firestore, `users/${order.customerId}/orders`, order.id);
    
    try {
      // Update both documents for consistency
      await updateDoc(rootOrderRef, { status });
      await updateDoc(userOrderRef, { status });

      toast({
        title: 'Order Status Updated',
        description: `Order ${order.id.substring(0, 7)} is now ${status}.`,
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the order status.',
      });
    }
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Placed':
        return 'secondary';
      case 'Processing':
        return 'default';
      case 'Ready for Pickup':
        return 'outline'; // A different color might be better, e.g., a custom green
      case 'Completed':
        return 'destructive'; // Using destructive to indicate it's "done" and out of the active queue
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming Orders</CardTitle>
        <CardDescription>Manage and update the status of customer orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.substring(0, 7).toUpperCase()}</TableCell>
                <TableCell>{new Date(order.orderDate.toDate()).toLocaleString()}</TableCell>
                <TableCell>Rs. {order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleStatusChange(order, 'Processing')}>
                        Mark as Processing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(order, 'Ready for Pickup')}>
                        Mark as Ready
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(order, 'Completed')}>
                        Mark as Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders?.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
                No orders found.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
