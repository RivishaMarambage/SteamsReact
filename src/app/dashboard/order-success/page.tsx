
'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import type { OrderItem } from '@/lib/types';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const hasProcessed = useRef(false);

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processOrder = async () => {
      if (hasProcessed.current || !authUser || !firestore) return;
      
      const transactionId = searchParams.get('id') || searchParams.get('transactionId') || searchParams.get('orderId');
      const paymentStatus = searchParams.get('state') || searchParams.get('status');

      if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
        setErrorMessage(`Payment was not successful. Status: ${paymentStatus}`);
        setStatus('error');
        return;
      }
      
      const checkoutDataString = localStorage.getItem('checkoutData');
      if (!checkoutDataString) {
        setErrorMessage('We couldn\'t find your order data. If payment was deducted, please contact support.');
        setStatus('error');
        return;
      }

      hasProcessed.current = true;

      try {
        const checkoutData = JSON.parse(checkoutDataString);
        const batch = writeBatch(firestore);

        const rootOrderRef = doc(collection(firestore, 'orders'));
        const userOrderRef = doc(firestore, `users/${authUser.uid}/orders`, rootOrderRef.id);
        const userProfileRef = doc(firestore, 'users', authUser.uid);

        // Map cart items to the database OrderItem schema
        const orderItems: OrderItem[] = checkoutData.cart.map((item: any) => ({
          menuItemId: item.menuItem.id,
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          basePrice: item.menuItem.price,
          totalPrice: item.totalPrice,
          addons: item.addons?.map((a: any) => ({
            addonId: a.id,
            addonName: a.name,
            addonPrice: a.price
          })) || [],
          appliedDailyOfferId: item.appliedDailyOfferId || null
        }));

        // Calculate loyalty points based on business rules
        let pointsToEarn = 0;
        const total = checkoutData.cartTotal;
        if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
        else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
        else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
        else pointsToEarn = Math.floor(total / 400);

        const orderData = {
          id: rootOrderRef.id,
          customerId: authUser.uid,
          orderDate: serverTimestamp(),
          totalAmount: total,
          status: "Placed",
          paymentStatus: "Paid",
          transactionId: transactionId || `txn_${Date.now()}`,
          orderItems: orderItems,
          orderType: checkoutData.orderType,
          tableNumber: checkoutData.tableNumber || '',
          pointsToEarn: pointsToEarn,
          pointsRedeemed: checkoutData.loyaltyDiscount || 0,
          discountApplied: checkoutData.totalDiscount || 0,
          serviceCharge: checkoutData.serviceCharge || 0,
          welcomeOfferApplied: (checkoutData.welcomeDiscountAmount || 0) > 0,
        };

        batch.set(rootOrderRef, orderData);
        batch.set(userOrderRef, orderData);

        // Update user stats and loyalty
        // Deduct redeemed points and increment order count to consume welcome offer
        const userUpdates: any = {
          loyaltyPoints: increment(-(checkoutData.loyaltyDiscount || 0)),
          orderCount: increment(1),
        };

        // Track redeemed daily offers
        const today = format(new Date(), 'yyyy-MM-dd');
        orderItems.forEach(item => {
          if (item.appliedDailyOfferId) {
            userUpdates[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
          }
        });

        batch.update(userProfileRef, userUpdates);

        // Record point redemption if applicable
        if (checkoutData.loyaltyDiscount > 0) {
            const transactionRef = doc(collection(firestore, `users/${authUser.uid}/point_transactions`));
            batch.set(transactionRef, {
                date: serverTimestamp(),
                description: `Redeemed for Order #${rootOrderRef.id.substring(0, 7).toUpperCase()}`,
                amount: -checkoutData.loyaltyDiscount,
                type: 'redeem'
            });
        }

        await batch.commit();
        localStorage.removeItem('checkoutData');
        setStatus('success');
        
      } catch (error: any) {
        console.error("Error finalizing order:", error);
        setErrorMessage(error.message || "An unexpected error occurred while finalizing your order.");
        setStatus('error');
      }
    };

    processOrder();
  }, [searchParams, authUser, firestore, router]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-bold font-headline">Finalizing Your Order</h2>
        <p className="text-muted-foreground">We're recording your transaction and preparing your receipt. Please stay on this page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
       <Card className="w-full max-w-lg mx-auto border-destructive shadow-xl">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-headline text-destructive">Order Completion Failed</CardTitle>
            <CardDescription>Something went wrong after your payment was processed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-4 bg-muted rounded-md text-sm text-left font-mono break-all">
                {errorMessage}
            </div>
            <p className="text-sm text-muted-foreground">
                If money was deducted from your account, please keep your transaction ID handy and contact our staff.
            </p>
            <div className="flex flex-col gap-2">
                <Button asChild variant="default">
                    <Link href="/dashboard/order">Try Ordering Again</Link>
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-green-500 shadow-2xl overflow-hidden">
      <div className="h-2 bg-green-500 w-full" />
      <CardHeader className="text-center pt-8">
         <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
         </div>
        <CardTitle className="text-3xl font-headline text-green-700">Order Confirmed!</CardTitle>
        <CardDescription>Thank you for your purchase.</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-6 pb-8">
        <div className="space-y-2">
            <p className="text-lg">Your coffee journey continues!</p>
            <p className="text-muted-foreground">Your order has been sent to our baristas. You'll receive a notification when it's ready for pickup.</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p className="font-semibold text-primary">Steam Points Incoming!</p>
            <p>Your points will be added once our staff completes your order.</p>
        </div>

         <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild className="px-8">
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/dashboard/order">Order More</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderSuccessPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh] p-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <h2 className="text-2xl font-bold font-headline">Loading...</h2>
                </div>
            }>
                <OrderSuccessContent />
            </Suspense>
        </div>
    );
}
