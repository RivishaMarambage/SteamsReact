'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { writeBatch, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * SECURITY NOTE: 
 * This page processes order finalization on the client-side for prototype purposes.
 * PRODUCTION UPGRADE: This logic should be moved to a Server Action or Cloud Function
 * triggered by a payment webhook to prevent client-side manipulation of points.
 */

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
      
      const checkoutDataString = localStorage.getItem('checkoutData');
      if (!checkoutDataString) return;

      hasProcessed.current = true;
      localStorage.removeItem('checkoutData');

      try {
        const checkoutData = JSON.parse(checkoutDataString);
        
        const transactionId = searchParams.get('id') || 
                            searchParams.get('transactionId') || 
                            searchParams.get('pg_transaction_id') || 
                            searchParams.get('orderId') || 
                            `txn_${Date.now()}`;
                            
        const paymentStatus = (searchParams.get('state') || searchParams.get('status') || '').toUpperCase();

        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          setErrorMessage(`Payment was not successful. Status: ${paymentStatus}`);
          setStatus('error');
          return;
        }

        const batch = writeBatch(firestore);

        const rootOrderRef = doc(firestore, 'orders', transactionId);
        const userOrderRef = doc(firestore, `users/${authUser.uid}/orders`, transactionId);
        const userProfileRef = doc(firestore, 'users', authUser.uid);

        const orderItems = checkoutData.cart.map((item: any) => ({
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

        const total = checkoutData.cartTotal;
        let pointsToEarn = 0;
        if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
        else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
        else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
        else pointsToEarn = Math.floor(total / 400);

        const orderData = {
            id: transactionId,
            customerId: authUser.uid,
            orderDate: serverTimestamp(),
            totalAmount: total,
            status: "Placed",
            paymentStatus: checkoutData.paymentMethod === 'Cash' ? "Unpaid" : "Paid",
            paymentMethod: checkoutData.paymentMethod || "Online",
            transactionId: transactionId,
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

        const userUpdates: any = {
            loyaltyPoints: increment(-(checkoutData.loyaltyDiscount || 0)),
            orderCount: increment(1),
            birthdayDiscountValue: null,
            birthdayDiscountType: null,
            birthdayFreebieMenuItemIds: []
        };

        const today = format(new Date(), 'yyyy-MM-dd');
        orderItems.forEach((item: any) => {
            if (item.appliedDailyOfferId) {
                userUpdates[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
            }
        });

        batch.update(userProfileRef, userUpdates);

        if (checkoutData.loyaltyDiscount > 0) {
            const transactionRef = doc(collection(firestore, `users/${authUser.uid}/point_transactions`));
            batch.set(transactionRef, {
                date: serverTimestamp(),
                description: `Redeemed for Order #${transactionId.substring(0, 7).toUpperCase()}`,
                amount: -checkoutData.loyaltyDiscount,
                type: 'redeem'
            });
        }

        // NON-BLOCKING COMMIT with standardized error handling
        batch.commit()
          .then(() => {
            setStatus('success');
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: `users/${authUser.uid}/orders/${transactionId}`,
              operation: 'create',
              requestResourceData: orderData,
            });
            errorEmitter.emit('permission-error', permissionError);
            setErrorMessage("Permission denied by security rules. Points or profile could not be updated.");
            setStatus('error');
          });
        
      } catch (error: any) {
        setErrorMessage(error.message || "Unexpected error.");
        setStatus('error');
      }
    };

    processOrder();
  }, [searchParams, authUser, firestore]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-bold">Finalizing Order</h2>
        <p className="text-muted-foreground">Preparing your receipt. Please wait...</p>
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
            <CardTitle className="text-2xl text-destructive">Order Completion Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-4 bg-muted rounded-md text-sm text-left break-all">
                {errorMessage}
            </div>
            <div className="flex flex-col gap-2">
                <Button asChild><Link href="/dashboard/order">Try Again</Link></Button>
                <Button asChild variant="ghost"><Link href="/dashboard">Back to Dashboard</Link></Button>
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
        <CardTitle className="text-3xl text-green-700">Order Confirmed!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6 pb-8">
        <p className="text-muted-foreground">Your order has been sent to our baristas.</p>
         <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild className="px-8"><Link href="/dashboard">Go to Dashboard</Link></Button>
             <Button asChild variant="outline"><Link href="/dashboard/order">Order More</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderSuccessPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh] p-4">
            <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
                <OrderSuccessContent />
            </Suspense>
        </div>
    );
}