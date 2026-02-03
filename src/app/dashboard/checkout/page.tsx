'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import type { CartItem } from '@/lib/types';
import { Loader2, CreditCard, QrCode, Wallet } from 'lucide-react';
import { initiatePayment } from '@/ai/flows/payment-flow';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import QrScanner from '@/components/wallet/QrScanner';


export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
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
        console.log("Frontend: Collecting order details...");
        const origin = window.location.origin;
        console.log("Frontend: Calling dynamic backend bridge...");
        
        // Pass the window.location.origin to the server action so it can build the correct redirect URL
        const paymentResponse = await initiatePayment({ 
          amount: checkoutData.cartTotal,
          origin: origin
        });
        
        const { checkoutUrl } = paymentResponse;
        
        console.log("Redirecting to Genie:", checkoutUrl);
        // Redirect the user to Genie's checkout page
        window.location.href = checkoutUrl;

    } catch (error: any) {
        console.error("Error during checkout process: ", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: error.message || "There was a problem processing your order. Please contact support.",
        });
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
  
  const renderPaymentButton = () => {
    if (paymentMethod === 'qr') {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full">
              <QrCode className="mr-2" />
              Scan QR to Pay
            </Button>
          </DialogTrigger>
          <DialogContent>
            <QrScanner />
          </DialogContent>
        </Dialog>
      );
    }
    return (
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
          `Proceed to Pay LKR ${checkoutData.cartTotal.toFixed(2)}`
        )}
      </Button>
    );
  };

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
                <CardDescription>Select a payment method.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4 mb-6">
                    <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-6 w-6" />
                        <div className="grid gap-1.5">
                            <p className="font-medium">Pay with Card</p>
                            <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                        </div>
                    </Label>
                    <Label htmlFor="qr" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                        <RadioGroupItem value="qr" id="qr" />
                        <QrCode className="h-6 w-6" />
                        <div className="grid gap-1.5">
                            <p className="font-medium">Pay with QR</p>
                            <p className="text-sm text-muted-foreground">Scan to pay with your mobile</p>
                        </div>
                    </Label>
                    <Label htmlFor="wallet" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Wallet className="h-6 w-6" />
                        <div className="grid gap-1.5">
                            <p className="font-medium">Pay with Genie Wallet</p>
                            <p className="text-sm text-muted-foreground">Use your Genie account balance</p>
                        </div>
                    </Label>
                </RadioGroup>

                {renderPaymentButton()}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                    You will be redirected to Genie to complete your payment.
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
