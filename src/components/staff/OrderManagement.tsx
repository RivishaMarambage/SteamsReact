
'use client';

import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, writeBatch, increment, getDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Banknote, Globe, QrCode, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Order, PointTransaction, UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import AudioNotifier from '../AudioNotifier';
import { serverTimestamp } from 'firebase/firestore';
import { requestRefund } from '@/ai/flows/payment-flow';

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
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const newOrder = change.doc.data() as Order;
                if(newOrder.status === 'Placed') {
                    setPlayNewOrderSound(true);
                }
            }
        });
    });

    return () => unsubscribe();
  }, [ordersQuery]);


  useEffect(() => {
    if (playNewOrderSound) {
      const timer = setTimeout(() => setPlayNewOrderSound(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [playNewOrderSound]);

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    const rootOrderRef = doc(firestore, 'orders', order.id);
    const userOrderRef = doc(firestore, `users/${order.customerId}/orders`, order.id);
    const userProfileRef = doc(firestore, 'users', order.customerId);

    const updates: Partial<Order> = { status };
    
    // Auto-mark as paid if staff is completing a cash order
    if (status === 'Completed' && order.paymentMethod === 'Cash') {
        updates.paymentStatus = 'Paid';
    }

    batch.update(rootOrderRef, updates);
    batch.update(userOrderRef, updates);

    if (status === 'Completed' && order.status !== 'Completed') {
        const pointsToAward = order.pointsToEarn || 0;
        if (pointsToAward > 0) {
            batch.update(userProfileRef, {
                loyaltyPoints: increment(pointsToAward),
                lifetimePoints: increment(pointsToAward)
            });
            
            const transactionRef = doc(collection(firestore, `users/${order.customerId}/point_transactions`));
            batch.set(transactionRef, {
                date: serverTimestamp(),
                description: `Earned from Order #${order.id.substring(0, 7).toUpperCase()}`,
                amount: pointsToAward,
                type: 'earn'
            });
        }
    }

    if (status === 'Rejected' && order.status !== 'Rejected') {
        if (order.paymentStatus === 'Paid' && order.transactionId && order.paymentMethod !== 'Cash') {
            try {
                await requestRefund(order.transactionId, order.totalAmount);
                toast({
                    title: 'Refund Processed',
                    description: 'The refund has been successfully requested through the payment gateway.'
                });
            } catch (error: any) {
                console.error("Refund failed:", error);
                toast({
                    variant: 'destructive',
                    title: 'Refund Failed',
                    description: `Could not process the refund via Genie. Reason: ${error.message}`
                });
            }
        }
        
        try {
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                const userProfileData = userProfileSnap.data() as UserProfile;
                
                const pointsToRefund = order.pointsRedeemed || 0;
                if (pointsToRefund > 0) {
                    batch.update(userProfileRef, { loyaltyPoints: increment(pointsToRefund) });
                    const transactionRef = doc(collection(firestore, `users/${order.customerId}/point_transactions`));
                    batch.set(transactionRef, {
                        date: serverTimestamp(),
                        description: `Refund for Rejected Order #${order.id.substring(0, 7).toUpperCase()}`,
                        amount: pointsToRefund,
                        type: 'earn'
                    });
                }

                if (order.welcomeOfferApplied) {
                    batch.update(userProfileRef, { orderCount: increment(-1) });
                }

                const redeemedDailyOffers = order.orderItems.map(item => item.appliedDailyOfferId).filter(Boolean) as string[];
                if (redeemedDailyOffers.length > 0) {
                    const currentRedeemed = userProfileData.dailyOffersRedeemed || {};
                    redeemedDailyOffers.forEach(offerId => {
                        delete currentRedeemed[offerId];
                    });
                    batch.update(userProfileRef, { dailyOffersRedeemed: currentRedeemed });
                }
            }
        } catch(e) {
            console.error("Could not process order rejection database rollbacks:", e);
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
      });
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Placed': return 'secondary';
      case 'Processing': return 'outline';
      case 'Ready for Pickup': return 'default';
      case 'Completed': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getOrderTypeVariant = (orderType?: Order['orderType']) => {
    switch (orderType) {
      case 'Dine-in': return 'default';
      case 'Takeaway': return 'outline';
      default: return 'secondary';
    }
  };

  const getPaymentMethodIcon = (method?: Order['paymentMethod']) => {
    switch (method) {
        case 'Cash': return <Banknote className="h-3 w-3" />;
        case 'Online': return <Globe className="h-3 w-3" />;
        case 'QR': return <QrCode className="h-3 w-3" />;
        case 'Wallet': return <Wallet className="h-3 w-3" />;
        default: return null;
    }
  }


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
                <TableHead>Payment</TableHead>
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
                   <TableCell>
                    <div className="flex flex-col gap-1">
                        <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'} className={order.paymentStatus === 'Paid' ? 'bg-green-600' : ''}>
                        {order.paymentStatus || 'Unpaid'}
                        </Badge>
                        <span className="text-[10px] flex items-center gap-1 font-bold uppercase text-muted-foreground">
                            {getPaymentMethodIcon(order.paymentMethod)}
                            {order.paymentMethod || 'Online'}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" disabled={order.status === 'Completed' || order.status === 'Rejected'}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {order.status === 'Placed' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(order, 'Accepting')}>Accept Order</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(order, 'Rejected')}>Reject Order</DropdownMenuItem>
                          </>
                        )}
                        {order.status === 'Accepting' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order, 'Processing')}>Mark as Processing</DropdownMenuItem>
                        )}
                        {order.status === 'Processing' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order, 'Ready for Pickup')}>Mark as Ready for Pickup</DropdownMenuItem>
                        )}
                        {order.status === 'Ready for Pickup' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order, 'Completed')}>Mark as Completed</DropdownMenuItem>
                        )}
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
    </>
  );
}
