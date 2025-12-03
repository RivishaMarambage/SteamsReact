'use client';

import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
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
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);
  
  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    // Reference to the order in the root /orders collection
    const rootOrderRef = doc(firestore, 'orders', order.id);
    batch.update(rootOrderRef, { status });

    // Reference to the order in the user's subcollection
    const userOrderRef = doc(firestore, `users/${order.customerId}/orders`, order.id);
    batch.update(userOrderRef, { status });
    
    batch.commit()
      .then(() => {
        toast({
          title: 'Order Status Updated',
          description: `Order ${order.id.substring(0, 7)} is now ${status}.`,
        });
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
            path: userOrderRef.path,
            operation: 'update',
            requestResourceData: { status },
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update the order status. Check permissions.',
        });
      });
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Placed':
        return 'secondary';
      case 'Processing':
        return 'outline';
      case 'Ready for Pickup':
        return 'default';
      case 'Completed':
        return 'destructive';
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
                <TableCell>{order.orderDate ? new Date(order.orderDate.toDate()).toLocaleString() : 'N/A'}</TableCell>
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
