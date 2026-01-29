
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import type { CartItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { initiatePayment, placeOrderAfterPayment } from '@/ai/flows/payment-flow';


export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useUser();

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
    if (!authUser || !checkoutData) {
        toast({ variant: 'destructive', title: "Error", description: "Could not place order. Missing user or order data."});
        return;
    }
    
    setIsProcessing(true);

    try {
        // Step 1: Call our backend bridge to get a payment token from Genie.
        console.log("Frontend: Collecting order details...");
        console.log("Frontend: Calling backend bridge to get payment token...");
        const paymentResponse = await initiatePayment({ amount: checkoutData.cartTotal });
        const { paymentToken, checkoutUrl } = paymentResponse;
        
        // --- REAL REDIRECT ---
        // In a real application, you would uncomment the following line to redirect the user to Genie.
        // window.location.href = checkoutUrl;

        // For this simulation, we will not redirect and will proceed as if payment was successful.
        console.log(`Frontend: Received payment token. Simulating redirect to Genie web checkout: ${checkoutUrl}`);

        // Step 2: Simulate the user taking time to pay on the Genie page.
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 3: Simulate a successful payment and get a transaction ID.
        // In a real app, Genie would redirect back to a success page on your site with this info.
        const mockTransactionId = `genie_txn_${Date.now()}`;
        console.log(`Genie (Mock): Payment successful. Redirecting back to merchant with transaction ID: ${mockTransactionId}`);
        console.log("Frontend: Received successful payment confirmation.");

        // Step 4: Call our backend bridge again to verify the payment and create the order in Firestore.
        // This is secure because the server verifies the transaction and creates the order, not the client.
        const placeOrderInput = {
            userId: authUser.uid,
            checkoutData: checkoutData,
            transactionId: mockTransactionId
        };
        await placeOrderAfterPayment(placeOrderInput);

        toast({
            title: "Order Placed Successfully!",
            description: `Your ${checkoutData.orderType} order is confirmed and paid.`,
        });
        localStorage.removeItem('checkoutData');
        router.push('/dashboard');

    } catch (error) {
        console.error("Error during checkout process: ", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "There was a problem processing your order. Please contact support.",
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
