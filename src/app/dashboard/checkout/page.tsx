
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, writeBatch, getDoc } from 'firebase/firestore';
import type { Order, CartItem, UserProfile, PointTransaction, OrderItem } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Mock Genie API payment function that simulates a secure, multi-step production flow.
const processGeniePayment = async (amount: number): Promise<{ success: boolean; transactionId?: string }> => {
  console.log("Frontend: Collecting order details...");
  console.log("Frontend: Calling backend bridge to get payment token...");

  // Simulate calling the backend bridge to securely get a token
  await new Promise(resolve => setTimeout(resolve, 1500));
  const mockPaymentToken = `genie_token_${Date.now()}`;
  console.log(`Backend Bridge (Mock): Sent request to Genie with secret credentials and received token: ${mockPaymentToken}`);
  
  console.log("Frontend: Received payment token. Simulating redirect to Genie web checkout for user to complete payment...");
  
  // Simulate the user taking time to pay on the Genie page
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate Genie sending a callback to our backend webhook, and our backend verifying it.
  console.log("Genie (Mock): Payment successful. Sending callback to merchant's webhook...");
  console.log("Backend (Mock): Webhook received. Verifying signature and preparing to confirm payment...");

  // Simulate final success/failure
  if (Math.random() > 0.1) { // 90% success rate
    console.log("Frontend: Payment verification successful.");
    return { success: true, transactionId: `genie_txn_${Date.now()}` };
  } else {
    console.log("Frontend: Payment verification failed.");
    return { success: false };
  }
};


export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const data = localStorage.getItem('checkoutData');
    if (data) {
      setCheckoutData(JSON.parse(data));
    } else {
      // If no checkout data, redirect back to order page
      router.replace('/dashboard/order');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    if (!authUser || !firestore || !checkoutData) {
        toast({ variant: 'destructive', title: "Error", description: "Could not place order. Please try again."});
        return;
    }
    
    setIsProcessing(true);

    // Step 1: Process payment using the simulated secure Genie flow
    const paymentResult = await processGeniePayment(checkoutData.cartTotal);

    if (!paymentResult.success) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was a problem with your payment. Please try again.",
      });
      setIsProcessing(false);
      return;
    }

    // Step 2: If payment is successful, create order in Firestore
    try {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        
        const batch = writeBatch(firestore);
        
        const rootOrderRef = doc(collection(firestore, 'orders'));

        let pointsToEarn = 0;
        if (checkoutData.cartTotal > 10000) {
            pointsToEarn = Math.floor(checkoutData.cartTotal / 100) * 2;
        } else if (checkoutData.cartTotal >= 5000) {
            pointsToEarn = Math.floor(checkoutData.cartTotal / 100);
        } else if (checkoutData.cartTotal >= 1000) {
            pointsToEarn = Math.floor(checkoutData.cartTotal / 200);
        } else if (checkoutData.cartTotal > 0) {
            pointsToEarn = Math.floor(checkoutData.cartTotal / 400);
        }

        const orderItems: OrderItem[] = checkoutData.cart.map((cartItem: CartItem) => ({
          menuItemId: cartItem.menuItem.id,
          menuItemName: cartItem.menuItem.name,
          quantity: cartItem.quantity,
          basePrice: cartItem.menuItem.price,
          addons: cartItem.addons.map(addon => ({
              addonId: addon.id,
              addonName: addon.name,
              addonPrice: addon.price
          })),
          totalPrice: cartItem.totalPrice,
          ...(cartItem.appliedDailyOfferId && { appliedDailyOfferId: cartItem.appliedDailyOfferId }),
        }));
        
        const orderData: Omit<Order, 'id' | 'orderDate'> & { orderDate: any } = {
            customerId: authUser.uid,
            orderDate: serverTimestamp(),
            totalAmount: checkoutData.cartTotal,
            status: "Placed",
            paymentStatus: "Paid", // Set payment status to Paid
            orderItems: orderItems,
            orderType: checkoutData.orderType,
            pointsRedeemed: checkoutData.loyaltyDiscount,
            discountApplied: checkoutData.totalDiscount,
            serviceCharge: checkoutData.serviceCharge,
            pointsToEarn: pointsToEarn,
            ...(checkoutData.orderType === 'Dine-in' && checkoutData.tableNumber && { tableNumber: checkoutData.tableNumber }),
            ...(checkoutData.welcomeDiscountAmount > 0 && { welcomeOfferApplied: true }),
        };
        
        batch.set(rootOrderRef, orderData);
        const userOrderRef = doc(firestore, `users/${authUser.uid}/orders`, rootOrderRef.id);
        batch.set(userOrderRef, orderData);

        const updates: any = {};
        
        if (checkoutData.loyaltyDiscount > 0) {
            updates.loyaltyPoints = increment(-checkoutData.loyaltyDiscount);
            const transactionRef = doc(collection(firestore, `users/${authUser.uid}/point_transactions`));
            const transactionData: Omit<PointTransaction, 'id'> = {
                date: serverTimestamp() as any,
                description: `Redeemed on Order #${rootOrderRef.id.substring(0, 7).toUpperCase()}`,
                amount: -checkoutData.loyaltyDiscount,
                type: 'redeem'
            };
            batch.set(transactionRef, transactionData);
        }

        if (checkoutData.birthdayDiscountAmount > 0) {
            updates.birthdayDiscountValue = null;
            updates.birthdayDiscountType = null;
        }

        if (checkoutData.welcomeDiscountAmount > 0) {
            updates.orderCount = increment(1);
        }
        
        const redeemedDailyOffers = orderItems
            .map((item: any) => item.appliedDailyOfferId)
            .filter((id?: string): id is string => !!id);
        
        if (redeemedDailyOffers.length > 0) {
            const todayString = format(new Date(), 'yyyy-MM-dd');
            redeemedDailyOffers.forEach((offerId: string) => {
                updates[`dailyOffersRedeemed.${offerId}`] = todayString;
            });
        }

        if (Object.keys(updates).length > 0) {
            batch.update(userDocRef, updates);
        }
        
        await batch.commit();

        toast({
            title: "Order Placed Successfully!",
            description: `Your ${checkoutData.orderType} order is confirmed and paid.`,
        });
        localStorage.removeItem('checkoutData');
        router.push('/dashboard');

    } catch (error) {
        console.error("Error placing order: ", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "There was a problem saving your order after payment. Please contact support.",
        });
    } finally {
        setIsProcessing(false);
    }
  }

  if (!checkoutData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Checkout</h1>
        <p className="text-muted-foreground">Please review your order and complete the payment.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {checkoutData.cart.map((item: CartItem) => (
                         <div key={item.id} className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                                {item.addons.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {item.addons.map(a => `+ ${a.name}`).join(', ')}
                                </p>
                                )}
                            </div>
                            <p>LKR {(item.totalPrice * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <Separator />
                 <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>LKR {checkoutData.subtotal.toFixed(2)}</span>
                    </div>
                    {checkoutData.serviceCharge > 0 && (
                    <div className="flex justify-between">
                        <span>Service Charge (10%)</span>
                        <span>LKR {checkoutData.serviceCharge.toFixed(2)}</span>
                    </div>
                    )}
                    {checkoutData.totalDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span>Discount</span>
                        <span>- LKR {checkoutData.totalDiscount.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total to Pay</span>
                        <span>LKR {checkoutData.cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Complete your purchase using our secure payment provider.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    size="lg" 
                    className="w-full" 
                    disabled={isProcessing}
                    onClick={handlePlaceOrder}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Payment...
                        </>
                    ) : (
                        `Pay LKR ${checkoutData.cartTotal.toFixed(2)}`
                    )}
                </Button>
                 <div className="mt-4 text-center text-xs text-muted-foreground">
                    Powered by Genie
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
