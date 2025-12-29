
'use client';

import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, writeBatch, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

    const rootOrderRef = doc(firestore, 'orders', order.id);
    const userOrderRef = doc(firestore, `users/${order.customerId}/orders`, order.id);
    const userProfileRef = doc(firestore, 'users', order.customerId);

    // Update status in both locations
    batch.update(rootOrderRef, { status });
    batch.update(userOrderRef, { status });

    // If order is being marked as Completed, award the points
    if (status === 'Completed' && order.status !== 'Completed' && order.pointsToEarn) {
        batch.update(userProfileRef, {
            loyaltyPoints: increment(order.pointsToEarn),
            lifetimePoints: increment(order.pointsToEarn)
        });
    }

    // If order is being rejected, refund any points or credits used
    if (status === 'Rejected' && order.status !== 'Rejected') {
        const pointsToRefund = order.pointsRedeemed || 0;
        // Assuming discountApplied is the sum of pointsRedeemed and birthdayCredit
        const birthdayCreditToRefund = (order.discountApplied || 0) - pointsToRefund;

        if (pointsToRefund > 0) {
            batch.update(userProfileRef, { loyaltyPoints: increment(pointsToRefund) });
        }
        if (birthdayCreditToRefund > 0) {
            batch.update(userProfileRef, { birthdayCredit: increment(birthdayCreditToRefund) });
        }
    }
    
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
        return 'secondary';
       case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
    const getOrderTypeVariant = (orderType?: Order['orderType']) => {
    switch (orderType) {
      case 'Dine-in':
        return 'default';
      case 'Takeaway':
        return 'outline';
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
              <TableHead>Type</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id} className={order.status === 'Completed' || order.status === 'Rejected' ? 'opacity-60' : ''}>
                <TableCell className="font-medium">{order.id.substring(0, 7).toUpperCase()}</TableCell>
                <TableCell>{order.orderDate ? new Date(order.orderDate.toDate()).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant={getOrderTypeVariant(order.orderType)}>{order.orderType || 'N/A'}</Badge>
                </TableCell>
                <TableCell>{order.tableNumber || 'N/A'}</TableCell>
                <TableCell>LKR {order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    {order.status !== 'Completed' && order.status !== 'Rejected' && (
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(order, 'Rejected')}>
                                Reject Order
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
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
