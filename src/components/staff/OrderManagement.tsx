
'use client';

import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, writeBatch, increment, getDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Order, PointTransaction, UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import AudioNotifier from '../AudioNotifier';
import { serverTimestamp } from 'firebase/firestore';

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [playNewOrderSound, setPlayNewOrderSound] = useState(false);
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);
  
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const isLoading = ordersLoading || usersLoading;

  const customerNames = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
    }, {} as Record<string, string>);
  }, [users]);


  useEffect(() => {
    if (!ordersQuery) return;
    
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        // We only want to play sounds for new orders, not the initial batch.
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const newOrder = change.doc.data() as Order;
                // Only play sound for newly placed orders
                if(newOrder.status === 'Placed') {
                    setPlayNewOrderSound(true);
                }
            }
        });
    });

    return () => unsubscribe();
  }, [ordersQuery]);


  useEffect(() => {
    // Reset the sound trigger after it has been played
    if (playNewOrderSound) {
      const timer = setTimeout(() => setPlayNewOrderSound(false), 1000); // Reset after a second
      return () => clearTimeout(timer);
    }
  }, [playNewOrderSound]);

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    const rootOrderRef = doc(firestore, 'orders', order.id);
    const userOrderRef = doc(firestore, `users/${order.customerId}/orders`, order.id);
    const userProfileRef = doc(firestore, 'users', order.customerId);

    // Update status in both locations
    batch.update(rootOrderRef, { status });
    batch.update(userOrderRef, { status });

    // If order is being marked as Completed, award the points and increment order count
    if (status === 'Completed' && order.status !== 'Completed') {
        const pointsToAward = order.pointsToEarn || 0;
        const updates: any = { orderCount: increment(1) };
        if (pointsToAward > 0) {
            updates.loyaltyPoints = increment(pointsToAward);
            updates.lifetimePoints = increment(pointsToAward);
            
            // Log the point transaction
            const transactionRef = doc(collection(firestore, `users/${order.customerId}/point_transactions`));
            const transactionData: Omit<PointTransaction, 'id'> = {
                date: serverTimestamp() as any,
                description: `Earned from Order #${order.id.substring(0, 7).toUpperCase()}`,
                amount: pointsToAward,
                type: 'earn'
            };
            batch.set(transactionRef, transactionData);
        }
        batch.update(userProfileRef, updates);
    }

    // If order is being rejected, refund any points or credits used
    if (status === 'Rejected' && order.status !== 'Rejected') {
        const pointsToRefund = order.pointsRedeemed || 0;
        if (pointsToRefund > 0) {
            batch.update(userProfileRef, { loyaltyPoints: increment(pointsToRefund) });
             // Log the point transaction
            const transactionRef = doc(collection(firestore, `users/${order.customerId}/point_transactions`));
            const transactionData: Omit<PointTransaction, 'id'> = {
                date: serverTimestamp() as any,
                description: `Refund for Rejected Order #${order.id.substring(0, 7).toUpperCase()}`,
                amount: pointsToRefund,
                type: 'earn' // It's an "earn" from the user's perspective
            };
            batch.set(transactionRef, transactionData);
        }
        
        // If a birthday reward was applied to this order, restore it.
        if (order.birthdayDiscountApplied) {
            const rewardToRestore = order.birthdayDiscountApplied;
            let updates: Partial<UserProfile> = {};
            if (rewardToRestore.type === 'free-item') {
                updates.birthdayFreebieMenuItemIds = rewardToRestore.menuItemIds;
            } else { // fixed or percentage
                updates.birthdayDiscountType = rewardToRestore.type;
                updates.birthdayDiscountValue = rewardToRestore.value;
            }
             batch.update(userProfileRef, updates);
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
    <>
      <AudioNotifier 
        shouldPlay={playNewOrderSound}
        soundUrl="https://www.soundjay.com/button/sounds/button-1.mp3"
        resetCondition={orders?.length}
      />
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
                <TableHead>Customer</TableHead>
                <TableHead>Type / Table</TableHead>
                <TableHead>Items</TableHead>
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
                  <TableCell>{customerNames[order.customerId] || order.customerId.substring(0,7)}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                          <Badge variant={getOrderTypeVariant(order.orderType)}>{order.orderType || 'N/A'}</Badge>
                          {order.tableNumber && <span className='text-sm font-medium'>Table: {order.tableNumber}</span>}
                      </div>
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
    </>
  );
}
